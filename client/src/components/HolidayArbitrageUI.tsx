import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plane, 
  Hotel, 
  Calendar, 
  Users, 
  PoundSterling,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Globe,
  CreditCard,
  Shield,
  Star
} from 'lucide-react';

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

interface TravelSearchProps {
  theme: 'dark' | 'light' | 'quantum';
  onNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const HolidayArbitrageUI: React.FC<TravelSearchProps> = ({ theme, onNotification }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [deals, setDeals] = useState<HolidayDeal[]>([]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [activeProviders, setActiveProviders] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const themeColors = {
    dark: {
      background: 'rgba(15, 23, 42, 0.95)',
      surface: 'rgba(30, 41, 59, 0.8)',
      border: 'rgba(71, 85, 105, 0.3)',
      text: '#f1f5f9',
      accent: '#6366f1'
    },
    light: {
      background: 'rgba(248, 250, 252, 0.95)',
      surface: 'rgba(255, 255, 255, 0.8)',
      border: 'rgba(226, 232, 240, 0.8)',
      text: '#1e293b',
      accent: '#3b82f6'
    },
    quantum: {
      background: 'rgba(10, 10, 15, 0.95)',
      surface: 'rgba(26, 26, 46, 0.8)',
      border: 'rgba(139, 92, 246, 0.3)',
      text: '#e0e7ff',
      accent: '#8b5cf6'
    }
  };

  const colors = themeColors[theme];

  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    
    eventSource.addEventListener('travel:search_complete', (event) => {
      const data = JSON.parse(event.data);
      setDeals(data.deals);
      setOpportunities(data.opportunities);
      setIsSearching(false);
      setShowResults(true);
      setSearchProgress(100);
      onNotification(`Found ${data.deals.length} deals with ${data.opportunities.length} arbitrage opportunities!`, 'success');
    });

    eventSource.addEventListener('travel:cambodia_complete', (event) => {
      const data = JSON.parse(event.data);
      setDeals(data.deals);
      setOpportunities(data.opportunities);
      setIsSearching(false);
      setShowResults(true);
      setSearchProgress(100);
      onNotification(`Cambodia search complete! Found ${data.statistics.totalDeals} deals, best price £${data.statistics.bestPrice}`, 'success');
    });

    eventSource.addEventListener('travel:search_error', (event) => {
      const data = JSON.parse(event.data);
      setIsSearching(false);
      setSearchProgress(0);
      onNotification(`Search error: ${data.error}`, 'error');
    });

    return () => eventSource.close();
  }, [onNotification]);

  const startCambodiaSearch = async () => {
    setIsSearching(true);
    setSearchProgress(0);
    setShowResults(false);
    setDeals([]);
    setOpportunities([]);
    setActiveProviders(['Expedia', 'Skyscanner', 'Booking.com', 'Kayak']);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setSearchProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 2000);

    try {
      const response = await fetch('/api/travel/cambodia-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setSearchId(data.searchId);
        onNotification('Cambodia luxury search started - checking multiple providers...', 'info');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setIsSearching(false);
      clearInterval(progressInterval);
      onNotification('Failed to start search', 'error');
    }
  };

