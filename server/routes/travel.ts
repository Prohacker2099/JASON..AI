import { Router } from 'express'
import { HolidayArbitrageEngine, SearchRequest } from '../services/automation/HolidayArbitrageEngine'
import { z } from 'zod'
import { sseBroker } from '../services/websocket-service'

const router = Router()

// Initialize arbitrage engine
const arbitrageEngine = new HolidayArbitrageEngine({
  notificationEmail: process.env.NOTIFICATION_EMAIL,
  arbitrageThreshold: 50
})

// Initialize on startup
arbitrageEngine.initialize().catch(() => {})

// Request validation schema
const SearchRequestSchema = z.object({
  destination: z.string().min(2),
  departure: z.string().min(3),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  passengers: z.number().min(1).max(10),
  budget: z.number().min(100),
  preferences: z.object({
    accommodation: z.enum(['budget', 'mid-range', 'luxury']).default('mid-range'),
    boardBasis: z.string().optional(),
    directFlights: z.boolean().default(false),
    baggage: z.boolean().default(false)
  }).default({ accommodation: 'mid-range', directFlights: false, baggage: false })
})

// POST /api/travel/search - Start holiday search
router.post('/search', async (req, res) => {
  try {
    const searchRequest = SearchRequestSchema.parse(req.body)
    
    // Start headless search in background
    const searchPromise = arbitrageEngine.searchHolidays(searchRequest)
    
    // Return search ID immediately
    const searchId = `search_${Date.now()}`
    
    res.json({
      success: true,
      searchId,
      message: 'Search started in background',
      estimatedTime: '30-60 seconds'
    })
    
    // Continue search in background
    searchPromise
      .then(deals => {
        // Emit SSE event when complete
        sseBroker.broadcast('travel:search_complete', {
          searchId,
          deals,
          opportunities: arbitrageEngine.getOpportunities()
        })
      })
      .catch(error => {
        sseBroker.broadcast('travel:search_error', {
          searchId,
          error: error.message
        })
      })
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid search request'
    })
  }
})

// GET /api/travel/status/:searchId - Get search status
router.get('/status/:searchId', (req, res) => {
  const { searchId } = req.params
  
  // For now, return general engine status
  const stats = arbitrageEngine.getStatistics()
  
  res.json({
    searchId,
    status: 'processing', // Would track actual search status in production
    statistics: stats
  })
})

// GET /api/travel/opportunities - Get arbitrage opportunities
router.get('/opportunities', (req, res) => {
  const opportunities = arbitrageEngine.getOpportunities()
  
  res.json({
    success: true,
    opportunities,
    totalSavings: opportunities.reduce((sum, op) => sum + op.savings, 0),
    count: opportunities.length
  })
})

// GET /api/travel/best-deal - Get best deal for destination
router.get('/best-deal', async (req, res) => {
  try {
    const { destination, budget } = req.query
    
    if (!destination || !budget) {
      return res.status(400).json({
        success: false,
        error: 'Destination and budget required'
      })
    }
    
    const bestDeal = await arbitrageEngine.getBestDeal(
      destination as string, 
      parseFloat(budget as string)
    )
    
    res.json({
      success: true,
      bestDeal
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find best deal'
    })
  }
})

// POST /api/travel/cambodia-example - Pre-configured Cambodia search
router.post('/cambodia-example', async (req, res) => {
  try {
    const cambodiaRequest: SearchRequest = {
      destination: 'Cambodia',
      departure: 'LHR',
      departureDate: '2024-12-21',
      returnDate: '2025-01-04',
      passengers: 5,
      budget: 2000,
      preferences: {
        accommodation: 'luxury',
        directFlights: false,
        baggage: true
      }
    }
    
    // Start search immediately
    const searchPromise = arbitrageEngine.searchHolidays(cambodiaRequest)
    const searchId = `cambodia_${Date.now()}`
    
    res.json({
      success: true,
      searchId,
      request: cambodiaRequest,
      message: 'Cambodia luxury search started - checking Expedia, Skyscanner, Booking.com, Kayak...',
      estimatedTime: '45-90 seconds for complete arbitrage analysis'
    })
    
    // Process in background
    searchPromise
      .then(deals => {
        const opportunities = arbitrageEngine.getOpportunities()
        const cambodiaDeals = deals.filter(deal => 
          deal.destination.toLowerCase().includes('cambodia')
        )
        
        sseBroker.broadcast('travel:cambodia_complete', {
          searchId,
          deals: cambodiaDeals,
          opportunities: opportunities.filter(op => 
            op.deals.some(deal => deal.destination.toLowerCase().includes('cambodia'))
          ),
          statistics: {
            totalDeals: cambodiaDeals.length,
            averagePrice: cambodiaDeals.reduce((sum, d) => sum + d.price, 0) / cambodiaDeals.length,
            bestPrice: Math.min(...cambodiaDeals.map(d => d.price)),
            worstPrice: Math.max(...cambodiaDeals.map(d => d.price))
          }
        })
      })
      .catch(error => {
        sseBroker.broadcast('travel:cambodia_error', {
          searchId,
          error: error.message
        })
      })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start Cambodia search'
    })
  }
})

// GET /api/travel/statistics - Get engine statistics
router.get('/statistics', (req, res) => {
  const stats = arbitrageEngine.getStatistics()
  
  res.json({
    success: true,
    ...stats,
    engineStatus: 'active',
    lastUpdate: new Date().toISOString()
  })
})

export default router
