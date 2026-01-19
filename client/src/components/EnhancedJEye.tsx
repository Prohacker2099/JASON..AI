import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { 
  Brain, 
  Activity, 
  Zap, 
  Shield, 
  Settings, 
  Play, 
  Pause, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Cpu,
  Database,
  Wifi,
  Eye,
  EyeOff
} from 'lucide-react';

// Types
interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
  cpu?: number;
  memory?: number;
}

interface JobStatus {
  id: string;
  goal?: string;
  status?: string;
  progress?: number;
  type?: 'automation' | 'learning' | 'analysis';
  createdAt: string;
}

interface SystemMetrics {
  activeConnections: number;
  processingQueue: number;
  errorRate: number;
  responseTime: number;
}

interface ThemeConfig {
  mode: 'dark' | 'light' | 'quantum';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    success: string;
    warning: string;
    error: string;
  };
}

const themes: Record<string, ThemeConfig> = {
  dark: {
    mode: 'dark',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      background: '#0f0f23',
      surface: '#1a1a2e',
      text: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    }
  },
  light: {
    mode: 'light',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    }
  },
  quantum: {
    mode: 'quantum',
    colors: {
      primary: '#8b5cf6',
      secondary: '#d946ef',
      accent: '#06b6d4',
      background: '#0a0a0f',
      surface: '#1a1a2e',
      text: '#e0e7ff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    }
  }
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4 }
  }
};

const cardVariants = {
  rest: { scale: 1, rotate: 0 },
  hover: { scale: 1.02, rotate: 1 }
};

// Custom hooks
const useWebSocket = (url: string) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
    
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
      } catch (err) {
        setError('Invalid data received');
      }
    };
    
    ws.onerror = () => {
      setError('Connection error');
      setIsConnected(false);
    };
    
    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => ws.close();
  }, [url]);

  return { data, error, isConnected };
};

const useSystemHealth = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/health');
        if (!response.ok) throw new Error('Health check failed');
        const data = await response.json();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (err) {
        // Metrics are optional, don't set error
      }
    };

    fetchHealth();
    fetchMetrics();
    
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return { health, metrics, loading, error };
};

