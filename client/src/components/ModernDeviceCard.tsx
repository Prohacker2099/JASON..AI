import React, { useCallback } from 'react';
import '../styles/ModernDeviceCard.css'; // Assuming you'll create this CSS file
import '../styles/AdaptiveLivingCardAnimations.css'; // Import animations
import { Box, Typography, Card, CardContent } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import LockIcon from '@mui/icons-material/Lock';
import SensorsIcon from '@mui/icons-material/Sensors';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import WorkIcon from '@mui/icons-material/Work';
import MessageIcon from '@mui/icons-material/Message';
import SpeakerIcon from '@mui/icons-material/Speaker';
import PublicIcon from '@mui/icons-material/Public'; // For Browser
import PeopleIcon from '@mui/icons-material/People'; // For Socialize/Communities
import useHapticFeedback from '../hooks/useHapticFeedback';
import useAmbientSound from '../hooks/useAmbientSound';

interface ModernDeviceCardProps {
  deviceId: string;
  title: string;
  status: string;
  type: 'lighting' | 'climate' | 'media' | 'security' | 'wellness' | 'productivity' | 'communication' | 'browser' | 'socialize';
  icon?: string;
  animatedEffect?: string;
  onClick?: () => void;
}

const getIconComponent = (type: string) => {
  switch (type) {
    case 'lighting': return <LightbulbIcon />;
    case 'climate': return <AcUnitIcon />;
    case 'media': return <SpeakerIcon />;
    case 'security': return <LockIcon />;
    case 'wellness': return <FitnessCenterIcon />;
    case 'productivity': return <WorkIcon />;
    case 'communication': return <MessageIcon />;
    case 'browser': return <PublicIcon />;
    case 'socialize': return <PeopleIcon />;
    default: return null;
  }
};

const ModernDeviceCard: React.FC<ModernDeviceCardProps> = ({
  title,
  status,
  type,
  icon,
  animatedEffect,
  onClick,
}) => {
  const { triggerHapticFeedback } = useHapticFeedback();
  const { playSound } = useAmbientSound();

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
      triggerHapticFeedback('light');
      playSound('activate'); // Play a subtle sound on card click
    }
  }, [onClick, triggerHapticFeedback, playSound]);

  return (
    <Card className={`modern-device-card ${animatedEffect || ''}`} onClick={handleClick}>
      <CardContent>
        <Box className="card-icon">
          {icon ? <img src={icon} alt={title} /> : getIconComponent(type)}
        </Box>
        <Typography variant="h6" component="div" className="card-title">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="card-status">
          {status}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ModernDeviceCard;
