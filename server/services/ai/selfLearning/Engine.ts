import { EventEmitter } from 'events'
import tf from '../tf'
import fs from 'fs'
import path from 'path'
import { Experience, ExperienceReplayBuffer } from './Memory'
import { AdapterRegistry, ActionDefinition, ExecutionResult } from './Adapters'
import { ValuePolicy, ValueWeights, defaultWeights } from './ValuePolicy'
import { RateLimiter, Semaphore } from './Limiter'
import { logDecision, logAction, logWeights, logTrainer, logExperience } from './Persistence'
import { alignmentModel } from './Alignment'
import { buildPolicyModel, PolicyArchitectureId, listPolicyArchitectures } from './PolicyArchitectures'
import { permissionManager } from '../../trust/PermissionManager'

export interface EngineConfig {
  stateSize: number
  actionSize: number
  gamma?: number
  learningRate?: number
  epsilonStart?: number
  epsilonMin?: number
  epsilonDecay?: number
  batchSize?: number
  targetUpdateEvery?: number
  modelDir?: string
  policyArchitectureId?: PolicyArchitectureId
}

export type DecideResult = { actionIndex: number; qValues: number[] }
export type ActResult = DecideResult & { result: ExecutionResult; reward: number }

export class SelfLearningEngine extends EventEmitter {
  private model: any | null = null
  private targetModel: any | null = null
  private memory = new ExperienceReplayBuffer(4000)
  private adapters = new AdapterRegistry()
  private valuePolicy = new ValuePolicy()
  private trainLimiter = new RateLimiter(2)
  private trainSemaphore = new Semaphore(1)
  private resourcePolicy = { maxRps: 2, maxConcurrent: 1, maxHeapMB: 512 }
  private policyArchitectureId: PolicyArchitectureId = 'dqn_mlp'

  private cfg: Required<EngineConfig> = {
    stateSize: 16,
    actionSize: 4,
    gamma: 0.95,
    learningRate: 1e-3,
    epsilonStart: 0.9,
    epsilonMin: 0.05,
    epsilonDecay: 0.995,
    batchSize: 32,
    targetUpdateEvery: 200,
    modelDir: path.join(process.cwd(), 'data', 'models', 'selflearning'),
    policyArchitectureId: 'dqn_mlp'
  }

  private epsilon = this.cfg.epsilonStart
  private steps = 0
  private training = false
  private trainerHandle: NodeJS.Timeout | null = null
  private lastLoss: number | null = null

  constructor() {
    super()
    this.valuePolicy.on('weights', w => { this.emit('event', { type: 'weights', weights: w }); void logWeights(w).catch(() => {}) })
  }

  async initializeIfNeeded(stateSize?: number, actionSize?: number): Promise<void> {
    if (this.model && this.targetModel) return
    if (stateSize) this.cfg.stateSize = stateSize
    if (actionSize) this.cfg.actionSize = actionSize
    await this.ensureModelDir()
    const exists = fs.existsSync(path.join(this.cfg.modelDir, 'model.json'))
    if (exists) {
      await this.load()
    } else {
      await this.build()
      await this.save().catch(() => {})
    }
  }

  configure(next: Partial<EngineConfig>): void {
    this.cfg = { ...this.cfg, ...(next as any) }
  }

  setResourcePolicy(next: { maxRps?: number; maxConcurrent?: number; maxHeapMB?: number }): void {
    if (typeof next.maxRps === 'number') this.trainLimiter.setRate(Math.max(0.1, next.maxRps))
    if (typeof next.maxConcurrent === 'number') this.trainSemaphore.setLimit(Math.max(1, Math.floor(next.maxConcurrent)))
    if (typeof next.maxHeapMB === 'number') this.resourcePolicy.maxHeapMB = Math.max(64, Math.floor(next.maxHeapMB))
    if (typeof next.maxRps === 'number') this.resourcePolicy.maxRps = Math.max(0.1, next.maxRps)
    if (typeof next.maxConcurrent === 'number') this.resourcePolicy.maxConcurrent = Math.max(1, Math.floor(next.maxConcurrent))
  }

