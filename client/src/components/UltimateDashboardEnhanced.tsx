import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { 
  Brain, 
  Zap, 
  Shield, 
  Settings, 
  Activity,
  TrendingUp,
  Database,
  Cpu,
  Globe,
  Lock,
  Unlock,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  Network,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Enhanced types
interface SystemState {
  health: {
    status: 'online' | 'offline' | 'degraded';
    uptime: number;
    lastCheck: string;
    services: ServiceHealth[];
  };
  performance: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    responseTime: number;
  };
  security: {
    trustLevel: 1 | 2 | 3;
    activeThreats: number;
    blockedRequests: number;
    encryptionStatus: 'active' | 'inactive';
  };
  automation: {
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    successRate: number;
  };
  learning: {
    modelAccuracy: number;
    trainingProgress: number;
    samplesProcessed: number;
    lastTraining: string;
  };
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastError?: string;
}

interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    background: string;
  };
}

const themes: Record<string, Theme> = {
  quantum: {
    name: 'Quantum',
    colors: {
      primary: '#8b5cf6',
      secondary: '#d946ef',
      accent: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#0a0a0f',
      surface: '#1a1a2e',
      text: '#e0e7ff'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
      secondary: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #2d1b69 100%)'
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      secondary: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    }
  },
  light: {
    name: 'Light',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      secondary: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }
  }
};

// Animation variants
const cardVariants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2 }
};

const progressVariants = {
  initial: { width: 0 },
  animate: { width: 'var(--progress)' }
};

// Custom hooks
const useSystemState = () => {
  const [state, setState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      setLoading(true);
      const [health, performance, security, automation, learning] = await Promise.allSettled([
        fetch('/api/health').then(r => r.json()),
        fetch('/api/performance').then(r => r.json().catch(() => ({}))),
        fetch('/api/security/status').then(r => r.json().catch(() => ({}))),
        fetch('/api/orch/status').then(r => r.json().catch(() => ({ activeJobs: 0, completedJobs: 0, failedJobs: 0 }))),
        fetch('/api/ai/self/status').then(r => r.json().catch(() => ({})))
      ]);

      setState({
        health: health.status === 'fulfilled' ? health.value : { status: 'offline', uptime: 0, lastCheck: new Date().toISOString(), services: [] },
        performance: performance.status === 'fulfilled' ? performance.value : { cpu: 0, memory: 0, disk: 0, network: 0, responseTime: 0 },
        security: security.status === 'fulfilled' ? security.value : { trustLevel: 1, activeThreats: 0, blockedRequests: 0, encryptionStatus: 'active' },
        automation: automation.status === 'fulfilled' ? { ...automation.value, successRate: automation.value.completedJobs > 0 ? (automation.value.completedJobs / (automation.value.completedJobs + automation.value.failedJobs)) * 100 : 100 } : { activeJobs: 0, completedJobs: 0, failedJobs: 0, successRate: 100 },
        learning: learning.status === 'fulfilled' ? learning.value : { modelAccuracy: 0, trainingProgress: 0, samplesProcessed: 0, lastTraining: 'Never' }
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  return { state, loading, error, refetch: fetchState };
};

// Components
const StatusBadge: React.FC<{ 
  status: 'healthy' | 'unhealthy' | 'degraded'; 
  pulse?: boolean;
}> = ({ status, pulse = true }) => {
  const colors = {
    healthy: 'bg-emerald-500',
    unhealthy: 'bg-red-500',
    degraded: 'bg-amber-500'
  };

  return (
    <div className={`w-2 h-2 rounded-full ${colors[status]} ${pulse ? 'animate-pulse' : ''}`} />
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  status?: 'good' | 'warning' | 'error';
  progress?: number;
  theme: Theme;
}> = ({ title, value, icon, trend, status = 'good', progress, theme }) => {
  const spring = useSpring({
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 300, friction: 10 }
  });

  const statusColors = {
    good: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error
  };

  return (
    <animated.div style={spring}>
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border"
        style={{
          background: theme.colors.surface + '40',
          borderColor: theme.colors.surface + '60',
          boxShadow: `0 8px 32px ${theme.colors.background}40`
        }}
      >
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ background: theme.gradients.primary }}
        />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: theme.colors.primary + '20' }}>
              {icon}
            </div>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: theme.colors.text + '80' }}>
              {title}
            </p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {value}
            </p>
          </div>

          {progress !== undefined && (
            <div className="mt-4">
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.surface + '60' }}>
                <motion.div
                  variants={progressVariants}
                  initial="initial"
                  animate="animate"
                  className="h-full rounded-full"
                  style={{ 
                    '--progress': `${progress}%`,
                    background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                  } as any}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: theme.colors.text + '60' }}>
                {progress.toFixed(1)}% Complete
              </p>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div 
          className="absolute top-4 right-4 w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColors[status] }}
        />
      </motion.div>
    </animated.div>
  );
};

