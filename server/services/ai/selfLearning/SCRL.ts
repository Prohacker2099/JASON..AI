import { EventEmitter } from 'events'
import tf from '../tf'
import { SelfLearningEngine } from './Engine'

export interface SCRLState {
  domain: string
  context: string[]
  securityLevel: number
  timestamp: number
  performance: number
}

export interface SCRLExperience {
  id: string
  state: SCRLState
  action: string
  reward: number
  nextState: SCRLState
  timestamp: number
}

export interface SCRLConfig {
  learningRate: number
  discountFactor: number
  explorationRate: number
  memorySize: number
  batchSize: number
  targetUpdateFrequency: number
}

const DEFAULT_CONFIG: SCRLConfig = {
  learningRate: 0.001,
  discountFactor: 0.95,
  explorationRate: 0.1,
  memorySize: 10000,
  batchSize: 32,
  targetUpdateFrequency: 100
}

export class SCRLEngine extends EventEmitter {
  private config: SCRLConfig
  private selfLearningEngine: SelfLearningEngine
  private experiences: SCRLExperience[] = []
  private qNetwork: any | null = null
  private targetNetwork: any | null = null
  private optimizer: any | null = null
  private stepCount = 0

  constructor(selfLearningEngine: SelfLearningEngine, config: Partial<SCRLConfig> = {}) {
    super()
    this.selfLearningEngine = selfLearningEngine
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeNetworks()
  }

