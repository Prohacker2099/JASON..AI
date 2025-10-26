import React, { useState, useCallback } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DevicesIcon from '@mui/icons-material/Devices';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InsightsIcon from '@mui/icons-material/Insights';
import SettingsIcon from '@mui/icons-material/Settings';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import useHapticFeedback from '../hooks/useHapticFeedback';
import useAmbientSound from '../hooks/useAmbientSound';
import '../styles/JasonSphereNavigation.css'; // Import the CSS file

interface NavigationItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavigationItem[] = [
  { name: 'Devices', icon: <DevicesIcon />, path: '/devices' },
  { name: 'Automations', icon: <AutoAwesomeIcon />, path: '/automations' },
  { name: 'Insights', icon: <InsightsIcon />, path: '/insights' },
  { name: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { name: 'Marketplace', icon: <StorefrontIcon />, path: '/marketplace' },
  { name: 'Wellness', icon: <FavoriteBorderIcon />, path: '/wellness' },
  { name: 'Browser', icon: <WebAssetIcon />, path: '/browser' },
  { name: 'Communicate', icon: <ChatBubbleOutlineIcon />, path: '/communicate' },
  { name: 'Socialize', icon: <PeopleOutlineIcon />, path: '/socialize' },
];

const RadialMenuContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const RadialMenuButton = styled(IconButton)<{ open: string }>(({ open }) => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: '#00c6ff',
  color: 'white',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.5s ease-in-out',
  '&:hover': {
    backgroundColor: '#00aaff',
  },
  ...(open === 'true' && {
    transform: 'rotate(180deg)',
    boxShadow: '0 0 15px 8px rgba(0, 198, 255, 0.8)',
  }),
  ...(open === 'false' && {
    animation: `${orbPulse} 2s infinite alternate`,
  }),
}));

const orbPulse = keyframes`
  0% {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  }
  100% {
    box-shadow: 0 4px 15px rgba(0, 198, 255, 0.5);
  }
`;

const StyledRadialMenuItem = styled(motion.div)<{ onClick?: () => void }>`
  position: absolute;
  width: 50px; /* Size of each menu item */
  height: 50px;
  border-radius: 50%;
  background-color: #3a3a3a;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease-in-out;
  opacity: 0;
  transform: scale(0);
  position: relative; /* Needed for pseudo-elements */
  overflow: hidden; /* Ensures glow stays within bounds */

  &:hover {
    background-color: #555;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 198, 255, 0.7) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    z-index: -1;
  }

  &:hover::before {
    opacity: 1;
    animation: itemGlow 1.5s infinite alternate;
  }
`;

const itemGlow = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.2);
    opacity: 1;
  }
`;

const JasonSphereNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerHapticFeedback } = useHapticFeedback();
  const { playSound } = useAmbientSound();

  const navigate = useNavigate();

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
    triggerHapticFeedback('light');
    playSound('activate');
  }, [triggerHapticFeedback, playSound]);

  const handleMenuItemClick = useCallback((path: string) => {
    navigate(path);
    setIsOpen(false);
    triggerHapticFeedback('medium');
    playSound('success');
  }, [navigate, triggerHapticFeedback, playSound]);

  return (
    <RadialMenuContainer>
      <AnimatePresence>
        {isOpen && (
          <Box className={`radial-menu ${isOpen ? 'open' : ''}`}>
            {navItems.map((item, index) => {
              const angle = (360 / navItems.length) * index;
              const radius = 80;
              const x = radius * Math.cos((angle * Math.PI) / 180 - Math.PI / 2);
              const y = radius * Math.sin((angle * Math.PI) / 180 - Math.PI / 2);

              return (
                <StyledRadialMenuItem
                  key={item.name}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x, y }}
                  exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                  onClick={() => handleMenuItemClick(item.path)}
                >
                  <Tooltip title={item.name} placement="left">
                    <IconButton color="inherit">
                      {item.icon}
                    </IconButton>
                  </Tooltip>
                </StyledRadialMenuItem>
              );
            })}
          </Box>
        )}
      </AnimatePresence>
      <RadialMenuButton open={isOpen.toString()} onClick={handleToggle} className="jason-sphere-navigation-button">
        <MenuIcon />
      </RadialMenuButton>
    </RadialMenuContainer>
  );
};

export default JasonSphereNavigation;