  const renderSearchProgress = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl backdrop-blur-xl border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <Search className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: colors.text }}>
            Headless Search in Progress
          </h3>
          <p className="text-sm opacity-70">
            Scanning multiple providers for the best deals...
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: colors.accent }}
            initial={{ width: '0%' }}
            animate={{ width: `${searchProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {activeProviders.map((provider, index) => (
            <motion.div
              key={provider}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 p-2 rounded-lg"
              style={{ backgroundColor: colors.background }}
            >
              <div className={`w-2 h-2 rounded-full ${
                searchProgress > index * 25 ? 'bg-green-500' : 'bg-gray-500'
              }`} />
              <span className="text-xs font-medium" style={{ color: colors.text }}>
                {provider}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderArbitrageOpportunity = (opportunity: ArbitrageOpportunity) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-2xl backdrop-blur-xl border relative overflow-hidden"
      style={{ 
        backgroundColor: colors.surface, 
        borderColor: colors.accent,
        boxShadow: `0 0 20px ${colors.accent}40`
      }}
    >
      <div className="absolute top-0 right-0 p-2">
        <Sparkles className="w-6 h-6" style={{ color: colors.accent }} />
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold mb-1" style={{ color: colors.text }}>
            Arbitrage Opportunity!
          </h3>
          <p className="text-sm opacity-70">
            {opportunity.deals[0].destination} • {opportunity.deals.length} providers
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
            £{opportunity.savings.toFixed(0)}
          </p>
          <p className="text-sm" style={{ color: '#10b981' }}>
            {opportunity.percentage.toFixed(1)}% savings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs opacity-70 mb-1">Best Deal</p>
          <p className="font-semibold" style={{ color: colors.text }}>
            {opportunity.bestProvider}
          </p>
          <p className="text-sm" style={{ color: colors.accent }}>
            £{opportunity.deals[0].price}
          </p>
        </div>
        <div>
          <p className="text-xs opacity-70 mb-1">Confidence</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
              <div 
                className="h-full rounded-full"
                style={{ 
                  width: `${opportunity.confidence * 100}%`,
                  backgroundColor: colors.accent 
                }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: colors.text }}>
              {(opportunity.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {opportunity.deals.slice(0, 3).map((deal, index) => (
          <div
            key={deal.id}
            className="flex items-center justify-between p-2 rounded-lg"
            style={{ backgroundColor: colors.background }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-green-500' : 'bg-gray-500'
              } text-white`}>
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.text }}>
                  {deal.provider}
                </p>
                <p className="text-xs opacity-70">
                  {deal.availability ? 'Available' : 'Limited'}
                </p>
              </div>
            </div>
            <p className="font-semibold" style={{ color: colors.text }}>
              £{deal.price}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderDealCard = (deal: HolidayDeal) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl backdrop-blur-md border cursor-pointer"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold" style={{ color: colors.text }}>
            {deal.provider}
          </h4>
          <p className="text-sm opacity-70">{deal.destination}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color: colors.accent }}>
            £{deal.price}
          </p>
          <p className="text-xs opacity-70">per person</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" style={{ color: colors.text }} />
          <span style={{ color: colors.text }}>
            {new Date(deal.dates.outbound).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Plane className="w-3 h-3" style={{ color: colors.text }} />
          <span style={{ color: colors.text }}>{deal.departure}</span>
        </div>
        <div className="flex items-center gap-1">
          <Hotel className="w-3 h-3" style={{ color: colors.text }} />
          <span style={{ color: colors.text }}>
            {deal.accommodation?.name || 'Standard'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" style={{ color: colors.text }} />
          <span style={{ color: colors.text }}>5 people</span>
        </div>
      </div>

      {deal.features.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {deal.features.slice(0, 3).map((feature, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: colors.accent + '20', color: colors.accent }}
            >
              {feature}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
          🌴 Holiday Arbitrage Engine
        </h1>
        <p className="opacity-70">
          Headless web search with real-time price comparison across multiple providers
        </p>
      </motion.div>

      {/* Cambodia Example Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8"
      >
        <button
          onClick={startCambodiaSearch}
          disabled={isSearching}
          className="w-full p-6 rounded-2xl backdrop-blur-xl border transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: colors.accent + '20',
            borderColor: colors.accent,
            color: colors.text
          }}
        >
          <div className="flex items-center justify-center gap-4">
            <Globe className="w-8 h-8" style={{ color: colors.accent }} />
            <div className="text-left">
              <h3 className="text-xl font-bold">Cambodia Luxury Example</h3>
              <p className="text-sm opacity-70">
                15 days • 5 people • Dec 21st • £2000 budget • Headless search + arbitrage
              </p>
            </div>
            {isSearching ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-8 h-8" style={{ color: colors.accent }} />
            )}
          </div>
        </button>
      </motion.div>

      {/* Search Progress */}
      <AnimatePresence>
        {isSearching && renderSearchProgress()}
      </AnimatePresence>

      {/* Arbitrage Opportunities */}
      <AnimatePresence>
        {showResults && opportunities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
              💰 Arbitrage Opportunities Found
            </h2>
            {opportunities.map(opportunity => (
              <div key={opportunity.id}>
                {renderArbitrageOpportunity(opportunity)}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Deals */}
      <AnimatePresence>
        {showResults && deals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
              📋 All Deals Found
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deals.map(deal => (
                <div key={deal.id}>
                  {renderDealCard(deal)}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!isSearching && !showResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Plane className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: colors.text }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            Ready for Headless Search
          </h3>
          <p className="opacity-70">
            Click the Cambodia example to see the arbitrage engine in action
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default HolidayArbitrageUI;
