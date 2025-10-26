import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Device, DeviceType, SmartHomeEvent } from '../lib/types';
import { apiService } from '../services/apiService'; // Import the real API service

interface SmartHomeState {
  devices: Device[];
  events: SmartHomeEvent[];
}

type SmartHomeAction =
  | { type: 'SET_DEVICES'; payload: Device[] }
  | { type: 'ADD_DEVICE'; payload: Device }
  | { type: 'UPDATE_DEVICE'; payload: { deviceId: string; newState: any } }
  | { type: 'REMOVE_DEVICE'; payload: string }
  | { type: 'ADD_EVENT'; payload: SmartHomeEvent };

const initialState: SmartHomeState = {
  devices: [], // Devices will be fetched from a real source
  events: [],
};

const smartHomeReducer = (state: SmartHomeState, action: SmartHomeAction): SmartHomeState => {
  switch (action.type) {
    case 'SET_DEVICES':
      return { ...state, devices: action.payload };
    case 'ADD_DEVICE':
      return { ...state, devices: [...state.devices, action.payload] };
    case 'UPDATE_DEVICE':
      return {
        ...state,
        devices: state.devices.map((device) =>
          device.id === action.payload.deviceId
            ? { ...device, state: { ...device.state, ...action.payload.newState } }
            : device
        ),
      };
    case 'REMOVE_DEVICE':
      return {
        ...state,
        devices: state.devices.filter((device) => device.id !== action.payload),
      };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    default:
      return state;
  }
};

export interface SmartHomeContextType {
  devices: Device[];
  events: SmartHomeEvent[];
  dispatch: React.Dispatch<SmartHomeAction>;
  updateDeviceState: (payload: { deviceId: string; newState: any }) => Promise<void>; // Changed to Promise<void>
  getDeviceType: (deviceId: string) => DeviceType | undefined;
}

const SmartHomeContext = createContext<SmartHomeContextType | undefined>(undefined);

export const SmartHomeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(smartHomeReducer, initialState);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await apiService.fetchDevices();
        dispatch({ type: 'SET_DEVICES', payload: devices });
      } catch (error) {
        console.error('Failed to fetch devices:', error);
      }
    };
    loadDevices();
  }, []);

  const updateDeviceState = async (payload: { deviceId: string; newState: any }) => {
    try {
      await apiService.updateDevice(payload.deviceId, payload.newState);
      dispatch({ type: 'UPDATE_DEVICE', payload });
    } catch (error) {
      console.error(`Failed to update device ${payload.deviceId}:`, error);
      // Optionally, revert state or show error to user
    }
  };

  const getDeviceType = (deviceId: string): DeviceType | undefined => {
    const device = state.devices.find(d => d.id === deviceId);
    return device?.type;
  };

  const contextValue: SmartHomeContextType = {
    devices: state.devices,
    events: state.events,
    dispatch,
    updateDeviceState,
    getDeviceType,
  };

  return (
    <SmartHomeContext.Provider value={contextValue}>
      {children}
    </SmartHomeContext.Provider>
  );
};

export const useSmartHomeContext = () => {
  const context = useContext(SmartHomeContext);
  if (context === undefined) {
    throw new Error('useSmartHomeContext must be used within a SmartHomeProvider');
  }
  return context;
};