  private initializeNetworks(): void {
    // Create Q-network for domain-aware decision making
    const qNetwork = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [20], // State representation size
          units: 128,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'linear' }) // Action space
      ]
    })

    // Create target network for stable training
    const targetNetwork = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [20],
          units: 128,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'linear' }) // Action space
      ]
    })

    this.qNetwork = qNetwork
    this.targetNetwork = targetNetwork
    this.optimizer = tf.train.adam(this.config.learningRate)

    // Initialize target network weights
    this.updateTargetNetwork()
  }

  private encodeState(state: SCRLState): any {
    const features = [
      // Domain encoding (one-hot)
      ...this.encodeDomain(state.domain),
      // Context features
      state.context.length / 10,
      state.context.join(' ').length / 100,
      // Security level
      state.securityLevel / 5,
      // Time features
      new Date(state.timestamp).getHours() / 24,
      new Date(state.timestamp).getDay() / 7,
      // Performance metrics
      state.performance,
      // Additional features
      Math.random() * 0.1, // Placeholder for more features
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1
    ]

    return tf.tensor2d([features])
  }

  private encodeDomain(domain: string): number[] {
    const domains = ['travel', 'finance', 'health', 'education', 'entertainment']
    const encoding = new Array(domains.length).fill(0)
    const index = domains.indexOf(domain)
    if (index !== -1) encoding[index] = 1
    return encoding
  }

  async selectAction(state: SCRLState): Promise<string> {
    if (!this.qNetwork) {
      return `action_${Math.floor(Math.random() * 16)}` // Random action string
    }

    // Epsilon-greedy exploration
    if (Math.random() < this.config.explorationRate) {
      return `action_${Math.floor(Math.random() * 16)}` // Random action string
    }

    const stateTensor = this.encodeState(state)
    const qValues = this.qNetwork.predict(stateTensor) as any
    const qValuesArray = await qValues.data()

    stateTensor.dispose()
    qValues.dispose()

    const actionIndex = qValuesArray.indexOf(Math.max(...qValuesArray))
    return `action_${actionIndex}` // Generic action string
  }

  async addExperience(
    state: SCRLState,
    action: string,
    reward: number,
    nextState: SCRLState
  ): Promise<void> {
    const experience: SCRLExperience = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      state,
      action,
      reward,
      nextState,
      timestamp: Date.now()
    }

    this.experiences.push(experience)

    // Keep only recent experiences
    if (this.experiences.length > this.config.memorySize) {
      this.experiences = this.experiences.slice(-this.config.memorySize)
    }

    this.emit('experience_added', experience)

    // Train if we have enough experiences
    if (this.experiences.length >= this.config.batchSize) {
      console.log(`[SCRL] Training triggered with ${this.experiences.length} experiences...`)
      await this.train()
    }
  }

  private async train(): Promise<void> {
    if (!this.qNetwork || !this.targetNetwork || !this.optimizer) return

    // Sample random experiences
    const batch = this.sampleBatch()

    // Prepare training data
    const states = tf.tensor2d(batch.map(exp => this.encodeStateToArray(exp.state)))
    const nextStates = tf.tensor2d(batch.map(exp => this.encodeStateToArray(exp.nextState)))

    // Get current Q-values
    const currentQValues = this.qNetwork.predict(states) as any
    const nextQValues = this.targetNetwork.predict(nextStates) as any

    // Calculate target Q-values
    const targets = this.calculateTargets(batch, currentQValues, nextQValues)

    // Train the network
    const history = await this.qNetwork.fit(states, targets, {
      batchSize: this.config.batchSize,
      epochs: 1,
      verbose: 0
    })

    // Clean up tensors
    states.dispose()
    nextStates.dispose()
    currentQValues.dispose()
    nextQValues.dispose()
    targets.dispose()

    // Update target network periodically
    this.stepCount++
    if (this.stepCount % this.config.targetUpdateFrequency === 0) {
      this.updateTargetNetwork()
    }

    this.emit('training_step', {
      loss: history.history.loss?.[0] || 0,
      stepCount: this.stepCount,
      experienceCount: this.experiences.length
    })
  }

  private sampleBatch(): SCRLExperience[] {
    const batchSize = Math.min(this.config.batchSize, this.experiences.length)
    const batch: SCRLExperience[] = []

    for (let i = 0; i < batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.experiences.length)
      batch.push(this.experiences[randomIndex])
    }

    return batch
  }

  private encodeStateToArray(state: SCRLState): number[] {
    const features = [
      ...this.encodeDomain(state.domain),
      state.context.length / 10,
      state.context.join(' ').length / 100,
      state.securityLevel / 5,
      new Date(state.timestamp).getHours() / 24,
      new Date(state.timestamp).getDay() / 7,
      state.performance,
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1
    ]
    return features
  }

  private calculateTargets(
    batch: SCRLExperience[],
    currentQValues: any,
    nextQValues: any
  ): any {
    const currentArray = currentQValues.arraySync() as number[][]
    const nextArray = nextQValues.arraySync() as number[][]

    const targets = batch.map((exp, index) => {
      const currentQs = currentArray[index]
      const nextQs = nextArray[index]
      const maxNextQ = Math.max(...nextQs)

      const targetQs = [...currentQs]
      // Parse action index from action string (e.g., "action_5" -> 5)
      const actionIndexMatch = exp.action.match(/action_(\d+)/)
      const actionIndex = actionIndexMatch ? parseInt(actionIndexMatch[1]) : 0

      if (actionIndex >= 0 && actionIndex < targetQs.length) {
        targetQs[actionIndex] = exp.reward + this.config.discountFactor * maxNextQ
      }

      return targetQs
    })

    return tf.tensor2d(targets)
  }

  private updateTargetNetwork(): void {
    if (!this.qNetwork || !this.targetNetwork) return

    const weights = this.qNetwork.getWeights()
    this.targetNetwork.setWeights(weights)

    this.emit('target_network_updated')
  }

  async reviewExecution(
    plannedAction: string,
    actualAction: string,
    plannedState: SCRLState,
    actualState: SCRLState,
    alignmentScore: number
  ): Promise<void> {
    // Calculate reward based on execution quality
    let reward = 0

    if (plannedAction === actualAction) {
      reward += 0.5 // Correct action execution
    }

    reward += alignmentScore * 0.3 // Alignment bonus

    // Performance-based reward
    reward += (actualState.performance - plannedState.performance) * 0.2

    // Add experience for learning
    await this.addExperience(plannedState, actualAction, reward, actualState)

    console.log(`[SCRL] Execution reviewed. Reward: ${reward.toFixed(2)}, Alignment: ${alignmentScore.toFixed(2)}`)

    this.emit('execution_reviewed', {
      plannedAction,
      actualAction,
      reward,
      alignmentScore,
      performance: actualState.performance
    })
  }

  getStatistics(): {
    experienceCount: number
    stepCount: number
    explorationRate: number
    lastTrainingLoss?: number
  } {
    return {
      experienceCount: this.experiences.length,
      stepCount: this.stepCount,
      explorationRate: this.config.explorationRate,
      lastTrainingLoss: this.lastTrainingLoss
    }
  }

  private lastTrainingLoss?: number

  async saveModel(path: string): Promise<void> {
    if (!this.qNetwork) return

    await this.qNetwork.save(`file://${path}/scrl-model`)
    await this.saveExperiences(`${path}/experiences.json`)

    this.emit('model_saved', { path })
  }

  async loadModel(path: string): Promise<void> {
    try {
      this.qNetwork = await tf.loadLayersModel(`file://${path}/scrl-model/model.json`)
      await this.loadExperiences(`${path}/experiences.json`)

      this.emit('model_loaded', { path })
    } catch (error) {
      this.emit('model_load_error', error)
    }
  }

  private async saveExperiences(path: string): Promise<void> {
    const fs = await import('fs/promises')
    await fs.writeFile(path, JSON.stringify(this.experiences, null, 2))
  }

  private async loadExperiences(path: string): Promise<void> {
    try {
      const fs = await import('fs/promises')
      const data = await fs.readFile(path, 'utf-8')
      this.experiences = JSON.parse(data)
    } catch (error) {
      this.experiences = []
    }
  }

  setExplorationRate(rate: number): void {
    this.config.explorationRate = Math.max(0, Math.min(1, rate))
  }

  getRecommendations(state: SCRLState): Array<{ action: string; confidence: number }> {
    // This would provide action recommendations based on current state
    return [
      { action: 'continue', confidence: 0.8 },
      { action: 'adjust_strategy', confidence: 0.6 },
      { action: 'request_help', confidence: 0.3 }
    ]
  }
}

export default SCRLEngine