  getWeights(): ValueWeights { return this.valuePolicy.getWeights() }
  setWeights(next: Partial<ValueWeights>): ValueWeights { return this.valuePolicy.setWeights(next) }

  getStatus() {
    return {
      stateSize: this.cfg.stateSize,
      actionSize: this.cfg.actionSize,
      epsilon: this.epsilon,
      steps: this.steps,
      memory: this.memory.size(),
      training: this.training,
      lastLoss: this.lastLoss,
      modelDir: this.cfg.modelDir,
      resourcePolicy: this.resourcePolicy,
      policyArchitectureId: this.policyArchitectureId
    }
  }

  async decide(state: number[] | Float32Array, candidateActions?: ActionDefinition[], explore = true): Promise<DecideResult> {
    await this.initializeIfNeeded()
    const s = this.toTensor(state)
    const q = (this.model as any).predict(s) as any
    const qVals = Array.from(await q.data()) as number[]
    s.dispose(); q.dispose()

    // Adjust Q-values with simple value-policy risk penalty if actions provided
    if (candidateActions && candidateActions.length > 0) {
      for (let i = 0; i < Math.min(qVals.length, candidateActions.length); i++) {
        const a = candidateActions[i]
        const risk = Math.max(0, Math.min(1, a.riskLevel ?? 0))
        const w = this.valuePolicy.getWeights()
        qVals[i] -= risk * 0.5 * w.morality
      }
    }

    // Alignment shaping: boost actions that align with kindness/empathy/helpfulness/morality
    if (candidateActions && candidateActions.length > 0) {
      const w2 = this.valuePolicy.getWeights()
      const alignStrength = Math.max(0, Math.min(1, (w2.morality + w2.kindness + w2.empathy + w2.helpfulness)))
      for (let i = 0; i < Math.min(qVals.length, candidateActions.length); i++) {
        const s = alignmentModel.scoreForAction(candidateActions[i], w2)
        qVals[i] += (s - 0.5) * 0.5 * alignStrength
      }
    }

    let actionIndex: number
    if (explore && Math.random() < this.epsilon) {
      actionIndex = Math.floor(Math.random() * this.cfg.actionSize)
    } else {
      actionIndex = qVals.reduce((best, val, idx, arr) => val > arr[best] ? idx : best, 0)
    }

    const out = { actionIndex, qValues: qVals }
    void logDecision({ stateSize: this.cfg.stateSize, actionSize: this.cfg.actionSize, actionIndex, qValues: qVals }).catch(() => {})
    return out
  }

