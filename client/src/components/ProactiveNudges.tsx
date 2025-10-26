import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { motion } from 'framer-motion';
import '../styles/ProactiveNudges.css';

interface Nudge {
  id: string;
  message: string;
  actionText: string;
  onAction: () => void;
  illustration?: React.ReactNode;
}

interface ProactiveNudgesProps {
  nudges: Nudge[];
}

const ProactiveNudges: React.FC<ProactiveNudgesProps> = ({ nudges }) => {
  return (
    <Box className="proactive-nudges-container">
      {nudges.map((nudge) => (
        <motion.div
          key={nudge.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="nudge-card">
            <CardContent>
              {nudge.illustration && <div className="nudge-illustration">{nudge.illustration}</div>}
              <Typography variant="body1" className="nudge-message">
                {nudge.message}
              </Typography>
            </CardContent>
            <Button variant="contained" onClick={nudge.onAction} className="nudge-action-button">
              {nudge.actionText}
            </Button>
          </Card>
        </motion.div>
      ))}
    </Box>
  );
};

export default ProactiveNudges;
