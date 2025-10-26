import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import '../styles/RecentActivityStream.css';
import { useEffect, useState } from 'react';

interface Activity {
  id: string;
  timestamp: string;
  message: string;
  icon?: React.ReactNode;
}

interface RecentActivityStreamProps {
  activities: Activity[];
}

const RecentActivityStream: React.FC<RecentActivityStreamProps> = ({ activities }) => {
  return (
    <Paper className="activity-stream-container">
      <Typography variant="h5" gutterBottom>Recent Activity Stream</Typography>
      <List>
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ListItem className={`activity-item ${index === 0 ? 'new-entry' : ''}`}>
              {activity.icon && <Box sx={{ mr: 2 }}>{activity.icon}</Box>}
              <ListItemText
                primary={activity.message}
                secondary={activity.timestamp}
              />
            </ListItem>
          </motion.div>
        ))}
      </List>
    </Paper>
  );
};

export default RecentActivityStream;