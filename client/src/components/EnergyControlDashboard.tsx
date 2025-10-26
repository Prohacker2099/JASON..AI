import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EnergyDevice {
  id: string;
  name: string;
  type: string;
  isOnline: boolean;
  powerWatts: number;
  energyKwh: number;
  voltage: number;
  current: number;
  cost: number;
  lastSeen: string;
}

interface EnergyReading {
  timestamp: string;
  powerWatts: number;
  energyKwh: number;
  cost: number;
}

export const EnergyControlDashboard: React.FC = () => {
  const [devices, setDevices] = useState<EnergyDevice[]>([]);
  const [totalPower, setTotalPower] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [energyHistory, setEnergyHistory] = useState<EnergyReading[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    fetchInitialData();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:3001/energy');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🔌 Connected to energy monitoring WebSocket');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'energy_reading':
          updateDeviceReading(data.deviceId, data.reading);
          break;
        case 'device_discovered':
          addDevice(data.device);
          break;
        case 'device_offline':
          markDeviceOffline(data.deviceId);
          break;
        case 'energy_optimized':
          showOptimizationResult(data.result);
          break;
      }
    };

    ws.onclose = () => {
      console.log('🔌 Energy WebSocket disconnected, reconnecting...');
      setTimeout(connectWebSocket, 5000);
    };
  };

  const fetchInitialData = async () => {
    try {
      const [devicesRes, historyRes] = await Promise.all([
        fetch('/api/energy/devices'),
        fetch('/api/energy/history?hours=24')
      ]);

      const devicesData = await devicesRes.json();
      const historyData = await historyRes.json();

      setDevices(devicesData.devices || []);
      setEnergyHistory(historyData.history || []);
      
      calculateTotals(devicesData.devices || []);
    } catch (error) {
      console.error('Failed to fetch energy data:', error);
    }
  };

  const updateDeviceReading = (deviceId: string, reading: any) => {
    setDevices(prev => prev.map(device => {
      if (device.id === deviceId) {
        return {
          ...device,
          powerWatts: reading.powerWatts,
          energyKwh: reading.energyKwh,
          voltage: reading.voltageVolts,
          current: reading.currentAmps,
          cost: calculateDeviceCost(reading.powerWatts),
          lastSeen: new Date().toISOString(),
          isOnline: true
        };
      }
      return device;
    }));

    // Add to history
    setEnergyHistory(prev => {
      const newReading = {
        timestamp: new Date().toISOString(),
        powerWatts: reading.powerWatts,
        energyKwh: reading.energyKwh,
        cost: calculateDeviceCost(reading.powerWatts)
      };
      
      const updated = [...prev, newReading];
      return updated.slice(-100); // Keep last 100 readings
    });
  };

  const addDevice = (device: any) => {
    const energyDevice: EnergyDevice = {
      id: device.id,
      name: device.name,
      type: device.type,
      isOnline: device.isOnline,
      powerWatts: device.lastReading?.powerWatts || 0,
      energyKwh: device.lastReading?.energyKwh || 0,
      voltage: device.lastReading?.voltageVolts || 230,
      current: device.lastReading?.currentAmps || 0,
      cost: calculateDeviceCost(device.lastReading?.powerWatts || 0),
      lastSeen: new Date().toISOString()
    };

    setDevices(prev => {
      const exists = prev.find(d => d.id === device.id);
      if (exists) return prev;
      return [...prev, energyDevice];
    });
  };

  const markDeviceOffline = (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId ? { ...device, isOnline: false } : device
    ));
  };

  const calculateDeviceCost = (powerWatts: number): number => {
    const kWh = powerWatts / 1000;
    const costPerKWh = 0.15; // $0.15 per kWh (adjust based on your rate)
    return kWh * costPerKWh;
  };

  const calculateTotals = (deviceList: EnergyDevice[]) => {
    const power = deviceList.reduce((sum, device) => sum + device.powerWatts, 0);
    const cost = deviceList.reduce((sum, device) => sum + device.cost, 0);
    
    setTotalPower(power);
    setTotalCost(cost);
  };

  useEffect(() => {
    calculateTotals(devices);
  }, [devices]);

  const controlDevice = async (deviceId: string, action: string, params?: any) => {
    try {
      const response = await fetch(`/api/energy/control/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params })
      });

      if (response.ok) {
        console.log(`✅ Device ${deviceId} controlled: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to control device ${deviceId}:`, error);
    }
  };

  const optimizeEnergy = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/energy/optimize', {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        showOptimizationResult(result);
      }
    } catch (error) {
      console.error('Energy optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const showOptimizationResult = (result: any) => {
    alert(`Energy Optimization Complete!\n` +
          `Devices optimized: ${result.devicesSwitched}\n` +
          `Energy saved: ${result.energySaved.toFixed(2)}W\n` +
          `Cost saved: $${(result.energySaved * 0.00015).toFixed(4)}/hour`);
  };

  // Chart configurations
  const powerHistoryChart = {
    data: {
      labels: energyHistory.slice(-20).map(r => 
        new Date(r.timestamp).toLocaleTimeString()
      ),
      datasets: [{
        label: 'Power Usage (W)',
        data: energyHistory.slice(-20).map(r => r.powerWatts),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Real-Time Power Usage' }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Watts' } }
      }
    }
  };

  const deviceUsageChart = {
    data: {
      labels: devices.map(d => d.name),
      datasets: [{
        label: 'Power (W)',
        data: devices.map(d => d.powerWatts),
        backgroundColor: devices.map(d => 
          d.isOnline ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: devices.map(d => 
          d.isOnline ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Device Power Consumption' }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Watts' } }
      }
    }
  };

  const costBreakdownChart = {
    data: {
      labels: devices.map(d => d.name),
      datasets: [{
        data: devices.map(d => d.cost * 24), // Daily cost
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' as const },
        title: { display: true, text: 'Daily Cost Breakdown' }
      }
    }
  };

  return (
    <div className="energy-dashboard p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚡ Real-Time Energy Control Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and control your smart devices' energy consumption in real-time
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Devices</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {devices.filter(d => d.isOnline).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Power</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalPower.toFixed(1)}W
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hourly Cost</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${totalCost.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Daily Cost</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(totalCost * 24).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-64">
              <Line {...powerHistoryChart} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-64">
              <Bar {...deviceUsageChart} />
            </div>
          </div>
        </div>

        {/* Cost Breakdown and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-64">
              <Doughnut {...costBreakdownChart} />
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Energy Controls</h3>
              <button
                onClick={optimizeEnergy}
                disabled={isOptimizing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isOptimizing ? '⚡ Optimizing...' : '🔋 Optimize Energy'}
              </button>
            </div>

            <div className="space-y-4 max-h-48 overflow-y-auto">
              {devices.map(device => (
                <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{device.name}</p>
                      <p className="text-sm text-gray-500">
                        {device.powerWatts.toFixed(1)}W • ${device.cost.toFixed(4)}/hr
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => controlDevice(device.id, 'toggle')}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Toggle
                    </button>
                    <button
                      onClick={() => setSelectedDevice(device.id)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Device Details Modal */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              {(() => {
                const device = devices.find(d => d.id === selectedDevice);
                if (!device) return null;
                
                return (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">{device.name}</h3>
                      <button
                        onClick={() => setSelectedDevice(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={device.isOnline ? 'text-green-600' : 'text-red-600'}>
                          {device.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Power:</span>
                        <span>{device.powerWatts.toFixed(1)}W</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Energy:</span>
                        <span>{device.energyKwh.toFixed(3)} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Voltage:</span>
                        <span>{device.voltage.toFixed(1)}V</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current:</span>
                        <span>{device.current.toFixed(2)}A</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hourly Cost:</span>
                        <span>${device.cost.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Seen:</span>
                        <span>{new Date(device.lastSeen).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => controlDevice(device.id, 'power', { power: true })}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Turn On
                      </button>
                      <button
                        onClick={() => controlDevice(device.id, 'power', { power: false })}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Turn Off
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
