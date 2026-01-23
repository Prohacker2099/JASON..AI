import { afterEach, describe, expect, it } from 'vitest'
import { messageBus, makeEnvelope } from '../services/bus/MessageBus'

afterEach(() => {
  messageBus.removeAllListeners()
})

describe('MessageBus', () => {
  it('drops messages with invalid integrity hash', async () => {
    const env = makeEnvelope('PERCEPT', 'test', 'percept_bus', { x: 1 }, 5)
    ;(env as any).integrity_hash = 'bad'

    let integrityFailure = false
    let emitted = false

    messageBus.once('integrity_failure', () => {
      integrityFailure = true
    })

    messageBus.once('PERCEPT', () => {
      emitted = true
    })

    messageBus.publish(env)

    expect(integrityFailure).toBe(true)
    expect(emitted).toBe(false)
  })

  it('drops messages that are expired by TTL', async () => {
    const env = makeEnvelope('PERCEPT', 'test', 'percept_bus', { x: 1 }, 5, { ttlMs: 1 })
    env.timestamp = Date.now() - 25

    let expired = false
    let emitted = false

    messageBus.once('message_expired', () => {
      expired = true
    })

    messageBus.once('PERCEPT', () => {
      emitted = true
    })

    messageBus.publish(env)

    expect(expired).toBe(true)
    expect(emitted).toBe(false)
  })
})
