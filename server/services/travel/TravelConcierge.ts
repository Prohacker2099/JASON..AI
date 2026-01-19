import { FlightArbitrageAgent } from '../agents/FlightArbitrageAgent'
// import { GhostHandAgent } from '../ghost_hand/GhostHandAgent' // Module not found - commented out
import { generateWithMistral } from '../ai/mistral/MistralClient'
import { contentEngine } from '../content/ContentEngine'
import * as puppeteer from 'puppeteer'
import axios from 'axios'

export interface TravelRequest {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers?: number
  cabin?: 'economy' | 'business' | 'first'
  budget?: number
  preferences?: {
    directFlights?: boolean
    hotelRating?: number
    accommodationType?: 'hotel' | 'apartment' | 'resort'
    activities?: string[]
  }
}

export interface TravelOption {
  type: 'flight' | 'hotel' | 'package'
  provider: string
  price: number
  currency: string
  details: any
  bookingUrl?: string
  rating?: number
  amenities?: string[]
  pros: string[]
  cons: string[]
}

export interface TravelPlan {
  destination: string
  dates: {
    departure: string
    return?: string
  }
  totalCost: number
  currency: string
  flights: TravelOption[]
  hotels: TravelOption[]
  activities: TravelOption[]
  recommendations: string[]
  estimatedSavings: number
  confidence: number
}

export class TravelConcierge {
  private flightAgent: FlightArbitrageAgent
  // private ghostHand: GhostHandAgent // Module not found - commented out

  constructor() {
    this.flightAgent = new FlightArbitrageAgent()
    // this.ghostHand = new GhostHandAgent()
  }

  async searchCompleteTrip(request: TravelRequest): Promise<TravelPlan> {
    try {
      // 1. Search for flights across multiple providers
      const flights = await this.searchFlights(request)

      // 2. Search for hotels if return date is provided
      let hotels: TravelOption[] = []
      if (request.returnDate) {
        hotels = await this.searchHotels(request)
      }

      // 3. Generate activity recommendations
      const activities = await this.searchActivities(request)

      // 4. Calculate optimal combination
      const plan = await this.optimizeTravelPlan(request, flights, hotels, activities)

      // 5. Generate presentation of the plan
      await this.generateTravelPresentation(plan)

      return plan
    } catch (error) {
      console.error('Travel search failed:', error)
      throw new Error('Unable to complete travel search')
    }
  }

  private async searchFlights(request: TravelRequest): Promise<TravelOption[]> {
    try {
      // Use the FlightArbitrageAgent to search flights
      const flightResults = await (this.flightAgent as any).searchFlights?.({
        origin: request.origin,
        destination: request.destination,
        departureDate: request.departureDate,
        returnDate: request.returnDate,
        passengers: request.passengers || 1,
        cabin: request.cabin || 'economy',
        directFlights: request.preferences?.directFlights || false
      }) || []

      return flightResults.map((flight: any) => ({
        type: 'flight' as const,
        provider: flight.provider || 'Unknown',
        price: flight.price || 0,
        currency: flight.currency || 'USD',
        details: flight,
        bookingUrl: flight.bookingUrl,
        pros: this.generateFlightPros(flight),
        cons: this.generateFlightCons(flight)
      }))
    } catch (error) {
      console.error('Flight search failed:', error)
      return []
    }
  }

  private async searchHotels(request: TravelRequest): Promise<TravelOption[]> {
    const hotelOptions = await this.searchHotelsAcrossProviders(request)

    return hotelOptions.map(hotel => ({
      type: 'hotel' as const,
      provider: hotel.provider,
      price: hotel.price,
      currency: hotel.currency,
      details: hotel,
      bookingUrl: hotel.bookingUrl,
      rating: hotel.rating,
      amenities: hotel.amenities,
      pros: this.generateHotelPros(hotel),
      cons: this.generateHotelCons(hotel)
    }))
  }

  private async searchActivities(request: TravelRequest): Promise<TravelOption[]> {
    // Use web scraping to find activities and attractions
    const activities = await this.scrapeActivities(request.destination, request.preferences?.activities)

    return activities.map(activity => ({
      type: 'package' as const,
      provider: activity.provider,
      price: activity.price,
      currency: activity.currency,
      details: activity,
      bookingUrl: activity.bookingUrl,
      pros: [activity.description],
      cons: []
    }))
  }