  async decideAndExecute(state: number[] | Float32Array, actions: ActionDefinition[], explore = true): Promise<ActResult> {
    if (!actions || actions.length === 0) throw new Error('No actions provided')
    await this.initializeIfNeeded(state.length, actions.length)

    const { actionIndex, qValues } = await this.decide(state, actions, explore)
    const chosen = actions[actionIndex]

    // Safety gate
    const allowed = this.valuePolicy.allowed({ riskLevel: chosen.riskLevel ?? 0, tags: chosen.tags })
    if (!allowed) {
      const blocked = { actionIndex, qValues, result: { ok: false, error: 'blocked_by_value_policy' } as ExecutionResult, reward: -0.2 }
      void logAction({ actionIndex, action: chosen, ok: false, reward: -0.2, result: blocked.result }).catch(() => {})
      return blocked
    }

    // Level-3 trust prompt for high-impact actions
    const highImpact = (chosen.riskLevel ?? 0) >= 0.8 || (chosen.tags || []).some(t => /pay|purchase|book|financial|transfer|delete|shutdown/i.test(String(t)))
    if (highImpact) {
      const prompt = permissionManager.createPrompt({
        level: 3,
        title: `Confirm: ${chosen.name || chosen.type}`,
        rationale: `High-impact action requested. Risk ${(chosen.riskLevel ?? 0).toFixed(2)}. Tags: ${(chosen.tags || []).join(', ')}`,
        options: ['approve','reject','delay'],
        meta: { action: chosen }
      })
      const decision = await permissionManager.waitForDecision(prompt.id, 120000)
      if (decision !== 'approve') {
        const blocked = { actionIndex, qValues, result: { ok: false, error: `blocked_by_user_${decision}` } as ExecutionResult, reward: -0.1 }
        void logAction({ actionIndex, action: chosen, ok: false, reward: -0.1, result: blocked.result }).catch(() => {})
        return blocked
      }
    }

    const result = await this.adapters.execute(chosen)
    let reward = this.valuePolicy.reward({ tags: chosen.tags, riskLevel: chosen.riskLevel, success: result.ok })
    const alignScore = alignmentModel.scoreForAction(chosen, this.valuePolicy.getWeights())
    reward += (alignScore - 0.5) * 0.5

    // Record experience with a dummy nextState equal to current for now; callers can update with nextState via updateLastExperience
    const st = this.ensureFloat32(state)
    const next = st // placeholder if environment doesn't provide
    const exp: Experience = { state: st, actionIndex, reward, nextState: next, done: false }
    this.memory.add(exp)
    void logExperience({ state: Array.from(st), actionIndex, reward, nextState: Array.from(next), done: false }).catch(() => {})

    // Epsilon decay
    if (this.epsilon > this.cfg.epsilonMin) this.epsilon *= this.cfg.epsilonDecay

    this.emit('event', { type: 'act', actionIndex, action: chosen, ok: result.ok })
    void logAction({ actionIndex, action: chosen, ok: result.ok, reward, result }).catch(() => {})

    // Light async background train
    void this.trainStep().catch(() => {})

    return { actionIndex, qValues, result, reward }
  }

  updateLastExperience(nextState: number[] | Float32Array, done = false) {
    // Optionally called by environment to update the last inserted experience's nextState and done
    // For simplicity, just add a new transition using the latest action; advanced tracking can be added later
    const st = this.ensureFloat32(nextState)
    this.memory.add({ state: st, actionIndex: Math.floor(Math.random() * this.cfg.actionSize), reward: 0, nextState: st, done })
  }

  async trainStep(iterations = 1, batchSize = this.cfg.batchSize): Promise<number> {
    await this.initializeIfNeeded()
    if (!this.model || this.memory.size() < Math.max(8, batchSize)) return 0
    await this.trainLimiter.removeTokens(1)
    await this.trainSemaphore.acquire()
    try {
      const mem = process.memoryUsage?.().heapUsed ?? 0
      const heapMB = mem / 1024 / 1024
      if (heapMB > this.resourcePolicy.maxHeapMB) return 0

      let lossValue = 0
      for (let it = 0; it < iterations; it++) {
        const batch = this.memory.sample(batchSize)
        const states = tf.tensor2d(batch.map(b => Array.from(b.state)), [batch.length, this.cfg.stateSize])
        const nextStates = tf.tensor2d(batch.map(b => Array.from(b.nextState)), [batch.length, this.cfg.stateSize])

        const qNext = (this.targetModel as any).predict(nextStates) as any
        const maxNext = tf.max(qNext, 1)

        const qPred = (this.model as any).predict(states) as any
        const qTarget = qPred.arraySync() as number[][]

        for (let i = 0; i < batch.length; i++) {
          const b = batch[i]
          const maxNextVal = (maxNext.arraySync() as number[])[i]
          const target = b.done ? b.reward : b.reward + this.cfg.gamma * maxNextVal
          qTarget[i][b.actionIndex] = target
        }

        const y = tf.tensor2d(qTarget, [batch.length, this.cfg.actionSize])

        const history = await (this.model as any).fit(states, y, { epochs: 1, batchSize: Math.min(32, batch.length), verbose: 0 })
        lossValue = (history.history.loss?.[0] as number) || 0

        states.dispose(); nextStates.dispose(); qNext.dispose(); maxNext.dispose(); qPred.dispose(); y.dispose()

        this.steps++
        if (this.steps % this.cfg.targetUpdateEvery === 0) await this.updateTarget()
      }

      this.lastLoss = lossValue
      this.emit('trained', { loss: lossValue, steps: this.steps })
      return lossValue
    } finally {
      this.trainSemaphore.release()
    }
  }

