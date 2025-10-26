import { Device } from '../types/Device';

class DeviceIntegrationService {
  private devices: Device[] = [
    {
      id: 'light-1',
      name: 'Living Room Light',
      type: 'light',
      status: 'on',
      protocol: 'Zigbee'
    },
    {
      id: 'thermostat-1',
      name: 'Home Thermostat',
      type: 'thermostat',
      status: 'standby',
      protocol: 'Z-Wave'
    },
    {
      id: 'security-1',
      name: 'Front Door Lock',
      type: 'security',
      status: 'off',
      protocol: 'Matter'
    }
  ];

  private listeners: ((devices: Device[]) => void)[] = [];

  async discoverDevices(): Promise<Device[]> {
    return [...this.devices];
  }

  async controlDevice(deviceId: string, action: string): Promise<boolean> {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      device.status = action === 'toggle' 
        ? (device.status === 'on' ? 'off' : 'on') 
        : action;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  onDeviceUpdate(listener: (devices: Device[]) => void) {
    this.listeners.push(listener);
    return {
      unsubscribe: () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.devices]));
  }
}

export default new DeviceIntegrationService();
