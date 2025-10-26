import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/themes.scss';

type ThemeType = 'dark' | 'light' | 'quantum';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeType;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'quantum'
}) => {
  const [theme, setThemeState] = useState<ThemeType>(defaultTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('jason-theme') as ThemeType;
    if (savedTheme && ['dark', 'light', 'quantum'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-dark', 'theme-light', 'theme-quantum');
    
    // Add new theme class
    root.classList.add(`theme-${theme}`);
    
    // Save to localStorage
    localStorage.setItem('jason-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const themeColors = {
      dark: '#0a0a0a',
      light: '#f8fafc',
      quantum: '#0f0f23'
    };
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColors[theme]);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    if (newTheme === theme) return;
    
    setIsTransitioning(true);
    setThemeState(newTheme);
    
    // Reset transition state after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const toggleTheme = () => {
    const themes: ThemeType[] = ['dark', 'light', 'quantum'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isTransitioning
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={`theme-provider theme-${theme} ${isTransitioning ? 'theme-transition' : ''}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Theme toggle button component
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme, isTransitioning } = useTheme();

  const themeIcons = {
    dark: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
      </svg>
    ),
    light: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
      </svg>
    ),
    quantum: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M12,1V5M12,19v4M4.22,4.22l2.83,2.83M16.95,16.95l2.83,2.83M1,12H5M19,12h4M4.22,19.78l2.83-2.83M16.95,7.05l2.83-2.83"/>
      </svg>
    )
  };

  const themeLabels = {
    dark: 'Dark Mode',
    light: 'Light Mode',
    quantum: 'Quantum Mode'
  };

  return (
    <motion.button
      className={`theme-toggle themed-button secondary ${className}`}
      onClick={toggleTheme}
      disabled={isTransitioning}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Switch to ${themeLabels[theme]} (Current: ${themeLabels[theme]})`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 180, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="theme-icon"
        >
          {themeIcons[theme]}
        </motion.div>
      </AnimatePresence>
      
      <span className="theme-label">
        {themeLabels[theme]}
      </span>
      
      <style jsx>{`
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
        }
        
        .theme-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .theme-label {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        @media (max-width: 640px) {
          .theme-label {
            display: none;
          }
        }
        
        .theme-toggle:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </motion.button>
  );
};

// Theme selector component
export const ThemeSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  const themes: { value: ThemeType; label: string; description: string }[] = [
    { value: 'dark', label: 'Dark', description: 'Classic dark theme' },
    { value: 'light', label: 'Light', description: 'Clean light theme' },
    { value: 'quantum', label: 'Quantum', description: 'Futuristic quantum theme' }
  ];

  return (
    <div className={`theme-selector ${className}`}>
      <h3 className="selector-title">Choose Theme</h3>
      <div className="theme-options">
        {themes.map((themeOption) => (
          <motion.button
            key={themeOption.value}
            className={`theme-option ${theme === themeOption.value ? 'active' : ''}`}
            onClick={() => setTheme(themeOption.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`theme-preview theme-${themeOption.value}`}>
              <div className="preview-header"></div>
              <div className="preview-content">
                <div className="preview-sidebar"></div>
                <div className="preview-main"></div>
              </div>
            </div>
            <div className="theme-info">
              <h4 className="theme-name">{themeOption.label}</h4>
              <p className="theme-description">{themeOption.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
      
      <style jsx>{`
        .theme-selector {
          padding: var(--spacing-lg);
        }
        
        .selector-title {
          font-size: var(--text-xl);
          font-weight: 600;
          margin-bottom: var(--spacing-lg);
          color: var(--text);
        }
        
        .theme-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }
        
        .theme-option {
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-md);
          cursor: pointer;
          transition: all var(--transition-normal) ease;
          text-align: left;
        }
        
        .theme-option:hover {
          background: var(--surface-hover);
          border-color: var(--primary);
        }
        
        .theme-option.active {
          border-color: var(--primary);
          background: rgba(var(--primary), 0.1);
        }
        
        .theme-preview {
          width: 100%;
          height: 80px;
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: var(--spacing-sm);
          border: 1px solid var(--border);
        }
        
        .preview-header {
          height: 20px;
          background: var(--background-secondary);
        }
        
        .preview-content {
          display: flex;
          height: 60px;
        }
        
        .preview-sidebar {
          width: 30%;
          background: var(--surface);
        }
        
        .preview-main {
          flex: 1;
          background: var(--background);
        }
        
        .theme-info {
          text-align: center;
        }
        
        .theme-name {
          font-size: var(--text-base);
          font-weight: 600;
          margin: 0 0 var(--spacing-xs) 0;
          color: var(--text);
        }
        
        .theme-description {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin: 0;
        }
        
        /* Theme-specific preview colors */
        .theme-dark {
          --background: #0a0a0a;
          --background-secondary: #1a1a2e;
          --surface: rgba(255, 255, 255, 0.05);
          --border: rgba(255, 255, 255, 0.1);
        }
        
        .theme-light {
          --background: #f8fafc;
          --background-secondary: #f1f5f9;
          --surface: rgba(255, 255, 255, 0.8);
          --border: rgba(0, 0, 0, 0.1);
        }
        
        .theme-quantum {
          --background: #0f0f23;
          --background-secondary: #1a0b2e;
          --surface: rgba(139, 92, 246, 0.1);
          --border: rgba(139, 92, 246, 0.2);
        }
      `}</style>
    </div>
  );
};
