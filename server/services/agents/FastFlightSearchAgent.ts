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
      const msg = e?.message || 'flight_search_failed'
      if (typeof msg === 'string' && msg.startsWith('captcha_detected|')) {
        const parts = msg.split('|')
        const providerId = parts[1] || 'unknown'
        const url = parts.slice(2).join('|')
        const offers = flightSearchService.buildProviderLinks({
          origin: String((a.payload as any)?.origin || ''),
          destination: String((a.payload as any)?.destination || ''),
          departureDate: String((a.payload as any)?.departureDate || ''),
          returnDate: (a.payload as any)?.returnDate ? String((a.payload as any)?.returnDate) : undefined,
          passengers: typeof (a.payload as any)?.passengers === 'number' ? (a.payload as any)?.passengers : 1,
          cabin: (a.payload as any)?.cabin ? String((a.payload as any)?.cabin) : undefined,
          currency: (a.payload as any)?.currency ? String((a.payload as any)?.currency) : undefined,
          limit: typeof (a.payload as any)?.limit === 'number' ? (a.payload as any)?.limit : undefined,
        })
        return {
          ok: false,
          error: 'captcha_detected',
          result: {
            providerId,
            url,
            best: null,
            offers,
            meta: { source: 'links', cache: 'miss', durationMs: 0, error: 'captcha_detected', needsHuman: true },
          },
        }
      }

      return { ok: false, error: msg }
    }
  }
}
