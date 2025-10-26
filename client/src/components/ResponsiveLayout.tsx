import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/responsive.scss';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  header,
  className = ''
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [breakpoint, setBreakpoint] = useState<BreakpointState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLarge: false
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      setBreakpoint({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 992,
        isDesktop: width >= 992 && width < 1200,
        isLarge: width >= 1200
      });

      // Auto-close sidebar on mobile when resizing to desktop
      if (width >= 992 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={`responsive-layout ${className}`}>
      {/* Mobile Header */}
      {breakpoint.isMobile && (
        <motion.header 
          className="mobile-header"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button 
            className="sidebar-toggle btn-responsive"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          {header}
        </motion.header>
      )}

      <div className="layout-container">
        {/* Sidebar */}
        {sidebar && (
          <>
            <AnimatePresence>
              {(sidebarOpen || !breakpoint.isMobile) && (
                <>
                  {/* Mobile Overlay */}
                  {breakpoint.isMobile && (
                    <motion.div
                      className="sidebar-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={closeSidebar}
                    />
                  )}
                  
                  {/* Sidebar */}
                  <motion.aside
                    className={`sidebar-responsive ${sidebarOpen ? 'open' : ''}`}
                    initial={breakpoint.isMobile ? { x: -280 } : { x: 0 }}
                    animate={{ x: 0 }}
                    exit={breakpoint.isMobile ? { x: -280 } : { x: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    {sidebar}
                  </motion.aside>
                </>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Main Content */}
        <main className={`main-content ${sidebar ? 'has-sidebar' : ''}`}>
          {/* Desktop Header */}
          {!breakpoint.isMobile && header && (
            <motion.header 
              className="desktop-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {header}
            </motion.header>
          )}

          {/* Content Area */}
          <div className="content-area">
            {children}
          </div>
        </main>
      </div>

      <style jsx>{`
        .responsive-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #0f0f23 0%, #1a0b2e 25%, #2d1b69 50%, #3730a3 75%, #4c1d95 100%);
          color: #e0e7ff;
        }

        .mobile-header {
          display: flex;
          align-items: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .sidebar-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.5rem;
          border-radius: 0.5rem;
          margin-right: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .layout-container {
          flex: 1;
          display: flex;
          position: relative;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          transition: margin-left 0.3s ease;
        }

        .main-content.has-sidebar {
          @media (min-width: 992px) {
            margin-left: 320px;
          }
        }

        .desktop-header {
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .content-area {
          flex: 1;
          padding: clamp(1rem, 3vw, 2rem);
          overflow-y: auto;
        }

        @media (max-width: 767px) {
          .main-content.has-sidebar {
            margin-left: 0;
          }
          
          .content-area {
            padding: 1rem;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .content-area {
            padding: 1.5rem;
          }
        }

        @media (min-width: 1200px) {
          .content-area {
            padding: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ResponsiveLayout;
