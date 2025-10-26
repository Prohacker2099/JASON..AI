import React, { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import DevicesIcon from '@mui/icons-material/Devices';
import SettingsIcon from '@mui/icons-material/Settings';
import InsightsIcon from '@mui/icons-material/Insights';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import MenuIcon from '@mui/icons-material/Menu'; // Using MenuIcon for the central orb

import '../styles/SphereNavigation.css';

interface SphereNavigationProps {
  // No specific props needed for now, as it will handle its own state
}

const navItems = [
  { name: 'Dashboard', icon: <HomeIcon />, path: '/' },
  { name: 'Devices', icon: <DevicesIcon />, path: '/devices' },
  { name: 'Automations', icon: <SettingsIcon />, path: '/automations' },
  { name: 'Insights', icon: <InsightsIcon />, path: '/insights' },
  { name: 'Settings', icon: <SettingsIcon />, path: '/settings' }, // Added Settings
  { name: 'Marketplace', icon: <StorefrontIcon />, path: '/marketplace' },
  { name: 'Wellness', icon: <FavoriteIcon />, path: '/wellness' },
  { name: 'Browser', icon: <WebAssetIcon />, path: '/browser' },
  { name: 'Communicate', icon: <ChatIcon />, path: '/communicate' },
  { name: 'Socialize', icon: <PeopleIcon />, path: '/socialize' },
];

const itemVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const SphereNavigation: React.FC<SphereNavigationProps> = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <Box className="sphere-navigation-container">
      <Tooltip title="Navigation" placement="left">
        <IconButton
          className={`sphere-orb ${isOpen ? 'open' : ''}`}
          onClick={toggleOpen}
          color="primary"
          size="large"
        >
          <MenuIcon />
        </IconButton>
      </Tooltip>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="radial-menu"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                variants={itemVariants}
                className="radial-menu-item"
                style={{
                  transform: `rotate(${index * (360 / navItems.length)}deg) translate(100px) rotate(-${index * (360 / navItems.length)}deg)`,
                }}
              >
                <Tooltip title={item.name} placement="right">
                  <IconButton
                    component={Link}
                    to={item.path}
                    onClick={toggleOpen}
                    color="inherit"
                    size="small"
                    className="glowing-node" // Apply the glowing animation
                  >
                    {item.icon}
                  </IconButton>
                </Tooltip>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default SphereNavigation;