const ServiceStatusCard: React.FC<{ service: ServiceHealth; theme: Theme }> = ({ service, theme }) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex items-center justify-between p-4 rounded-xl backdrop-blur-md border"
      style={{
        background: theme.colors.surface + '20',
        borderColor: theme.colors.surface + '40'
      }}
    >
      <div className="flex items-center gap-3">
        <StatusBadge status={service.status} />
        <div>
          <p className="font-medium" style={{ color: theme.colors.text }}>
            {service.name}
          </p>
          <p className="text-xs" style={{ color: theme.colors.text + '60' }}>
            {service.responseTime}ms
          </p>
        </div>
      </div>
      
      {service.lastError && (
        <div className="flex items-center gap-2 text-xs" style={{ color: theme.colors.error }}>
          <AlertTriangle className="w-3 h-3" />
          <span>Error</span>
        </div>
      )}
    </motion.div>
  );
};

const UltimateDashboardEnhanced: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes.quantum);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { state, loading, error, refetch } = useSystemState();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    root.style.setProperty('--gradient-primary', currentTheme.gradients.primary);
    root.style.setProperty('--gradient-secondary', currentTheme.gradients.secondary);
    root.style.setProperty('--gradient-background', currentTheme.gradients.background);
  }, [currentTheme]);

  const handleTogglePause = async () => {
    try {
      const newState = !isPaused;
      await fetch('/api/trust/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: newState })
      });
      setIsPaused(newState);
    } catch (err) {
      console.error('Failed to toggle pause state:', err);
    }
  };

  if (loading && !state) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentTheme.gradients.background }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full"
          style={{ border: `3px solid ${currentTheme.primary}20`, borderTopColor: currentTheme.primary }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: currentTheme.gradients.background }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl" style={{ background: currentTheme.gradients.primary }}>
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: currentTheme.colors.text }}>
                JASON Autonomous Agent
              </h1>
              <p className="text-sm" style={{ color: currentTheme.colors.text + '60' }}>
                Production Control Interface
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Selector */}
            <div className="flex gap-2 p-1 rounded-xl backdrop-blur-md border" style={{ borderColor: currentTheme.colors.surface + '40' }}>
              {Object.values(themes).map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setCurrentTheme(theme)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTheme.name === theme.name
                      ? 'text-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                  style={{
                    backgroundColor: currentTheme.name === theme.name ? currentTheme.colors.primary : 'transparent'
                  }}
                >
                  {theme.name}
                </button>
              ))}
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleTogglePause}
                className="p-3 rounded-xl backdrop-blur-md border transition-all hover:scale-105"
                style={{
                  borderColor: currentTheme.colors.surface + '40',
                  backgroundColor: isPaused ? currentTheme.colors.error + '20' : currentTheme.colors.success + '20'
                }}
              >
                {isPaused ? (
                  <Play className="w-5 h-5" style={{ color: currentTheme.colors.success }} />
                ) : (
                  <Pause className="w-5 h-5" style={{ color: currentTheme.colors.error }} />
                )}
              </button>
              
              <button
                onClick={refetch}
                className="p-3 rounded-xl backdrop-blur-md border transition-all hover:scale-105"
                style={{ borderColor: currentTheme.colors.surface + '40' }}
              >
                <RotateCcw className="w-5 h-5" style={{ color: currentTheme.colors.text }} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl backdrop-blur-md border"
          style={{
            backgroundColor: currentTheme.colors.error + '20',
            borderColor: currentTheme.colors.error + '40'
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" style={{ color: currentTheme.colors.error }} />
            <span style={{ color: currentTheme.colors.error }}>{error}</span>
          </div>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* System Health */}
        <MetricCard
          title="System Status"
          value={state?.health.status.toUpperCase() || 'UNKNOWN'}
          icon={<Activity className="w-6 h-6 text-white" />}
          status={state?.health.status === 'online' ? 'good' : state?.health.status === 'degraded' ? 'warning' : 'error'}
          theme={currentTheme}
        />

        {/* Uptime */}
        <MetricCard
          title="Uptime"
          value={state?.health.uptime ? `${Math.floor(state.health.uptime / 3600)}h ${Math.floor((state.health.uptime % 3600) / 60)}m` : '--'}
          icon={<Clock className="w-6 h-6 text-white" />}
          theme={currentTheme}
        />

        {/* CPU Usage */}
        <MetricCard
          title="CPU Usage"
          value={`${state?.performance.cpu || 0}%`}
          icon={<Cpu className="w-6 h-6 text-white" />}
          progress={state?.performance.cpu || 0}
          status={state?.performance.cpu > 80 ? 'error' : state?.performance.cpu > 60 ? 'warning' : 'good'}
          theme={currentTheme}
        />

        {/* Memory Usage */}
        <MetricCard
          title="Memory Usage"
          value={`${state?.performance.memory || 0}%`}
          icon={<Database className="w-6 h-6 text-white" />}
          progress={state?.performance.memory || 0}
          status={state?.performance.memory > 80 ? 'error' : state?.performance.memory > 60 ? 'warning' : 'good'}
          theme={currentTheme}
        />

        {/* Active Jobs */}
        <MetricCard
          title="Active Jobs"
          value={state?.automation.activeJobs || 0}
          icon={<Globe className="w-6 h-6 text-white" />}
          trend={state?.automation.activeJobs ? 5 : 0}
          theme={currentTheme}
        />

        {/* Success Rate */}
        <MetricCard
          title="Success Rate"
          value={`${state?.automation.successRate?.toFixed(1) || 100}%`}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          progress={state?.automation.successRate || 100}
          status={state?.automation.successRate > 90 ? 'good' : state?.automation.successRate > 70 ? 'warning' : 'error'}
          theme={currentTheme}
        />

        {/* Security Status */}
        <MetricCard
          title="Trust Level"
          value={`L${state?.security.trustLevel || 1}`}
          icon={<Shield className="w-6 h-6 text-white" />}
          status={state?.security.trustLevel === 3 ? 'good' : state?.security.trustLevel === 2 ? 'warning' : 'error'}
          theme={currentTheme}
        />

        {/* Model Accuracy */}
        <MetricCard
          title="Model Accuracy"
          value={`${state?.learning.modelAccuracy ? (state.learning.modelAccuracy * 100).toFixed(1) : 0}%`}
          icon={<Brain className="w-6 h-6 text-white" />}
          progress={state?.learning.modelAccuracy ? state.learning.modelAccuracy * 100 : 0}
          trend={state?.learning.modelAccuracy ? 2.5 : 0}
          theme={currentTheme}
        />
      </div>

      {/* Services Status */}
      {state?.health.services && state.health.services.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: currentTheme.colors.text }}>
            Service Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.health.services.map((service, index) => (
              <ServiceStatusCard key={service.name} service={service} theme={currentTheme} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Clock component
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
    <path strokeWidth="2" d="M12 6v6l4 2"/>
  </svg>
);

export default UltimateDashboardEnhanced;
