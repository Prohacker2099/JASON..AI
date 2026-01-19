import { EventEmitter } from 'events'
import { createHash } from 'crypto'
import { PriorityQueue } from '../utils/PriorityQueue'

export type MsgTopic = 'PERCEPT' | 'ACTION' | 'DECISION' | 'EVENT' | 'CONTROL'

export interface MsgEnvelope<T = any> {
  id: string
  timestamp: number
  priority: number // 0 (Low) to 100 (Kill Switch)
  topic: MsgTopic
  source: string
  target: string
  payload: T
  integrity_hash: string
  ttlMs?: number
  policyVersion?: string
  corr?: string
}

class MessageBus extends EventEmitter {
  private queue = new PriorityQueue<MsgEnvelope>((a, b) => b.priority - a.priority)
  private processing = false
  private maxQueueSize = 10000

  publish<T = any>(env: MsgEnvelope<T>) {
    // Validate integrity hash
    const expectedHash = this.calculateHash(env.payload)
    if (env.integrity_hash !== expectedHash) {
      this.emit('integrity_failure', { envelope: env, expected: expectedHash, received: env.integrity_hash })
      return
    }

    // Check TTL
    const now = Date.now()
    if (env.ttlMs && (now - env.timestamp) > env.ttlMs) {
      this.emit('message_expired', env)
      return
    }

    // Add to priority queue
    if (this.queue.size() >= this.maxQueueSize) {
      this.queue.dequeue() // Drop oldest/lowest priority message
      this.emit('queue_overflow', { size: this.queue.size() })
    }
    
    this.queue.enqueue(env)
    this.processQueue()
  }

  private async processQueue() {
    if (this.processing) return
    this.processing = true

    while (this.queue.size() > 0) {
      const env = this.queue.dequeue()
      if (env) {
        // Emit by topic and topic:kind for selective subscribers
        this.emit(env.topic, env)
        this.emit(`${env.topic}:${env.target}`, env)
        await new Promise(resolve => setImmediate(resolve)) // Prevent blocking
      }
    }

    this.processing = false
  }

  private calculateHash(payload: any): string {
    const payloadStr = JSON.stringify(payload)
    return createHash('sha256').update(payloadStr).digest('hex')
  }

  subscribe(topic: MsgTopic | `${MsgTopic}:${string}`, handler: (env: MsgEnvelope<any>) => void) {
    const fn = (e: MsgEnvelope<any>) => { try { handler(e) } catch {} }
    this.on(topic, fn)
    return () => { this.off(topic, fn) }
  }
}

export const messageBus = new MessageBus()

export function makeEnvelope<T = any>(
  topic: MsgTopic, 
  source: string, 
  target: string, 
  payload: T, 
  priority: number = 5,
  extra?: Partial<MsgEnvelope<T>>
): MsgEnvelope<T> {
  const payloadStr = JSON.stringify(payload)
  const integrity_hash = createHash('sha256').update(payloadStr).digest('hex')
  
  return {
    id: extra?.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    timestamp: extra?.ttlMs ? Date.now() : (extra as any)?.ts || Date.now(),
    priority: Math.max(0, Math.min(100, priority)),
    topic,
    source,
    target,
    payload,
    integrity_hash,
    ttlMs: extra?.ttlMs,
    policyVersion: extra?.policyVersion,
    corr: extra?.corr,
  }
}
