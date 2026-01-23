import { flightScraper, FlightScrapeResult } from './FlightScraper'

export type FlightSearchParams = {
  origin: string
  destination: string
  departureDate: string
  departureDateTo?: string
  returnDate?: string
  returnDateFrom?: string
  returnDateTo?: string
  passengers?: number
  cabin?: string
  currency?: string
  limit?: number
}

export type FlightOffer = {
  providerId: string
  providerName: string
  url: string
  price?: number
  currency?: string
  raw?: any
}

export type FlightSearchResult = {
  best: FlightOffer | null
  offers: FlightOffer[]
  meta: {
    source: 'browser' | 'links'
    cache: 'hit' | 'miss'
    durationMs: number
    error?: string
  }
}

type CacheEntry = { expiresAt: number; value: FlightSearchResult }

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : fallback
  return Math.max(min, Math.min(max, v))
}

function ddmmyyyy(isoDate: string): string {
  const m = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return isoDate
  return `${m[3]}/${m[2]}/${m[1]}`
}

function listIsoDates(fromIso: string, toIso: string, maxDays: number): string[] {
  const from = new Date(fromIso)
  const to = new Date(toIso)
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) return []
  if (to.getTime() < from.getTime()) return []

  const out: string[] = []
  const cur = new Date(from.getTime())

  while (cur.getTime() <= to.getTime() && out.length < maxDays) {
    const y = cur.getUTCFullYear()
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cur.getUTCDate()).padStart(2, '0')
    out.push(`${y}-${m}-${d}`)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }

  return out
}

function buildLinks(p: FlightSearchParams): FlightOffer[] {
  const origin = encodeURIComponent(String(p.origin || '').toUpperCase())
  const destination = encodeURIComponent(String(p.destination || '').toUpperCase())
  const d = encodeURIComponent(String(p.departureDate || ''))
  const r = p.returnDate ? encodeURIComponent(String(p.returnDate)) : ''
  const pax = clampInt(p.passengers, 1, 9, 1)
  const cabin = String(p.cabin || 'economy').toLowerCase()
  const cabinCode = cabin.includes('business') ? 'business' : cabin.includes('first') ? 'first' : 'economy'

  const urls: FlightOffer[] = []

  const googleQ = r
    ? `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${d}%20return%20${r}&tp=${pax}`
    : `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${d}&tp=${pax}`
  urls.push({ providerId: 'google_flights', providerName: 'Google Flights', url: googleQ })

  const d2 = String(p.departureDate || '').replace(/-/g, '')
  const r2 = p.returnDate ? String(p.returnDate).replace(/-/g, '') : 'null'
  urls.push({
    providerId: 'skyscanner',
    providerName: 'Skyscanner',
    url: `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${d2}/${r2}/?adults=${pax}&cabinclass=${cabinCode}`,
  })

  const kayakBase = `https://www.kayak.com/flights/${origin}-${destination}/${d}`
  urls.push({ providerId: 'kayak', providerName: 'KAYAK', url: r ? `${kayakBase}/${r}` : kayakBase })

  urls.push({
    providerId: 'expedia',
    providerName: 'Expedia',
    url: `https://www.expedia.com/Flights-Search?trip=${r ? 'roundtrip' : 'oneway'}&leg1=${encodeURIComponent(
      `from:${String(p.origin).toUpperCase()},to:${String(p.destination).toUpperCase()},departure:${String(p.departureDate)}TANYT`
    )}${
      r
        ? `&leg2=${encodeURIComponent(
            `from:${String(p.destination).toUpperCase()},to:${String(p.origin).toUpperCase()},departure:${String(p.returnDate)}TANYT`
          )}`
        : ''
    }&passengers=${encodeURIComponent(`adults:${pax}`)}&options=${encodeURIComponent(`cabinclass:${cabinCode}`)}&mode=search`,
  })

  urls.push({
    providerId: 'momondo',
    providerName: 'Momondo',
    url: `https://www.momondo.com/flight-search/${origin}-${destination}/${d}${r ? `/${r}` : ''}?sort=price_a`,
  })

  return urls
}