  startTrainer(intervalMs = 1000): void {
    if (this.trainerHandle) return
    this.training = true
    this.trainerHandle = setInterval(() => { void this.trainStep().catch(() => {}) }, Math.max(200, intervalMs))
    this.emit('event', { type: 'trainer', status: 'started', intervalMs })
    void logTrainer('started', intervalMs).catch(() => {})
  }

  stopTrainer(): void {
    if (this.trainerHandle) clearInterval(this.trainerHandle)
    this.trainerHandle = null
    this.training = false
    this.emit('event', { type: 'trainer', status: 'stopped' })
    void logTrainer('stopped').catch(() => {})
  }

  async save(): Promise<void> {
    await this.ensureModelDir()
    await (this.model as any).save('file://' + this.cfg.modelDir)
  }

  async load(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('file://' + path.join(this.cfg.modelDir, 'model.json'))
      await this.buildTargetFromModel()
    } catch {
      await this.build()
    }
  }

  private async ensureModelDir() {
    fs.mkdirSync(this.cfg.modelDir, { recursive: true })
  }

  private async build(): Promise<void> {
    const model = buildPolicyModel(this.policyArchitectureId, {
      stateSize: this.cfg.stateSize,
      actionSize: this.cfg.actionSize,
      learningRate: this.cfg.learningRate,
    })
    this.model = model
    await this.buildTargetFromModel()
  }

  private async buildTargetFromModel() {
    const target = buildPolicyModel(this.policyArchitectureId, {
      stateSize: this.cfg.stateSize,
      actionSize: this.cfg.actionSize,
      learningRate: this.cfg.learningRate,
    })

    // Copy weights from model if exists
    if (this.model) {
      const weights = this.model.getWeights()
      target.setWeights(weights.map(w => w.clone()))
    }

    this.targetModel = target
  }

  private async updateTarget() {
    if (!this.model || !this.targetModel) return
    const w = this.model.getWeights()
    this.targetModel.setWeights(w.map(v => v.clone()))
  }

  private toTensor(state: number[] | Float32Array): any {
    const arr = this.ensureFloat32(state)
    return tf.tensor2d([Array.from(arr)], [1, this.cfg.stateSize])
  }

  private ensureFloat32(x: number[] | Float32Array): Float32Array {
    if (x instanceof Float32Array) return x
    const arr = new Float32Array(this.cfg.stateSize)
    for (let i = 0; i < Math.min(x.length, this.cfg.stateSize); i++) arr[i] = x[i]
    return arr
  }

  public ingestExperience(exp: { state: number[] | Float32Array; actionIndex: number; reward: number; nextState: number[] | Float32Array; done: boolean }): void {
    const st = this.ensureFloat32(exp.state)
    const nx = this.ensureFloat32(exp.nextState)
    this.memory.add({ state: st, actionIndex: exp.actionIndex, reward: exp.reward, nextState: nx, done: exp.done })
    void logExperience({ state: Array.from(st), actionIndex: exp.actionIndex, reward: exp.reward, nextState: Array.from(nx), done: exp.done }).catch(() => {})
  }

  getPolicyArchitecture() {
    return {
      id: this.policyArchitectureId,
      available: listPolicyArchitectures()
    }
  }
}

export const selfLearningEngine = new SelfLearningEngine()
