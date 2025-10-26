import React, { useEffect } from 'react';
import { IconButton, Box } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import { keyframes, styled } from '@mui/material/styles';
import { motion, MotionProps, HTMLMotionProps } from 'framer-motion'; // Import MotionProps and HTMLMotionProps
import useHapticFeedback from '../hooks/useHapticFeedback';
import useAmbientSound from '../hooks/useAmbientSound';

interface JasonOrbProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(0, 123, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
  }
`;

const glowAnimation = keyframes`
  0% {
    box-shadow: 0 0 5px 5px rgba(255, 255, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 20px 10px rgba(255, 255, 255, 0.8);
  }
  100% {
    box-shadow: 0 0 5px 5px rgba(255, 255, 255, 0.5);
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
`;

// Define the props for the styled component, including both custom and motion props
interface StyledMotionButtonProps extends HTMLMotionProps<'button'> {
  $islistening: boolean;
  $isprocessing: boolean;
}

// Create a base MotionButton component that correctly forwards props and ref
const BaseMotionButton = React.forwardRef<HTMLButtonElement, StyledMotionButtonProps>(
  ({ $islistening, $isprocessing, ...props }, ref) => {
    return <motion.button ref={ref} {...props} />;
  }
);

// Apply styled to the base component
const StyledMotionButton = styled(BaseMotionButton)(
  ({ $islistening, $isprocessing }) => ({
    width: 60,
    height: 60,
    borderRadius: '50%',
    backgroundColor: '#1976d2', // A shade of blue
    color: 'white',
    border: 'none', // Remove default button border
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: '#1565c0',
    },
    ...($islistening && {
      animation: `${pulseAnimation} 1.5s infinite`,
    }),
    ...($isprocessing && {
      animation: `${glowAnimation} 1.5s infinite`,
      backgroundColor: '#FFD700', // Gold color for processing
    }),
    '&::after': {
      content: '""',
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: 'currentColor',
      opacity: 0,
      transform: 'scale(0)',
      transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
    },
    '&:active::after': {
      animation: `${ripple} 0.6s ease-out`,
    },
  })
);

const JasonOrb: React.FC<JasonOrbProps> = ({ isListening, isProcessing, onClick }) => {
  const { triggerHapticFeedback } = useHapticFeedback();
  const { playSound, stopSound } = useAmbientSound();

  const handleClick = () => {
    onClick();
    triggerHapticFeedback('light');
    if (!isListening && !isProcessing) {
      playSound('activate'); // Assuming 'activate' sound for initial click
    } else if (isListening) {
      playSound('deactivate'); // Assuming 'deactivate' sound when stopping listening
    }
  };

  // Effect for sound feedback based on state changes
  useEffect(() => {
    if (isListening) {
      playSound('listening');
    } else if (isProcessing) {
      playSound('processing');
    } else {
      stopSound();
    }
  }, [isListening, isProcessing, playSound, stopSound]);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <StyledMotionButton
        $islistening={isListening}
        $isprocessing={isProcessing}
        onClick={handleClick}
        aria-label="Activate Voice Assistant"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MicIcon fontSize="large" />
      </StyledMotionButton>
    </Box>
  );
};

export default JasonOrb;