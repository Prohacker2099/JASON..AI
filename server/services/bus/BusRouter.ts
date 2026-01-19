import { messageBus, makeEnvelope, type MsgEnvelope } from './MessageBus'
import { daiSandbox } from '../execution/DAI'
import { sseBroker } from '../websocket-service'

class BusRouter {
  private unsub: Array<() => void> = []

  constructor() {
    // Route ACTION envelopes to DAI for immediate execution
    const u1 = messageBus.subscribe('ACTION', async (env: MsgEnvelope<any>) => {
      const p = env.payload || {}
      if (!p || typeof p !== 'object') return
      if (!p.action) return
      try {
        const out = await daiSandbox.execute(p.action, p.sandbox)
        try { sseBroker.broadcast('ai:self:event', { type: 'act', id: env.id, ok: out.ok, result: out.result, error: out.error }) } catch {}
        try { messageBus.publish(makeEnvelope('EVENT', 'bus_router', 'system', { id: env.id, ok: out.ok, result: out.result, error: out.error, corr: env.corr })) } catch {}
      } catch (e: any) {
        try { sseBroker.broadcast('ai:self:event', { type: 'act', id: env.id, ok: false, error: e?.message || 'bus_action_failed' }) } catch {}
        try { messageBus.publish(makeEnvelope('EVENT','bus_router','system',{ id: env.id, ok: false, error: e?.message || 'bus_action_failed', corr: env.corr })) } catch {}
      }
    })
    this.unsub.push(u1)
  }

  stop() { for (const u of this.unsub.splice(0)) try { u() } catch {} }
}

export const busRouter = new BusRouter()
