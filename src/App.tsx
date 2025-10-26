import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/App.scss';

interface Device {
  id: string;
  ipAddress: string;
  protocol: 'HTTP' | 'HTTPS' | 'MQTT';
  status: 'on' | 'off';
  lastSeen: Date;
}

const App: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get('/api/devices');
        setDevices(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch devices');
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const controlDevice = async (deviceId: string, action: string) => {
    try {
      await axios.post(`/api/devices/${deviceId}/control`, { action });
      // Refresh device list after control
      const response = await axios.get('/api/devices');
      setDevices(response.data);
    } catch (err) {
      setError('Failed to control device');
    }
  };

  if (loading) return <div>Loading JASON...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="jason-app">
      <header className="jason-pulse-header">
        <h1>JASON: Your Intelligent Life Architect</h1>
      </header>
      
      <main className="jason-universe">
        <section className="devices-overview">
          <h2>Connected Devices</h2>
          {devices.length === 0 ? (
            <p>No devices discovered yet. Scanning your environment...</p>
          ) : (
            <div className="device-grid">
              {devices.map(device => (
                <div key={device.id} className="device-card">
                  <h3>{device.id}</h3>
                  <p>IP: {device.ipAddress}</p>
                  <p>Protocol: {device.protocol}</p>
                  <p>Status: {device.status}</p>
                  <div className="device-actions">
                    <button 
                      onClick={() => controlDevice(device.id, 'toggle')}
                      className={`toggle-btn ${device.status === 'on' ? 'active' : ''}`}
                    >
                      {device.status === 'on' ? 'Turn Off' : 'Turn On'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="jason-footer">
        <p>JASON AI - Empowering Your Living Environment</p>
      </footer>
    </div>
  );
};

export default App;

