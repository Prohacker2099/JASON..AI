import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface VoiceAssistantProps {
  // Define props as needed for the voice assistant component
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = () => {
  return (
    <Box sx={{ p: 2, border: '1px solid #333', borderRadius: '8px', textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>JASON Voice Assistant</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your good buddy, ready to assist.
      </Typography>
      <Button variant="contained" color="primary">
        Activate Voice
      </Button>
    </Box>
  );
};

export default VoiceAssistant;
