const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'JASON AI Server Running', timestamp: new Date().toISOString() });
});

// Mock energy endpoints for testing
app.get('/api/energy/devices', (req, res) => {
  res.json({ 
    devices: [
      {
        id: 'demo_device_1',
        name: 'Demo Smart Plug',
        type: 'smart_plug',
        protocol: 'wifi',
        isOnline: true,
        lastReading: {
          powerWatts: 125,
          voltageVolts: 230,
          currentAmps: 0.54,
          energyKwh: 2.5
        },
        maxPower: 2000,
        location: 'Living Room'
      }
    ], 
    total: 1 
  });
});

app.get('/api/energy/usage/total', (req, res) => {
  res.json({
    totalUsageKwh: 45.2,
    totalCost: 6.78,
    period: '24 hours'
  });
});

app.post('/api/energy/start', (req, res) => {
  res.json({ success: true, message: 'Energy monitoring started (demo mode)' });
});

app.post('/api/energy/stop', (req, res) => {
  res.json({ success: true, message: 'Energy monitoring stopped' });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 JASON AI Server running on http://localhost:${PORT}`);
  console.log('📊 Energy monitoring system ready (demo mode)');
  console.log('🔌 Real device integration available but running in safe mode');
});
