import type { ActionAdapter, ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { connectorManager } from '../connectors/ConnectorManager'

function pickUserId(a: ActionDefinition): string {
  const p: any = a.payload || {}
  const uid = p.userId || p.uid || p.user_id
  return typeof uid === 'string' && uid.trim() ? uid.trim() : 'demo-user'
}

export class ConnectorActionAdapter implements ActionAdapter {
  canHandle(a: ActionDefinition): boolean {
    return a.type === 'connector' && !!a.payload
  }

  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    try {
      const payload: any = a.payload || {}
      const userId = pickUserId(a)
      const providerId = String(payload.providerId || payload.provider || '').trim()
      const operation = String(payload.operation || payload.op || a.name || '').trim()
      const params = payload.params

      if (!providerId) return { ok: false, error: 'provider_required' }
      if (!operation) return { ok: false, error: 'operation_required' }

      const result = await connectorManager.execute({ userId, providerId, operation, params })
      return { ok: true, result }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'connector_failed' }
    }
  }
}
