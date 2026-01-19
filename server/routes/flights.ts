import { Router } from 'express'
import { z } from 'zod'
import { flightSearchService } from '../services/flights/FlightSearchService'
import { sseBroker } from '../services/websocket-service'

const router = Router()

const SearchSchema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  returnDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  returnDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.number().min(1).max(9).optional(),
  cabin: z.string().optional(),
  currency: z.string().min(3).max(3).optional(),
  limit: z.number().min(1).max(50).optional(),
})

router.post('/search', async (req, res) => {
  const started = Date.now()
  try {
    const body = SearchSchema.parse(req.body || {})
    const result = await flightSearchService.search(body)
    try {
      sseBroker.broadcast('flights:search', {
        origin: body.origin,
        destination: body.destination,
        departureDate: body.departureDate,
        returnDate: body.returnDate,
        meta: result.meta,
        best: result.best,
      })
    } catch {}

    res.json(result)
  } catch (e: any) {
    const msg = e?.message || 'invalid_request'
    try { sseBroker.broadcast('flights:error', { error: msg, durationMs: Date.now() - started }) } catch {}
    res.status(400).json({ error: msg })
  }
})

export default router
