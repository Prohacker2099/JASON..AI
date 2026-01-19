import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Globe, Search, Plane, Hotel, Calendar, Users, PoundSterling, TrendingUp, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface HolidayDeal {
  id: string;
  provider: string;
  destination: string;
  departure: string;
  price: number;
  currency: string;
  dates: {
    outbound: string;
    return: string;
  };
  accommodation?: {
    name: string;
    rating: number;
    boardBasis: string;
  };
  flights?: {
    airline: string;
    stops: number;
    duration: number;
  };
  features: string[];
  availability: boolean;
  scrapedAt: string;
  url: string;
}

interface ArbitrageOpportunity {
  id: string;
  deals: HolidayDeal[];
  savings: number;
  percentage: number;
  bestProvider: string;
  worstProvider: string;
  createdAt: string;
  confidence: number;
}

const SimpleCambodiaUI: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);

  // Mock data for demonstration
  const mockOpportunity: ArbitrageOpportunity = {
    id: 'cambodia_demo',
    deals: [
      {
        id: 'kayak_1',
        provider: 'Kayak',
        destination: 'Cambodia',
        departure: 'LHR',
        price: 1650,
        currency: 'GBP',
        dates: { outbound: '2024-12-21', return: '2025-01-04' },
        accommodation: { name: 'Raffles Grand Hotel d\'Angkor', rating: 5, boardBasis: 'Bed & Breakfast' },
        flights: { airline: 'Thai Airways', stops: 1, duration: 700 },
        features: ['Heritage hotel', 'Colonial architecture', 'Spa', 'Golf course'],
        availability: true,
        scrapedAt: new Date().toISOString(),
        url: 'https://kayak.com'
      },
      {
        id: 'skyscanner_1',
        provider: 'Skyscanner',
        destination: 'Cambodia',
        departure: 'LHR',
        price: 1750,
        currency: 'GBP',
        dates: { outbound: '2024-12-21', return: '2025-01-04' },
        accommodation: { name: 'Belmond La Résidence d\'Angkor', rating: 5, boardBasis: 'Half Board' },
        flights: { airline: 'Emirates', stops: 1, duration: 750 },
        features: ['Luxury resort', 'Temple views', 'Butler service', 'Fine dining'],
        availability: true,
        scrapedAt: new Date().toISOString(),
        url: 'https://skyscanner.net'
      },
      {
        id: 'expedia_1',
        provider: 'Expedia',
        destination: 'Cambodia',
        departure: 'LHR',
        price: 1899,
        currency: 'GBP',
        dates: { outbound: '2024-12-21', return: '2025-01-04' },
        accommodation: { name: 'White Mansion Boutique Hotel', rating: 5, boardBasis: 'Bed & Breakfast' },
        flights: { airline: 'Qatar Airways', stops: 1, duration: 720 },
        features: ['5-star hotel', 'City center', 'Spa access', 'Airport transfer'],
        availability: true,
        scrapedAt: new Date().toISOString(),
        url: 'https://expedia.com'
      },
      {
        id: 'booking_1',
        provider: 'Booking.com',
        destination: 'Cambodia',
        departure: 'LHR',
        price: 2100,
        currency: 'GBP',
        dates: { outbound: '2024-12-21', return: '2025-01-04' },
        accommodation: { name: 'The Royal Sands Koh Rong', rating: 5, boardBasis: 'All Inclusive' },
        flights: { airline: 'Singapore Airlines', stops: 1, duration: 800 },
        features: ['Beachfront', 'All inclusive', 'Water sports', 'Private villa'],
        availability: true,
        scrapedAt: new Date().toISOString(),
        url: 'https://booking.com'
      }
    ],
    savings: 450,
    percentage: 21.4,
    bestProvider: 'Kayak',
    worstProvider: 'Booking.com',
    createdAt: new Date().toISOString(),
    confidence: 0.85
  };

  const startCambodiaSearch = () => {
    setIsSearching(true);
    setSearchProgress(0);
    setShowResults(false);
    setOpportunities([]);

    // Simulate search progress
    const providers = ['Expedia', 'Skyscanner', 'Booking.com', 'Kayak'];
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += 25;
      setSearchProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSearching(false);
          setOpportunities([mockOpportunity]);
          setShowResults(true);
        }, 1000);
      }
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a0b2e 25%, #2d1b69 50%, #3730a3 75%, #4c1d95 100%)',
      color: '#e0e7ff',
      padding: '2rem',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', background: 'linear-gradient(45deg, #8b5cf6, #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🌴 JASON AI - Cambodia Luxury Arbitrage
        </h1>
        <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>
          Headless web search with real-time price comparison across multiple providers
        </p>
      </motion.div>

      {/* Cambodia Search Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: '800px', margin: '0 auto 3rem' }}
      >
        <button
          onClick={startCambodiaSearch}
          disabled={isSearching}
          style={{
            width: '100%',
            padding: '2rem',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(217, 70, 239, 0.2))',
            border: '2px solid rgba(139, 92, 246, 0.5)',
            color: '#e0e7ff',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: isSearching ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={{ scale: 1.02 }}
          whileHover={{ scale: isSearching ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <Globe size={32} color="#8b5cf6" />
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Cambodia Luxury Example</h3>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
                15 days • 5 people • Dec 21st • £2000 budget • Headless search + arbitrage
              </p>
            </div>
            {isSearching ? (
              <div style={{ 
                width: '32px', 
                height: '32px', 
                border: '3px solid rgba(255,255,255,0.3)', 
                borderTop: '3px solid white', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }} />
            ) : (
              <Search size={32} color="#8b5cf6" />
            )}
          </div>
        </button>
      </motion.div>

      {/* Search Progress */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '2rem',
            borderRadius: '1rem',
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(71, 85, 105, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={24} color="#8b5cf6" style={{ animation: 'spin 2s linear infinite' }} />
              <div style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-4px', 
                width: '12px', 
                height: '12px', 
                background: '#10b981', 
                borderRadius: '50%', 
                animation: 'pulse 2s infinite' 
              }} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#e0e7ff', fontWeight: 'bold' }}>
                Headless Search in Progress
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
                Scanning multiple providers for the best deals...
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              width: '100%', 
              height: '12px', 
              borderRadius: '6px', 
              overflow: 'hidden', 
              background: 'rgba(71, 85, 105, 0.3)' 
            }}>
              <motion.div
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
                  borderRadius: '6px'
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${searchProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {['Expedia', 'Skyscanner', 'Booking.com', 'Kayak'].map((provider, index) => (
              <motion.div
                key={provider}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(15, 23, 42, 0.6)'
                }}
              >
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%',
                  background: searchProgress > index * 25 ? '#10b981' : '#6b7280'
                }} />
                <span style={{ fontSize: '0.8rem', color: '#e0e7ff', fontWeight: 'medium' }}>
                  {provider}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Results */}
      {showResults && opportunities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: '1000px', margin: '0 auto' }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
            💰 Arbitrage Opportunities Found
          </h2>

          {opportunities.map((opportunity) => (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '2rem',
                borderRadius: '1rem',
                background: 'rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                marginBottom: '2rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <Sparkles size={24} color="#8b5cf6" />
              </div>

              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#e0e7ff', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    Arbitrage Opportunity!
                  </h3>
                  <p style={{ margin: '0.5rem 0 0 0', opacity: 0.7 }}>
                    {opportunity.deals[0].destination} • {opportunity.deals.length} providers
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                    £{opportunity.savings.toFixed(0)}
                  </p>
                  <p style={{ margin: 0, color: '#10b981' }}>
                    {opportunity.percentage.toFixed(1)}% savings
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', opacity: 0.7 }}>Best Deal</p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#e0e7ff' }}>
                    {opportunity.bestProvider}
                  </p>
                  <p style={{ margin: 0, color: '#8b5cf6' }}>
                    £{opportunity.deals[0].price}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', opacity: 0.7 }}>Confidence</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      flex: 1, 
                      height: '8px', 
                      borderRadius: '4px', 
                      overflow: 'hidden', 
                      background: 'rgba(71, 85, 105, 0.3)' 
                    }}>
                      <div style={{ 
                        width: `${opportunity.confidence * 100}%`,
                        height: '100%',
                        background: '#8b5cf6',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'medium', color: '#e0e7ff' }}>
                      {(opportunity.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {opportunity.deals.map((deal, index) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'rgba(30, 41, 59, 0.8)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(71, 85, 105, 0.3)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#e0e7ff', fontWeight: 'bold' }}>
                          {deal.provider}
                        </h4>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                          {deal.destination}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                          £{deal.price}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.7 }}>per person</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#e0e7ff' }}>
                        <Calendar size={12} />
                        <span>{new Date(deal.dates.outbound).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#e0e7ff' }}>
                        <Plane size={12} />
                        <span>{deal.departure}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#e0e7ff' }}>
                        <Hotel size={12} />
                        <span>{deal.accommodation?.name || 'Standard'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#e0e7ff' }}>
                        <Users size={12} />
                        <span>5 people</span>
                      </div>
                    </div>

                    {deal.features.length > 0 && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {deal.features.slice(0, 2).map((feature, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              background: 'rgba(139, 92, 246, 0.2)',
                              color: '#8b5cf6'
                            }}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!isSearching && !showResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '4rem 2rem' }}
        >
          <Plane size={64} style={{ opacity: 0.5, margin: '0 auto 2rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#e0e7ff' }}>
            Ready for Headless Search
          </h3>
          <p style={{ opacity: 0.7, fontSize: '1rem' }}>
            Click the Cambodia example to see the arbitrage engine in action
          </p>
        </motion.div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default SimpleCambodiaUI;