async function searchBrowserScraping(p: FlightSearchParams): Promise<FlightOffer[]> {
  const origin = String(p.origin || '').toUpperCase()
  const destination = String(p.destination || '').toUpperCase()
  const departureDate = String(p.departureDate || '')
  const returnDate = p.returnDate || p.returnDateFrom || undefined
  const currency = String(p.currency || 'USD').toUpperCase()
  
  try {
    await flightScraper.init()
    
    let results: FlightScrapeResult[] = []
    let lastError: string | undefined
    
    // Try Google Flights first
    try {
      const googleResults = await flightScraper.scrapeGoogleFlights(origin, destination, departureDate, returnDate, currency)
      results.push(...googleResults)
    } catch (e: any) {
      lastError = e?.message || String(e)
    }
    
    // Fallback to Kayak if Google fails or for more results
    if (results.length === 0) {
      try {
        const kayakResults = await flightScraper.scrapeKayak(origin, destination, departureDate, returnDate, currency)
        results.push(...kayakResults)
      } catch (e: any) {
        lastError = e?.message || String(e)
      }
    }

    if (results.length === 0) {
      throw new Error(lastError || 'no_prices_extracted')
    }
    
    // Convert scraped results to FlightOffer format
    const offers: FlightOffer[] = results.map(result => ({
      providerId: result.provider.toLowerCase().replace(/\s+/g, '_'),
      providerName: result.provider,
      url: result.url || `https://www.google.com/travel/flights?q=Flights from ${origin} to ${destination} on ${departureDate}`,
      price: result.price ? parseFloat(result.price.replace(/[^0-9.]/g, '')) : undefined,
      currency: result.currency || currency,
      raw: result
    }))
    
    // Sort by price (lowest first)
    offers.sort((a, b) => {
      if (typeof a.price !== 'number' && typeof b.price !== 'number') return 0
      if (typeof a.price !== 'number') return 1
      if (typeof b.price !== 'number') return -1
      return a.price - b.price
    })
    
    return offers
  } catch (error: any) {
    const msg = error?.message || String(error)
    console.error('Browser scraping failed:', msg)
    throw new Error(msg)
  }
}

export class FlightSearchService {
  private cache = new Map<string, CacheEntry>()
  private ttlMs = 30_000

  buildProviderLinks(params: FlightSearchParams): FlightOffer[] {
    return buildLinks(params)
  }

  async search(params: FlightSearchParams): Promise<FlightSearchResult> {
    const started = Date.now()

    const normalized: FlightSearchParams = {
      origin: String(params.origin || '').toUpperCase(),
      destination: String(params.destination || '').toUpperCase(),
      departureDate: String(params.departureDate || ''),
      departureDateTo: params.departureDateTo ? String(params.departureDateTo) : undefined,
      returnDate: params.returnDate ? String(params.returnDate) : undefined,
      returnDateFrom: params.returnDateFrom ? String(params.returnDateFrom) : undefined,
      returnDateTo: params.returnDateTo ? String(params.returnDateTo) : undefined,
      passengers: clampInt(params.passengers, 1, 9, 1),
      cabin: params.cabin ? String(params.cabin) : undefined,
      currency: params.currency ? String(params.currency).toUpperCase() : 'USD',
      limit: clampInt(params.limit, 1, 50, 10),
    }

    const key = JSON.stringify(normalized)
    const now = Date.now()
    const hit = this.cache.get(key)
    if (hit && hit.expiresAt > now) {
      return {
        ...hit.value,
        meta: { ...hit.value.meta, cache: 'hit', durationMs: Date.now() - started },
      }
    }

    let offers: FlightOffer[] = []
    let source: 'browser' | 'links' = 'links'
    let error: string | undefined

    try {
      offers = await searchBrowserScraping(normalized)
      if (offers.length > 0) {
        source = 'browser'
      }
    } catch (e: any) {
      const msg = e?.message || 'browser_scraping_failed'
      // Important: if we were bot-blocked/CAPTCHA'd, do NOT silently fall back to links.
      // We want the orchestrator to pause and ask the user to verify in the opened browser.
      if (String(msg).startsWith('captcha_detected|')) {
        throw new Error(String(msg))
      }
      error = msg
      offers = []
    }

    if (offers.length === 0) {
      if (normalized.returnDateFrom && normalized.returnDateTo) {
        const dates = listIsoDates(normalized.returnDateFrom, normalized.returnDateTo, 14)
        offers = dates.flatMap((rd) =>
          buildLinks({
            ...normalized,
            returnDate: rd,
            returnDateFrom: undefined,
            returnDateTo: undefined,
          }).map((o) => ({
            ...o,
            providerId: `${o.providerId}_${rd}`,
            providerName: `${o.providerName} (${rd})`,
          }))
        )
      } else {
        offers = buildLinks(normalized)
      }
      source = 'links'
    }

    const best = offers.reduce<FlightOffer | null>((acc, cur) => {
      if (typeof cur.price !== 'number') return acc
      if (!acc || typeof acc.price !== 'number') return cur
      return (cur.price as number) < (acc.price as number) ? cur : acc
    }, null)

    const value: FlightSearchResult = {
      best,
      offers,
      meta: {
        source,
        cache: 'miss',
        durationMs: Date.now() - started,
        error,
      },
    }

    this.cache.set(key, { expiresAt: now + this.ttlMs, value })
    return value
  }
}

export const flightSearchService = new FlightSearchService()
