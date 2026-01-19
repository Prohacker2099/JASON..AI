import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Brain, 
  Zap, 
  Settings, 
  Globe, 
  Shield, 
  Database,
  Activity,
  BarChart3,
  Cpu,
  Network,
  Menu,
  X,
  ChevronRight,
  Layers
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  badge?: number;
  disabled?: boolean;
}

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  theme: 'dark' | 'light' | 'quantum';
  onThemeChange: (theme: 'dark' | 'light' | 'quantum') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const EnhancedNavigation: React.FC<NavigationProps> = ({
  activeView,
  onViewChange,
  theme,
  onThemeChange,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      description: 'System overview and metrics'
    },
    {
      id: 'automation',
      label: 'Automation',
      icon: <Zap className="w-5 h-5" />,
      description: 'Task orchestration and workflows',
      badge: 3
    },
    {
      id: 'intelligence',
      label: 'Intelligence',
      icon: <Brain className="w-5 h-5" />,
      description: 'AI models and learning systems'
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="w-5 h-5" />,
      description: 'Trust levels and permissions'
    },
    {
      id: 'network',
      label: 'Network',
      icon: <Network className="w-5 h-5" />,
      description: 'Connections and data flow'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Performance insights and reports'
    },
    {
      id: 'devices',
      label: 'Devices',
      icon: <Cpu className="w-5 h-5" />,
      description: 'Hardware and IoT management'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      description: 'Configuration and preferences'
    }
  ];

  const themeColors = {
    dark: {
      background: 'rgba(15, 23, 42, 0.95)',
      surface: 'rgba(30, 41, 59, 0.8)',
      border: 'rgba(71, 85, 105, 0.3)',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      accent: '#6366f1',
      hover: 'rgba(99, 102, 241, 0.1)'
    },
    light: {
      background: 'rgba(248, 250, 252, 0.95)',
      surface: 'rgba(255, 255, 255, 0.8)',
      border: 'rgba(226, 232, 240, 0.8)',
      text: '#1e293b',
      textSecondary: '#64748b',
      accent: '#3b82f6',
      hover: 'rgba(59, 130, 246, 0.1)'
    },
    quantum: {
      background: 'rgba(10, 10, 15, 0.95)',
      surface: 'rgba(26, 26, 46, 0.8)',
      border: 'rgba(139, 92, 246, 0.3)',
      text: '#e0e7ff',
      textSecondary: '#a5b4fc',
      accent: '#8b5cf6',
      hover: 'rgba(139, 92, 246, 0.1)'
    }
  };

  const colors = themeColors[theme];

  const handleNavClick = (itemId: string) => {
    onViewChange(itemId);
    setIsMobileMenuOpen(false);
  };

  const NavItemComponent: React.FC<{ item: NavItem; isMobile?: boolean }> = ({ item, isMobile = false }) => (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setHoveredItem(item.id)}
      onHoverEnd={() => setHoveredItem(null)}
      onClick={() => !item.disabled && handleNavClick(item.id)}
      className={`
        relative p-4 rounded-xl cursor-pointer transition-all duration-200
        ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
        ${activeView === item.id ? 'shadow-lg' : ''}
      `}
      style={{
        backgroundColor: activeView === item.id ? colors.accent : 'transparent',
        color: activeView === item.id ? '#ffffff' : colors.text
      }}
    >
      {/* Active indicator */}
      {activeView === item.id && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
          style={{ backgroundColor: colors.accent }}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-lg transition-colors
            ${activeView === item.id ? 'bg-white/20' : ''}
          `}>
            {item.icon}
          </div>
          
          {!isCollapsed && (
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{item.label}</h3>
              {!isMobile && item.description && (
                <p className="text-xs mt-1" style={{ color: activeView === item.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary }}>
                  {item.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Badge and arrow */}
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            {item.badge && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                style={{
                  backgroundColor: activeView === item.id ? 'rgba(255,255,255,0.2)' : colors.accent,
                  color: '#ffffff'
                }}
              >
                {item.badge}
              </motion.div>
            )}
            <ChevronRight 
              className={`w-4 h-4 transition-transform ${
                hoveredItem === item.id ? 'translate-x-1' : ''
              } ${activeView === item.id ? 'text-white' : ''}`}
            />
          </div>
        )}
      </div>

      {/* Hover tooltip for collapsed state */}
      {isCollapsed && hoveredItem === item.id && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-full ml-2 p-3 rounded-lg shadow-xl z-50 whitespace-nowrap"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.text
          }}
        >
          <div className="font-semibold text-sm">{item.label}</div>
          {item.description && (
            <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              {item.description}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 rounded-xl backdrop-blur-md shadow-lg"
          style={{ backgroundColor: colors.surface, color: colors.text }}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <motion.div
          initial={{ width: isCollapsed ? 80 : 320 }}
          animate={{ width: isCollapsed ? 80 : 320 }}
          className="h-screen backdrop-blur-xl border-r"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border
          }}
        >
          <div className="p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isCollapsed ? 0 : 1, scale: isCollapsed ? 0.8 : 1 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 rounded-xl" style={{ backgroundColor: colors.accent }}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                {!isCollapsed && (
                  <div>
                    <h1 className="font-bold text-lg" style={{ color: colors.text }}>
                      JASON
                    </h1>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      Autonomous Agent
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Collapse toggle */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleCollapse}
                className="p-2 rounded-lg transition-colors hover:shadow-md"
                style={{ color: colors.text }}
              >
                <Layers className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {navigationItems.map((item) => (
                <NavItemComponent key={item.id} item={item} />
              ))}
            </div>

            {/* Theme Selector */}
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-4 border-t"
                style={{ borderColor: colors.border }}
              >
                <div className="p-3 rounded-xl" style={{ backgroundColor: colors.surface }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    Theme
                  </p>
                  <div className="flex gap-2">
                    {(['dark', 'light', 'quantum'] as const).map((themeOption) => (
                      <button
                        key={themeOption}
                        onClick={() => onThemeChange(themeOption)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          theme === themeOption
                            ? 'text-white shadow-md'
                            : 'hover:shadow-sm'
                        }`}
                        style={{
                          backgroundColor: theme === themeOption ? colors.accent : 'transparent',
                          color: theme === themeOption ? '#ffffff' : colors.text
                        }}
                      >
                        {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed top-0 left-0 h-full w-80 z-50 backdrop-blur-xl border-r"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border
              }}
            >
              <div className="p-4 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: colors.accent }}>
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg" style={{ color: colors.text }}>
                      JASON
                    </h1>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      Autonomous Agent
                    </p>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {navigationItems.map((item) => (
                    <NavItemComponent key={item.id} item={item} isMobile />
                  ))}
                </div>

                {/* Theme Selector */}
                <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: colors.surface }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                      Theme
                    </p>
                    <div className="flex gap-2">
                      {(['dark', 'light', 'quantum'] as const).map((themeOption) => (
                        <button
                          key={themeOption}
                          onClick={() => {
                            onThemeChange(themeOption);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            theme === themeOption
                              ? 'text-white shadow-md'
                              : 'hover:shadow-sm'
                          }`}
                          style={{
                            backgroundColor: theme === themeOption ? colors.accent : 'transparent',
                            color: theme === themeOption ? '#ffffff' : colors.text
                          }}
                        >
                          {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedNavigation;
