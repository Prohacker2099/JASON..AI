import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ghost, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Globe, 
  Terminal, 
  FileText, 
  Download, 
  Camera, 
  Monitor,
  Zap,
  Shield,
  Brain,
  Cpu,
  Database,
  Network,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Eye,
  Code,
  Bot,
  Target,
  Layers,
  Activity
} from 'lucide-react';

interface Task {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  logs: string[];
  results?: any;
  errors?: string[];
  environment: 'web' | 'system' | 'hybrid';
  retryCount: number;
  maxRetries: number;
}

interface GhostStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  queuedTasks: number;
  isRunning: boolean;
  uptime: number;
}

const UniversalGhostUI: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<GhostStats | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'create' | 'monitor'>('overview');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch tasks and stats
  useEffect(() => {
    fetchTasks();
    fetchStats();
    const interval = setInterval(() => {
      fetchTasks();
      fetchStats();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/ghost/tasks');
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ghost/statistics');
      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const createTask = async (taskType: string, config: any) => {
    setIsCreating(true);
    try {
      const endpoint = `/api/ghost/${taskType}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchTasks();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const controlTask = async (taskId: string, action: 'cancel' | 'pause' | 'resume') => {
    try {
      const response = await fetch(`/api/ghost/task/${taskId}/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error(`Failed to ${action} task:`, error);
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <Square className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'running': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'failed': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'paused': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'cancelled': return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: Database, color: 'purple' },
          { label: 'Active', value: stats?.activeTasks || 0, icon: Activity, color: 'blue' },
          { label: 'Completed', value: stats?.completedTasks || 0, icon: CheckCircle, color: 'green' },
          { label: 'Failed', value: stats?.failedTasks || 0, icon: XCircle, color: 'red' },
          { label: 'Queued', value: stats?.queuedTasks || 0, icon: Clock, color: 'yellow' },
          { label: 'Status', value: stats?.isRunning ? 'Running' : 'Stopped', icon: stats?.isRunning ? Zap : Square, color: stats?.isRunning ? 'green' : 'gray' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl backdrop-blur-xl border border-white/10"
            style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              <span className={`text-xs px-2 py-1 rounded-full bg-${stat.color}-500/20 text-${stat.color}-400`}>
                {stat.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: 'Web Scraping', 
            description: 'Extract data from any website',
            icon: Globe,
            color: 'blue',
            action: () => createTask('web-scraping', {
              url: 'https://example.com',
              selectors: { title: 'h1', content: 'p' }
            })
          },
          { 
            title: 'Form Automation', 
            description: 'Fill and submit forms automatically',
            icon: FileText,
            color: 'green',
            action: () => createTask('form-fill', {
              url: 'https://example.com/form',
              formData: { name: 'John', email: 'john@example.com' }
            })
          },
          { 
            title: 'System Commands', 
            description: 'Execute system commands',
            icon: Terminal,
            color: 'yellow',
            action: () => createTask('system-commands', {
              name: 'System Info',
              description: 'Get system information',
              commands: ['dir', 'whoami']
            })
          },
          { 
            title: 'Screenshot', 
            description: 'Capture website screenshots',
            icon: Camera,
            color: 'purple',
            action: () => createTask('screenshot', {
              url: 'https://example.com',
              options: { fullPage: true }
            })
          }
        ].map((action, index) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.action}
            className="p-6 rounded-xl backdrop-blur-xl border border-white/20 text-left transition-all hover:border-white/30"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
          >
            <action.icon className={`w-8 h-8 text-${action.color}-500 mb-3`} />
            <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
            <p className="text-sm text-gray-400">{action.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="backdrop-blur-xl border border-white/10 rounded-xl p-6" style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}>
        <h3 className="text-xl font-semibold text-white mb-4">Recent Tasks</h3>
        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg border border-white/10"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(task.status)}
                <div>
                  <div className="text-white font-medium">{task.name}</div>
                  <div className="text-sm text-gray-400">{task.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
                <div className="text-sm text-gray-400">{task.progress.toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">All Tasks</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Create Task
        </button>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl border border-white/10 rounded-xl p-6"
            style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(task.status)}
                  <h3 className="text-lg font-semibold text-white">{task.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-gray-400 mb-2">{task.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {task.environment}
                  </span>
                  {task.startTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(task.startTime).toLocaleTimeString()}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {task.progress.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {task.status === 'running' && (
                  <>
                    <button
                      onClick={() => controlTask(task.id, 'pause')}
                      className="p-2 rounded-lg bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/30 transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => controlTask(task.id, 'cancel')}
                      className="p-2 rounded-lg bg-red-600/20 text-red-500 hover:bg-red-600/30 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </>
                )}
                {task.status === 'paused' && (
                  <button
                    onClick={() => controlTask(task.id, 'resume')}
                    className="p-2 rounded-lg bg-green-600/20 text-green-500 hover:bg-green-600/30 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedTask(task)}
                  className="p-2 rounded-lg bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {task.status === 'running' && (
              <div className="mb-4">
                <div className="w-full h-2 rounded-full overflow-hidden bg-gray-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${task.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Recent Logs */}
            {task.logs.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Logs</h4>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {task.logs.slice(-3).map((log, index) => (
                    <div key={index} className="text-xs text-gray-500 font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Create Task</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'Web Automation',
            description: 'Create custom web automation workflows',
            icon: Globe,
            color: 'blue',
            features: ['Click elements', 'Fill forms', 'Extract data', 'Take screenshots']
          },
          {
            title: 'System Commands',
            description: 'Execute system commands and scripts',
            icon: Terminal,
            color: 'green',
            features: ['Run commands', 'Execute scripts', 'File operations', 'Process control']
          },
          {
            title: 'File Operations',
            description: 'Automate file and directory operations',
            icon: FileText,
            color: 'yellow',
            features: ['Read files', 'Write files', 'Delete files', 'List directories']
          },
          {
            title: 'API Calls',
            description: 'Make HTTP requests to any API',
            icon: Network,
            color: 'purple',
            features: ['GET requests', 'POST data', 'API testing', 'Webhook calls']
          },
          {
            title: 'Monitoring',
            description: 'Monitor websites and systems',
            icon: Monitor,
            color: 'red',
            features: ['Website monitoring', 'Health checks', 'Performance tracking', 'Alerts']
          },
          {
            title: 'Data Extraction',
            description: 'Extract and process data from websites',
            icon: Database,
            color: 'indigo',
            features: ['Web scraping', 'Data parsing', 'Content extraction', 'CSV export']
          }
        ].map((template, index) => (
          <motion.div
            key={template.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="backdrop-blur-xl border border-white/10 rounded-xl p-6 cursor-pointer transition-all hover:border-white/20"
            style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
            onClick={() => setShowCreateModal(true)}
          >
            <template.icon className={`w-10 h-10 text-${template.color}-500 mb-4`} />
            <h3 className="text-lg font-semibold text-white mb-2">{template.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{template.description}</p>
            <div className="space-y-1">
              {template.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-3 h-3" />
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

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
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Ghost className="w-12 h-12 text-purple-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Universal Ghost Hand
          </h1>
          <Ghost className="w-12 h-12 text-pink-500" />
        </div>
        <p className="text-xl text-gray-400">
          Complete automation capabilities - Web, System, File, API, Monitoring, and more
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-center mb-8">
        <div className="backdrop-blur-xl border border-white/20 rounded-xl p-1" style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}>
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'tasks', label: 'Tasks', icon: Database },
            { id: 'create', label: 'Create', icon: Bot },
            { id: 'monitor', label: 'Monitor', icon: Monitor }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'create' && renderCreate()}
          {activeTab === 'monitor' && <div className="text-center text-gray-400">Monitor view coming soon...</div>}
        </motion.div>
      </AnimatePresence>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{selectedTask.name}</h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 rounded-lg bg-red-600/20 text-red-500 hover:bg-red-600/30 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                  <p className="text-white">{selectedTask.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Status</h4>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedTask.status)}
                      <span className="text-white">{selectedTask.status}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Environment</h4>
                    <span className="text-white">{selectedTask.environment}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Progress</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-700">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${selectedTask.progress}%` }}
                        />
                      </div>
                      <span className="text-white">{selectedTask.progress.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Retries</h4>
                    <span className="text-white">{selectedTask.retryCount}/{selectedTask.maxRetries}</span>
                  </div>
                </div>

                {selectedTask.logs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Logs</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {selectedTask.logs.map((log, index) => (
                        <div key={index} className="text-xs text-gray-400 font-mono bg-black/30 p-2 rounded">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-md w-full"
              style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Create New Task</h3>
              <p className="text-gray-400 mb-6">Select a task type to get started with automation</p>
              
              <div className="space-y-3">
                {[
                  { type: 'web-scraping', label: 'Web Scraping', icon: Globe },
                  { type: 'form-fill', label: 'Form Fill', icon: FileText },
                  { type: 'system-commands', label: 'System Commands', icon: Terminal },
                  { type: 'screenshot', label: 'Screenshot', icon: Camera }
                ].map((option) => (
                  <button
                    key={option.type}
                    onClick={() => {
                      createTask(option.type, {
                        name: `Sample ${option.label}`,
                        description: `Automated ${option.label} task`
                      });
                    }}
                    disabled={isCreating}
                    className="w-full p-3 rounded-lg border border-white/20 text-left transition-all hover:border-white/30 disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                  >
                    <div className="flex items-center gap-3">
                      <option.icon className="w-5 h-5 text-purple-500" />
                      <span className="text-white">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-full mt-4 p-3 rounded-lg bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UniversalGhostUI;