// Components
const StatusIndicator: React.FC<{ 
  status: 'online' | 'offline' | 'warning'; 
  label: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, label, size = 'md' }) => {
  const colors = {
    online: 'bg-emerald-500',
    offline: 'bg-red-500',
    warning: 'bg-amber-500'
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size]} ${colors[status]} rounded-full animate-pulse`} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}> = ({ title, value, icon, trend, color = 'primary' }) => {
  const spring = useSpring({
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 300, friction: 10 }
  });

  return (
    <animated.div style={spring} className="bg-surface/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-70 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-primary/20">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <TrendingUp className={`w-4 h-4 ${
            trend === 'up' ? 'text-emerald-400' : 
            trend === 'down' ? 'text-red-400' : 'text-gray-400'
          }`} />
          <span className="text-xs opacity-70">{trend}</span>
        </div>
      )}
    </animated.div>
  );
};

const JobCard: React.FC<{ job: JobStatus }> = ({ job }) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400';
      case 'failed': return 'text-red-400';
      case 'running': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'automation': return <Zap className="w-4 h-4" />;
      case 'learning': return <Brain className="w-4 h-4" />;
      case 'analysis': return <Activity className="w-4 h-4" />;
      default: return <Cpu className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className="bg-surface/10 backdrop-blur-md rounded-lg p-3 border border-white/10"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getTypeIcon(job.type)}
          <span className="text-xs font-mono opacity-70">#{job.id.slice(0, 8)}</span>
        </div>
        <span className={`text-xs font-medium ${getStatusColor(job.status)}`}>
          {job.status || 'unknown'}
        </span>
      </div>
      {job.goal && (
        <p className="text-xs opacity-80 line-clamp-2">{job.goal}</p>
      )}
      {job.progress !== undefined && (
        <div className="mt-2">
          <div className="w-full bg-white/10 rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

const EnhancedJEye: React.FC = () => {
  const [theme, setTheme] = useState<ThemeConfig>(themes.quantum);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'metrics'>('overview');
  const [isPaused, setIsPaused] = useState(false);
  
  const { health, metrics, loading, error } = useSystemHealth();
  const { data: wsData, error: wsError, isConnected } = useWebSocket('ws://localhost:3001');
  
  const [jobs, setJobs] = useState<JobStatus[]>([]);

  const controls = useAnimation();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [theme]);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/orch/jobs');
        if (response.ok) {
          const data = await response.json();
          setJobs(data.slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePause = useCallback(async () => {
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
  }, [isPaused]);

  const currentTheme = useMemo(() => theme.colors, [theme]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-primary/20 backdrop-blur-md rounded-full border border-white/20 hover:bg-primary/30 transition-colors"
      >
        <Eye className="w-5 h-5" style={{ color: currentTheme.primary }} />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      className="fixed bottom-4 right-4 z-50 font-sans"
      style={{ width: isExpanded ? 480 : 360 }}
    >
      <div 
        className="backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ backgroundColor: currentTheme.background + 'cc' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: currentTheme.primary + '20' }}>
                <Brain className="w-5 h-5" style={{ color: currentTheme.primary }} />
              </div>
              <div>
                <h3 className="font-semibold text-white">JASON Control</h3>
                <StatusIndicator 
                  status={isConnected ? (isPaused ? 'warning' : 'online') : 'offline'} 
                  label={isPaused ? 'Paused' : 'Active'} 
                  size="sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePause}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                style={{ backgroundColor: isPaused ? currentTheme.error + '20' : currentTheme.success + '20' }}
              >
                {isPaused ? (
                  <Play className="w-4 h-4" style={{ color: currentTheme.success }} />
                ) : (
                  <Pause className="w-4 h-4" style={{ color: currentTheme.error }} />
                )}
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Settings className="w-4 h-4" style={{ color: currentTheme.text }} />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <EyeOff className="w-4 h-4" style={{ color: currentTheme.text }} />
              </button>
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        {isExpanded && (
          <div className="p-4 border-b border-white/10">
            <div className="flex gap-2">
              {Object.entries(themes).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setTheme(config)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    theme.mode === key 
                      ? 'bg-primary text-white' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['overview', 'jobs', 'metrics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2'
                  : 'text-white/60 hover:text-white/80'
              }`}
              style={{ borderColor: activeTab === tab ? currentTheme.primary : 'transparent' }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4" style={{ maxHeight: isExpanded ? 500 : 400, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-300">{error}</span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    title="Status"
                    value={health?.status || 'Unknown'}
                    icon={<Activity className="w-4 h-4" />}
                    color={currentTheme.primary}
                  />
                  <MetricCard
                    title="Uptime"
                    value={health ? `${Math.floor(health.uptime / 60)}m` : '--'}
                    icon={<Clock className="w-4 h-4" />}
                    color={currentTheme.secondary}
                  />
                  <MetricCard
                    title="Jobs"
                    value={jobs.length}
                    icon={<Cpu className="w-4 h-4" />}
                    color={currentTheme.accent}
                  />
                  <MetricCard
                    title="CPU"
                    value={metrics?.cpu ? `${metrics.cpu}%` : '--'}
                    icon={<Zap className="w-4 h-4" />}
                    color={currentTheme.success}
                  />
                </div>

                {wsError && (
                  <div className="p-2 rounded bg-amber-500/20 border border-amber-500/30">
                    <p className="text-xs text-amber-300">WebSocket: {wsError}</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'jobs' && (
              <motion.div
                key="jobs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                variants={containerVariants}
                className="space-y-3"
              >
                {jobs.length > 0 ? (
                  jobs.map((job) => <JobCard key={job.id} job={job} />)
                ) : (
                  <div className="text-center py-8 opacity-60">
                    <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No active jobs</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'metrics' && (
              <motion.div
                key="metrics"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-70">Connections</span>
                    <span className="font-mono">{metrics?.activeConnections || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-70">Queue Size</span>
                    <span className="font-mono">{metrics?.processingQueue || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-70">Error Rate</span>
                    <span className="font-mono">{metrics?.errorRate ? `${(metrics.errorRate * 100).toFixed(1)}%` : '0%'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-70">Response Time</span>
                    <span className="font-mono">{metrics?.responseTime || 0}ms</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Add Clock icon import
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
    <path strokeWidth="2" d="M12 6v6l4 2"/>
  </svg>
);

export default EnhancedJEye;
