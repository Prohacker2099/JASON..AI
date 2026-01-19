import type { ActionAdapter, ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { flightSearchService } from '../flights/FlightSearchService'

export class FastFlightSearchAdapter implements ActionAdapter {
  canHandle(a: ActionDefinition): boolean {
    return a.type === 'web' && !!a.payload && a.payload.mode === 'flight_search'
  }

  async execute(a: ActionDefinition): Promise<ExecutionResult> {
    try {
      const payload = a.payload || {}
      const origin = String(payload.origin || '')
      const destination = String(payload.destination || '')
      const departureDate = String(payload.departureDate || '')
      const returnDate = payload.returnDate ? String(payload.returnDate) : undefined
      const passengers = typeof payload.passengers === 'number' ? payload.passengers : 1
      const cabin = payload.cabin ? String(payload.cabin) : undefined
      const currency = payload.currency ? String(payload.currency) : undefined
      const limit = typeof payload.limit === 'number' ? payload.limit : undefined

      if (!origin || !destination || !departureDate) {
        return { ok: false, error: 'origin_destination_departureDate_required' }
      }

      const result = await flightSearchService.search({
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        cabin,
        currency,
        limit,
      })

      return { ok: true, result }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'flight_search_failed' }
    }
  }
}