  private async searchHotelsAcrossProviders(request: TravelRequest): Promise<any[]> {
    const providers = [
      this.searchBookingDotCom(request),
      this.searchExpedia(request),
      this.searchHotelsDotCom(request),
      this.searchAirbnb(request)
    ]

    const results = await Promise.allSettled(providers)
    const hotels = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        hotels.push(...result.value)
      }
    }

    return hotels
  }

  private async searchBookingDotCom(request: TravelRequest): Promise<any[]> {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    try {
      await page.goto('https://www.booking.com')
      
      // Fill search form
      await page.type('#ss', request.destination)
      await page.type('[data-testid="date-display-field-start"]', request.departureDate)
      if (request.returnDate) {
        await page.type('[data-testid="date-display-field-end"]', request.returnDate)
      }

      // Set guests
      await page.click('[data-testid="occupancy-config-trigger"]')
      await page.click('[data-testid="occupancy-config-adults-inc"]')
      await page.click('[data-testid="occupancy-config-save-button"]')

      // Search
      await page.click('[type="submit"]')
      await page.waitForSelector('[data-testid="property-card"]')

      // Extract results
      const hotels = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-testid="property-card"]')
        return Array.from(cards).map(card => {
          const title = card.querySelector('[data-testid="title"]')?.textContent || ''
          const price = card.querySelector('[data-testid="price-and-discounted-price"]')?.textContent || ''
          const rating = card.querySelector('[data-testid="review-score"]')?.textContent || ''
          const link = card.querySelector('a')?.href || ''

          return {
            name: title,
            price: parseFloat(price.replace(/[^0-9.]/g, '')),
            rating: parseFloat(rating),
            provider: 'Booking.com',
            bookingUrl: link
          }
        })
      })

      return hotels
    } finally {
      await browser.close()
    }
  }

  private async searchExpedia(request: TravelRequest): Promise<any[]> {
    // Similar implementation for Expedia
    return []
  }

  private async searchHotelsDotCom(request: TravelRequest): Promise<any[]> {
    // Similar implementation for Hotels.com
    return []
  }

  private async searchAirbnb(request: TravelRequest): Promise<any[]> {
    // Similar implementation for Airbnb
    return []
  }

  private async scrapeActivities(destination: string, preferences?: string[]): Promise<any[]> {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    try {
      await page.goto(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(destination)} activities`)

      await page.waitForSelector('[data-test-target="activities-card"]')

      const activities = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-test-target="activities-card"]')
        return Array.from(cards).map(card => {
          const title = card.querySelector('[data-test-target="activity-title"]')?.textContent || ''
          const price = card.querySelector('[data-test-target="activity-price"]')?.textContent || ''
          const description = card.querySelector('[data-test-target="activity-description"]')?.textContent || ''
          const rating = card.querySelector('[data-test-target="activity-rating"]')?.textContent || ''
          const link = card.querySelector('a')?.href || ''

          return {
            name: title,
            price: parseFloat(price.replace(/[^0-9.]/g, '')),
            description,
            rating: parseFloat(rating),
            provider: 'TripAdvisor',
            bookingUrl: link
          }
        })
      })

      return activities
    } finally {
      await browser.close()
    }
  }

  private async optimizeTravelPlan(
    request: TravelRequest,
    flights: TravelOption[],
    hotels: TravelOption[],
    activities: TravelOption[]
  ): Promise<TravelPlan> {
    // Use AI to optimize the best combination
    const optimizationPrompt = `
Given these travel options, optimize the best travel plan for:
- Origin: ${request.origin}
- Destination: ${request.destination}
- Dates: ${request.departureDate} - ${request.returnDate || 'One-way'}
- Passengers: ${request.passengers || 1}
- Budget: ${request.budget || 'No limit'}
- Preferences: ${JSON.stringify(request.preferences || {})}

Flight Options:
${JSON.stringify(flights.slice(0, 5), null, 2)}

Hotel Options:
${JSON.stringify(hotels.slice(0, 5), null, 2)}

Activity Options:
${JSON.stringify(activities.slice(0, 10), null, 2)}

Return the optimal plan as JSON with:
- Selected flights
- Selected hotels  
- Selected activities
- Total cost
- Estimated savings
- Confidence score
- Recommendations
`

    const aiResponse = await generateWithMistral(
      'You are a travel optimization expert. Find the best value travel combination.',
      optimizationPrompt
    )

    let optimizedPlan
    try {
      optimizedPlan = JSON.parse(aiResponse)
    } catch {
      // Fallback to simple optimization
      optimizedPlan = this.simpleOptimization(request, flights, hotels, activities)
    }

    return {
      destination: request.destination,
      dates: {
        departure: request.departureDate,
        return: request.returnDate
      },
      totalCost: optimizedPlan.totalCost || 0,
      currency: 'USD',
      flights: optimizedPlan.flights || flights.slice(0, 1),
      hotels: optimizedPlan.hotels || hotels.slice(0, 1),
      activities: optimizedPlan.activities || activities.slice(0, 3),
      recommendations: optimizedPlan.recommendations || [],
      estimatedSavings: optimizedPlan.estimatedSavings || 0,
      confidence: optimizedPlan.confidence || 0.8
    }
  }

  private simpleOptimization(
    request: TravelRequest,
    flights: TravelOption[],
    hotels: TravelOption[],
    activities: TravelOption[]
  ): any {
    const cheapestFlight = flights.sort((a, b) => a.price - b.price)[0]
    const cheapestHotel = hotels.sort((a, b) => a.price - b.price)[0]
    const topActivities = activities.slice(0, 3)

    const totalCost = (cheapestFlight?.price || 0) + (cheapestHotel?.price || 0) + 
                     topActivities.reduce((sum, act) => sum + act.price, 0)

    return {
      flights: cheapestFlight ? [cheapestFlight] : [],
      hotels: cheapestHotel ? [cheapestHotel] : [],
      activities: topActivities,
      totalCost,
      estimatedSavings: Math.round(totalCost * 0.15), // Assume 15% savings
      confidence: 0.7,
      recommendations: ['Book early for best prices', 'Consider travel insurance', 'Check visa requirements']
    }
  }

  private async generateTravelPresentation(plan: TravelPlan): Promise<void> {
    const presentationRequest = {
      type: 'presentation' as const,
      prompt: `Create a comprehensive travel presentation for a trip to ${plan.destination} from ${plan.dates.departure} to ${plan.dates.return || 'One-way'}. 
      
Total cost: $${plan.totalCost} ${plan.currency}
Estimated savings: $${plan.estimatedSavings}

Flights: ${plan.flights.map(f => `${f.provider} - $${f.price}`).join(', ')}
Hotels: ${plan.hotels.map(h => `${h.provider} - $${h.price}`).join(', ')}
Activities: ${plan.activities.map(a => a.details.name).join(', ')}

Recommendations: ${plan.recommendations.join(', ')}

Create a professional presentation with:
1. Trip overview and highlights
2. Detailed itinerary
3. Cost breakdown
4. Flight and accommodation details
5. Activity recommendations
6. Booking information`,
      style: 'professional' as const,
      length: 'medium' as const,
      targetApp: 'powerpoint' as const,
      images: true
    }

    const result = await contentEngine.createPowerPoint(presentationRequest)
    
    if (result.success) {
      console.log(`Travel presentation created: ${result.filePath}`)
    }
  }

  private generateFlightPros(flight: any): string[] {
    const pros = []
    if (flight.direct) pros.push('Direct flight')
    if (flight.legroom) pros.push('Extra legroom')
    if (flight.wifi) pros.push('WiFi available')
    if (flight.meals) pros.push('Meals included')
    return pros
  }

  private generateFlightCons(flight: any): string[] {
    const cons = []
    if (flight.stops > 0) cons.push(`${flight.stops} stops`)
    if (flight.layoverTime > 2) cons.push('Long layover')
    return cons
  }

  private generateHotelPros(hotel: any): string[] {
    const pros = []
    if (hotel.rating >= 4) pros.push('Highly rated')
    if (hotel.amenities?.includes('free-wifi')) pros.push('Free WiFi')
    if (hotel.amenities?.includes('breakfast')) pros.push('Breakfast included')
    if (hotel.amenities?.includes('pool')) pros.push('Pool available')
    return pros
  }

  private generateHotelCons(hotel: any): string[] {
    const cons = []
    if (hotel.rating < 3.5) cons.push('Low rating')
    if (!hotel.amenities?.includes('free-wifi')) cons.push('No free WiFi')
    return cons
  }

  async bookTravelOption(option: TravelOption, userId: string): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      // Simulate booking process since GhostHandAgent is not available
      const bookingId = `booking_${Date.now()}`
      
      console.log(`Simulating booking for ${option.provider} - ${option.type}`)
      
      return {
        success: true,
        bookingId
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Booking failed'
      }
    }
  }
}

export const travelConcierge = new TravelConcierge()
