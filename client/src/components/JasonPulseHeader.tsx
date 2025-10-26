import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { motion } from 'framer-motion';
import '../styles/JASONPulse.css'; // Import the CSS file

interface JasonPulseHeaderProps {
  onMenuClick: () => void;
  userName: string;
  proactiveInsight: string;
}

const greetings = [
  "Good morning, [userName]! The sun is shining bright today.",
  "Welcome back, [userName]. Ready to make today productive?",
  "Hello, [userName]. Your home is running smoothly.",
  "Hey there, [userName]! What can I do for you?",
  "Greetings, [userName]. A new day, new possibilities.",
];

const JasonPulseHeader: React.FC<JasonPulseHeaderProps> = ({ onMenuClick, userName, proactiveInsight }) => {
  const [currentGreeting, setCurrentGreeting] = useState('');

  useEffect(() => {
    const generateGreeting = () => {
      const randomIndex = Math.floor(Math.random() * greetings.length);
      let greeting = greetings[randomIndex];
      greeting = greeting.replace('[userName]', userName);
      setCurrentGreeting(greeting);
    };

    generateGreeting();
    const interval = setInterval(generateGreeting, 60000); // Change greeting every minute
    return () => clearInterval(interval);
  }, [userName]);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: 'transparent', boxShadow: 'none' }}>
      <Toolbar className="jason-pulse-header">
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, zIndex: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1, zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
              {currentGreeting}
            </Typography>
            <Typography variant="h6" component="p" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
              {proactiveInsight}
            </Typography>
          </motion.div>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default JasonPulseHeader;
