import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import JasonPulseHeader from './JasonPulseHeader';
import UniverseAtAGlance from './UniverseAtAGlance';
import { Box, Typography, Card, CardContent } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import LockIcon from '@mui/icons-material/Lock';
import MessageIcon from '@mui/icons-material/Message';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventNoteIcon from '@mui/icons-material/EventNote';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ForumIcon from '@mui/icons-material/Forum'; 
      transports: ['websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 10000,
    });

    socket.on('connect', () => {
      console.log('Connected to JASON backend');
    });

    socket.on('deviceStateUpdate', (data: DeviceEvent) => {
      console.log(`Received device state update: ${data.deviceId}`, data.data);
      setDevices(prevDevices =>
        prevDevices.map(device =>
          device.deviceId === data.deviceId ? { ...device, ...data.data } : device
        )
      );
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from JASON backend');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDeviceActivate = useCallback((deviceId: string) => {
    setActiveDevice(deviceId);
  }, []);

  const handleDeviceDeactivate = useCallback(() => {
    setActiveDevice(null);
  }, []);

  const handleToggleLight = useCallback((deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId);
    if (device && device.type === 'light') {
      const socket = io('http:
        transports: ['websocket'],
        reconnectionAttempts: Infinity,
        reconnectionDelay: 10000,
      });
      socket.emit('controlLight', { deviceId, isOn: !device.isOn });
      console.log(`Sent command to toggle light ${deviceId}`);
    }
  }, [devices]);

  const cards: { id: string; title: string; status: string; type: 'lighting' | 'climate' | 'media' | 'security' | 'wellness' | 'productivity' | 'communication' | 'browser' | 'socialize'; onClick: () => void; animatedEffect?: string; }[] = [
    { id: 'lighting', title: 'Lighting', status: '5 lights On', type: 'lighting', onClick: () => console.log('Lighting clicked'), animatedEffect: 'lighting-on' },
    { id: 'climate', title: 'Climate', status: '72°F Heat Mode', type: 'climate', onClick: () => console.log('Climate clicked'), animatedEffect: 'climate-heating' },
    { id: 'media', title: 'Media', status: 'Playing: Lo-Fi Beats', type: 'media', onClick: () => console.log('Media clicked') },
    { id: 'security', title: 'Security', status: 'Living Room Motion: Clear', type: 'security', onClick: () => console.log('Security clicked') },
    { id: 'wellness', title: 'Wellness', status: 'Sleep Score: 8.2', type: 'wellness', onClick: () => console.log('Wellness clicked') },
    { id: 'productivity', title: 'Productivity', status: 'Next Meeting in 30 mins', type: 'productivity', onClick: () => console.log('Productivity clicked') },
    { id: 'communication', title: 'Communication', status: '3 Unread Messages', type: 'communication', onClick: () => console.log('Communication clicked') },
    { id: 'browser', title: 'Browser', status: 'AI-Powered Knowledge', type: 'browser', onClick: () => console.log('Browser clicked') },
    { id: 'socialize', title: 'Socialize', status: 'JASON Communities', type: 'socialize', onClick: () => console.log('Socialize clicked') },
  ];

  const handleNudgeClick = useCallback((nudgeId: string) => {
    console.log(`Nudge ${nudgeId} clicked`);
    triggerHapticFeedback('light');
    playSound('success');
    // In a real app, this would trigger an action and remove the nudge
    setNudges(prevNudges => prevNudges.filter(n => n.id !== nudgeId));
  }, [triggerHapticFeedback, playSound]);

  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'door': return <LockIcon fontSize="small" />;
      case 'message': return <MessageIcon fontSize="small" />;
      case 'light': return <LightbulbIcon fontSize="small" />;
      case 'call': return <CallIcon fontSize="small" />; // For missed calls
      case 'share': return <ShareIcon fontSize="small" />; // For file sharing
      default: return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <JasonPulseHeader userName={userName} proactiveInsight={proactiveInsight} />
      {/* Main content area */}
      <Box component="main" sx={{ flexGrow: 1, padding: '20px', marginTop: '64px' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          JASON - The Omnipotent AI Architect
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to your intelligent operating system for life.
        </Typography>

        <UniverseAtAGlance cards={cards} />

        {nudges.length > 0 && (
          <Box sx={{ marginTop: '30px' }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Proactive Nudges & Suggestions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {nudges.map(nudge => (
                <Card
                  key={nudge.id}
                  sx={{
                    minWidth: 275,
                    backgroundColor: '#3a3a3a',
                    color: 'white',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-5px)' },
                  }}
                  onClick={() => handleNudgeClick(nudge.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                      {nudge.animation === 'door-open' && <LockIcon sx={{ marginRight: 1 }} />}
                      {nudge.animation === 'stretch' && <FitnessCenterIcon sx={{ marginRight: 1 }} />}
                      {/* Add more nudge animations/icons here as needed */}
                      <Typography variant="body1">{nudge.text}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Click to act
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ marginTop: '30px' }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Recent Activity Stream
          </Typography>
          <Box sx={{ backgroundColor: '#2a2a2a', borderRadius: '10px', padding: '15px' }}>
            {activityStream.map(activity => (
              <Box key={activity.id} sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                <Box sx={{ marginRight: 1 }}>
                  {getActivityIcon(activity.icon)}
                </Box>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {activity.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activity.time}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <JasonSphereNavigation />
    </Box>
  );
};

export default JASONPulse;
