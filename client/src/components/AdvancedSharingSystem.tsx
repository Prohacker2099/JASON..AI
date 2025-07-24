import React, { useState, useEffect, useContext, createContext } from 'react';
import {
  Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Snackbar, Alert, Paper, FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

// Mock API service for Advanced Sharing System
const sharingApiService = {
  fetchSharingSettings: async () => {
    return new Promise(resolve => setTimeout(() => resolve({
      sharedUsers: [
        { id: 'user1', name: 'Alice', email: 'alice@example.com', accessLevel: 'full', devices: ['1', '2'] },
        { id: 'user2', name: 'Bob', email: 'bob@example.com', accessLevel: 'limited', devices: ['1'] },
        { id: 'user3', name: 'Charlie', email: 'charlie@example.com', accessLevel: 'readOnly', devices: ['2', '3'] },
      ],
      defaultSettings: {
        enableDeviceSharing: true,
        allowRemoteAccess: false,
      },
    }), 50));
  },
  updateSharingSettings: async (settings: any) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 50));
  },
  deleteSharingSetting: async (userId: string) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 50));
  },
};

// Mock user data service
const userDataService = {
  getUserById: (id: string) => {
    return new Promise(resolve => setTimeout(() => resolve({ id: id, name: id, email: id + '@example.com' }), 50));
  },
};

// Mock device data service
const deviceDataService = {
  getDeviceById: (deviceId: string) => {
    return new Promise(resolve => setTimeout(() => resolve({ id: deviceId, name: deviceId, type: 'smartLight', roomId: '1' }), 50));
  },
};

// Component for Sharing Settings
const SharingSettings = ({}) => {
  const [sharedUsers, setSharedUsers] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);

  const loadSharingSettings = async () => {
    const settings = await sharingApiService.fetchSharingSettings();
    setSharedUsers(settings.sharedUsers);
  };

  React.useEffect(() => {
    loadSharingSettings();
  }, []);

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleRemoveUser = (userId: string) => {
    sharingApiService.deleteSharingSetting(userId);
  };

  const handleUpdateSettings = async (updatedSettings: any) => {
    await sharingApiService.updateSharingSettings(updatedSettings);
  };

  return (
    <div>
      <h2>Sharing Settings</h2>
      <button onClick={() => {
          handleUpdateSettings({
              sharedUsers: sharedUsers,
              selectedUser: selectedUser,
          });
      }}>Save Settings</button>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Access Level</th>
            <th>Devices</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sharedUsers.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.accessLevel}</td>
              <td>{user.devices.join(', ')}</td>
              <td>
                <button onClick={() => handleUserSelect(user.id)}>Edit</button>
                <button onClick={() => handleRemoveUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SharingSettings;
import { User, Invitation } from './types';
import { v4 as uuidv4 } from 'uuid';

export class UserManagementService {
  private users: User[] = [];
  private invitations: Invitation[] = [];

  constructor() {
    // Initialize with some default users
    this.users = [
      { id: 'user1', name: 'Alex Johnson', email: 'alex.johnson@example.com', passwordHash: 'hashed_password_1', createdAt: new Date() },
      { id: 'user2', name: 'Charlie Brown', email: 'charlie.brown@example.com', passwordHash: 'hashed_password_2', createdAt: new Date() },
    ];
  }

  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<User> = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      createdAt: new Date(),
      // Add any other required fields here
    };

    this.users.push(newUser);
    return newUser;
  };

  login: (email: string, passwordHash: string) => Promise<User | null> = async (email: string, passwordHash: string) => {
    const user = this.users.find(u => u.email === email && u.passwordHash === passwordHash);
    return user || null;
  };

  sendInvitation: (email: string) => Promise<Invitation> = async (email: string) => {
    console.log(`API: Sending invitation to ${email}`);
    return new Promise(resolve => setTimeout(() => resolve({ id: `inv_${Date.now()}`, email: email, status: 'pending', invitedBy: 'Admin' }), 500));
  };

  getUsers: () => User[] = () => {
    return [...this.users];
  };

  getInvitation: (id: string) => Promise<Invitation | null> = async (id: string) => {
    const invitation = this.invitations.find(inv => inv.id === id);
    return invitation || null;
  };

  inviteUser: (email: string) => Promise<Invitation> = async (email: string) => {
    const newInvitation = {
      id: uuidv4(),
      email: email,
      status: 'pending',
      invitedBy: 'Admin'
    };
    this.invitations.push(newInvitation);
    return newInvitation;
  };

  updateUser: (userId: string, updates: Partial<User>) => Promise<User | null> = async (userId: string, updates: Partial<User>) => {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  };

  deleteUser: (userId: string) => Promise<boolean> = async (userId: string) => {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    return true;
  };
}
import { Device, User, Invitation, SmartHomeContext } from './types';
import { ApiClient } from './apiClient';
import { v4 as uuidv4 } from 'uuid';

interface AdvancedSharingSystem {
  apiClient: ApiClient;
  sharedUsers: User[];
  invitations: Invitation[];
  smartHomeContext: SmartHomeContext;
}

const SHARED_USER_TTL = 60 * 60 * 1000; // 1 hour
const invitationTTL = 60 * 60 * 1000; // 1 hour

const createSharedUser = async (userId: string, deviceId: string, email: string) => {
  const invitationId = uuidv4();
  const invitation: Invitation = {
    id: invitationId,
    userId: userId,
    deviceId: deviceId,
    status: 'pending',
    expiresAt: new Date(Date.now() + invitationTTL),
    createdAt: new Date(),
  };
  const sharedUser: User = {
    id: userId,
    email: email,
    deviceId: deviceId,
    status: 'shared',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SHARED_USER_TTL),
  };
  await this.apiClient.post(`/users/${userId}`, sharedUser);
  await this.apiClient.post(`/invitations/${uuidv4()}`, invitation);
  return invitation;
};

const acceptInvitation = async (inviteId: string) => {
  const invitation = await this.apiClient.get(`/invitations/${inviteId}`);
  const sharedUser = await this.apiClient.get(`/users/${invitation.userId}`);
  const device = await this.apiClient.get(`/devices/${invitation.deviceId}`);

  await this.apiClient.put(`/invitations/${inviteId}`, {
    userId: sharedUser.id,
    status: 'accepted',
  });

  const updatedUser = {
    ...sharedUser,
    device: device.id,
    status: 'active',
  };

  await this.apiClient.put(`/users/${sharedUser.id}`, updatedUser);

  return updatedUser;
};

const declineInvitation = async (inviteId: string) => {
  const invitation = await this.apiClient.get(`/invitations/${inviteId}`);
  await this.apiClient.delete(`/invitations/${inviteId}`);
};

const revokeSharedAccess = async (userId: string) => {
  await this.apiClient.delete(`/users/${userId}`);
};

const cancelInvitation = async (inviteId: string) => {
    await this.apiClient.delete(`/invitations/${inviteId}`);
};

const updateSharedUser = async (userId: string, updates: any) => {
    await this.apiClient.put(`/users/${userId}`, updates);
};

const getSharedUsers = async (): Promise<User[]> {
    const users = await this.apiClient.get(`/users?status=shared`);
    return users;
};

const getInvitations = async (): Promise<Invitation[]> {
    const invitations = await this.apiClient.get(`/invitations`);
    return invitations;
};

const sendInvitation = async (userId: string, deviceId: string, email: string) => {
  const invitationId = uuidv4();
  const invitation: Invitation = {
    id: invitationId,
    userId: userId,
    deviceId: deviceId,
    status: 'pending',
    expiresAt: new Date(Date.now() + invitationTTL),
    createdAt: new Date(),
  };
  await this.apiClient.post(`/invitations/${uuidv4()}`, invitation);
};

const addDeviceToSharedUser = async (userId: string, deviceId: string) => {
    await this.apiClient.put(`/users/${userId}/devices/${deviceId}`, { deviceId: deviceId });
};

const removeDeviceFromSharedUser = async (userId: string, deviceId: string) => {
  await this.apiClient.delete(`/users/${userId}/devices/${deviceId}`);
};

export class AdvancedSharingSystemImpl implements AdvancedSharingSystem {
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async createSharedUser(userId: string, deviceId: string, email: string): Promise<Invitation> {
    await this.sendInvitation(userId, deviceId, email);
    return await this.apiClient.get(`/invitations/${uuidv4()}`);
  }

  async acceptInvitation(inviteId: string): Promise<User> {
    return await this.apiClient.get(`/users/${inviteId}`);
  }

  async declineInvitation(inviteId: string): Promise<void> {
    await this.apiClient.delete(`/invitations/${inviteId}`);
  }

  async revokeSharedAccess(userId: string): Promise<void> {
    await this.apiClient.delete(`/users/${userId}`);
  }

  async getSharedUsers(): Promise<User[]> {
    const users = await this.apiClient.get(`/users?status=shared`);
    return users;
  }

  async getInvitations(): Promise<Invitation[]> {
    const invitations = await this.apiClient.get(`/invitations`);
    return invitations;
  }

  async sendInvitation(userId: string, deviceId: string, email: string): Promise<Invitation> {
    return await this.apiClient.post(`/invitations/${uuidv4()}`, {userId: userId, deviceId: deviceId, email: email});
  }

  async addDeviceToSharedUser(userId: string, deviceId: string): Promise<void> {
    await this.apiClient.put(`/users/${userId}/devices/${deviceId}`, { deviceId: deviceId });
  }

  async removeDeviceFromSharedUser(userId: string, deviceId: string): Promise<void> {
    await this.apiClient.delete(`/users/${userId}/devices/${deviceId}`);
  }
}
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 400));
  }
};

// Define Device interface (assuming it's available from a global context or passed down)
interface Device {
  id: string;
  name: string;
  type: string;
  status: 'on' | 'off' | 'locked' | 'unlocked' | 'unknown';
  value: number | string;
  metadata?: any;
}

// Define SharedUser interface
interface SharedUser {
  id: string;
  name: string;
  email: string;
  accessLevel: 'full' | 'limited' | 'view-only';
import {
  Device,
  Invitation,
  User,
} from './types';

interface AdvancedSharingSystem {
  user: User;
  devices: Device[];
  invitations: Invitation[];
  // Add other relevant state/data here
}

// Mock implementations - replace with actual services in a real application
class DeviceService {
  async discoverDevices() {
    // Simulate device discovery
    return [
      { id: 'light1', name: 'Living Room Light' },
      { id: 'thermo1', name: 'Living Room Thermostat' },
      { id: 'lock1', name: 'Front Door Lock' },
    ];
  }
}

class InvitationService {
  async sendInvitation(userEmail: string, invitedBy: string) {
    // Simulate sending an invitation
    return { id: 'invitation1', email: userEmail, status: 'pending', invitedBy };
  }

  async acceptInvitation(invitationId: string) {
    // Simulate accepting an invitation
    return { id: 'invitation1', email: 'test@example.com', status: 'accepted', invitedBy: 'user1' };
  }
}

class UserService {
  async registerUser(name: string, email: string) {
    // Simulate user registration
    return { id: 'user1', name, email };
  }
}

class AdvancedSharingSystem implements AdvancedSharingSystem {
  user: User;
  devices: Device[];
  invitations: Invitation[];

  constructor(
    user: User,
    devices: Device[],
    invitations: Invitation[]
  ) {
    this.user = user;
    this.devices = devices;
    this.invitations = invitations;
  }

  async discoverAvailableDevices() {
    const deviceService = new DeviceService();
    return deviceService.discoverDevices();
  }

  async sendInvitation(invitedEmail: string) {
    const invitationService = new InvitationService();
    const invitation = await invitationService.sendInvitation(invitedEmail, this.user.id);
    this.invitations.push(invitation);
    return invitation;
  }

  async acceptInvitation(invitationId: string) {
    const invitation = this.invitations.find((i) => i.id === invitationId);
    if (invitation) {
      invitation.status = 'accepted';
    }
  }

  async sendMessage(message: string) {
    console.log(`Sending message to ${this.user.name}: ${message}`);
  }
}

// Mock User Type
interface User {
  id: string;
  name: string;
  email: string;
}

// Mock Device Type
interface Device {
  id: string;
  name: string;
}

// Context for sharing settings (can be integrated with a broader AppContext if available)
interface SharingContextType {
  sharedUsers: SharedUser[];
  invitations: Invitation[];
  loading: boolean;
  error: string | null;
  refreshSharingSettings: () => void;
  sendNewInvitation: (email: string) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
  cancelPendingInvitation: (inviteId: string) => Promise<boolean>;
  updateUserAccess: (userId: string, accessLevel: 'full' | 'limited' | 'view-only', devices?: string[]) => Promise<boolean>;
}

const SharingContext = createContext<SharingContextType | undefined>(undefined);

const SharingProvider: React.FC<{ children: React.ReactNode; allDevices: Device[] }> = ({ children, allDevices }) => {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSharingSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sharingApiService.fetchSharingSettings() as { sharedUsers: SharedUser[], invitations: Invitation[] };
      setSharedUsers(data.sharedUsers);
      setInvitations(data.invitations);
    } catch (err) {
      setError('Failed to fetch sharing settings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSharingSettings();
  }, []);

  const sendNewInvitation = async (email: string) => {
    try {
      await sharingApiService.sendInvitation(email);
      refreshSharingSettings();
      return true;
    } catch (err) {
      setError('Failed to send invitation.');
      console.error(err);
      return false;
import { SharingApiService } from './sharingApiService';
import { User } from './types';
import { useState, useEffect } from 'react';

interface AdvancedSharingSystemProps {
  initialUsers: User[];
}

const AdvancedSharingSystem: React.FC<AdvancedSharingSystemProps> = ({ initialUsers }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (loading) return;

    setLoading(true);

    // Simulate fetching users from an API
    setTimeout(() => {
      const fetchedUsers = [
        { id: 'user1', name: 'Alex', email: 'alex@example.com' },
        { id: 'user2', name: 'Beth', email: 'beth@example.com' },
        { id: 'user3', name: 'Charlie', email: 'charlie@example.com' },
      ];
      setUsers(fetchedUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const addSharedUser = async (newUser: User) => {
    try {
      await sharingApiService.addSharedUser(newUser);
      setUsers([...users, newUser]);
    } catch (err) {
      setError('Failed to add user.');
    }
  };

  const removeUser = async (userId: string) => {
    try {
      await sharingApiService.removeSharedUser(userId);
      setUsers(users.filter((user) => user.id !== userId));
    } catch (err) {
      setError('Failed to remove user.');
    }
  };

  const shareAccess = async (userId: string, accessLevel: 'read' | 'write') => {
    try {
      await sharingApiService.shareUser(userId, accessLevel);
      refreshSharingSettings();
    } catch (err) {
      setError('Failed to share access.');
    }
  };

  const refreshSharingSettings = async () => {
    try {
      const settings = await sharingApiService.getSharingSettings();
      // Update state based on retrieved settings
      // Example: Update access levels for each user
    } catch (err) {
      console.error('Error refreshing sharing settings:', err);
    }
  };

  return (
    <div>
      <h1>Advanced Sharing Settings</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => addSharedUser({ id: 'user4', name: 'David', email: 'david@example.com' })}>Add User</button>
      {users.map((user) => (
        <div key={user.id}>
          <h2>{user.name} ({user.email})</h2>
          <button onClick={() => shareAccess(user.id, 'read')}>Grant Read Access</button>
          <button onClick={() => shareAccess(user.id, 'write')}>Grant Write Access</button>
          <button onClick={() => removeUser(user.id)}>Remove Access</button>
        </div>
      ))}
    </div>
  );
};

export default AdvancedSharingSystem;
      console.error(err);
      return false;
    }
  };

  const cancelPendingInvitation = async (inviteId: string) => {
    try {
      await sharingApiService.cancelInvitation(inviteId);
      refreshSharingSettings();
      return true;
    } catch (err) {
      setError('Failed to cancel invitation.');
      console.error(err);
      return false;
    }
  };

  const updateUserAccess = async (userId: string, accessLevel: 'full' | 'limited' | 'view-only', devices?: string[]) => {
    try {
      await sharingApiService.updateSharedUser(userId, { accessLevel, devices });
      refreshSharingSettings();
      return true;
    } catch (err) {
      setError('Failed to update user access.');
      console.error(err);
      return false;
    }
  };

  return (
    <SharingContext.Provider value={{
      sharedUsers, invitations, loading, error, refreshSharingSettings,
      sendNewInvitation, removeUser, cancelPendingInvitation, updateUserAccess
    }}>
      {children}
    </SharingContext.Provider>
  );
};

export const useSharingContext = () => {
import React, { useContext, useState, useEffect } from 'react';
import { SharingContext } from './SharingContext';
import { Device, ShareOptions } from './types';

interface AdvancedSharingSystemProps {
  devices: Device[]; // All available devices in the system
}

const AdvancedSharingSystem: React.FC<AdvancedSharingSystemProps> = ({ devices }) => {
  const [sharingSystemState, setSharingSystemState] = useState<any>({}); // State management for the system
  const context = useContext(SharingContext);
  if (context === undefined) {
    throw new Error('useSharingContext must be used within a SharingProvider');
  }

  useEffect(() => {
    // Simulate intelligent device discovery and profiling
    const discoverDevices = async () => {
      const discoveredDevices = devices.map(device => {
        return {
          ...device,
          healthStatus: Math.random() > 0.9 ? 'Healthy' : 'Warning',
          lastActive: new Date().toLocaleTimeString(),
          usagePattern: Math.random() > 0.8 ? 'High' : 'Normal',
          // Simulate predictive AI - Learning device usage patterns
          learnedPreferences: {
            temperature: Math.random() * 20 + 15,
            brightness: Math.random() * 100,
            mode: Math.random() > 0.5 ? 'Comfort' : 'EnergySaving',
          },
        };
      });
      setSharingSystemState(prevState => ({ ...prevState, devices: discoveredDevices }));
    };

    discoverDevices();
  }, [devices]);

  const shareDevice = (device: Device, options: ShareOptions) => {
    // Simulate sharing logic - advanced options can be included.
    console.log(`Sharing device: ${device.name} with options:`, options);

    // Add more complex logic here - integrating with communication APIs,
    // secure data sharing mechanisms, and user authorization.
    // This is where you'd implement the core sharing functionality.
    // This example just logs the device and options.

    // Example: Triggering notifications based on sharing activity
    context.triggerNotification(`Shared ${device.name} with ${options.recipient}`);
  };

  const updateDeviceSettings = (deviceId: string, settings: any) => {
    // Simulate updating device settings - advanced logic needed here.
    console.log(`Updating settings for device ${deviceId}:`, settings);
    setSharingSystemState(prevState => {
      const updatedDevices = prevState.devices.map(d =>
        d.id === deviceId ? { ...d, ...settings } : d
      );
      return { ...prevState, devices: updatedDevices };
    });
  };

  const manageDevicePermissions = (deviceId: string, permissions: { [key: string]: boolean }) => {
    console.log(`Managing permissions for device ${deviceId}:`, permissions);
    // Implement logic to update device permissions in the state and backend
    setSharingSystemState(prevState => {
      const updatedDevices = prevState.devices.map(d =>
        d.id === deviceId ? { ...d, permissions } : d
      );
      return { ...prevState, devices: updatedDevices };
    });
  };

  return (
    <div>
      <h2>Advanced Sharing System</h2>
      {devices.map(device => (
        <div key={device.id} className="device-card">
          <h3>{device.name}</h3>
          <p>Type: {device.type}</p>
          <p>Status: {device.healthStatus}</p>
          <p>Last Active: {device.lastActive}</p>
          <p>Usage Pattern: {device.usagePattern}</p>
          {/* Example Button - Share Device */}
          <button onClick={() => shareDevice(device, { recipient: 'John Doe' })}>Share Device</button>
          {/* Example Button - Update Device Settings */}
          <button onClick={() => updateDeviceSettings(device.id, { temperature: Math.random() * 20 + 15 })}>Update Settings</button>
        </div>
      ))}
    </div>
  );
};

export default AdvancedSharingSystem;

const AdvancedSharingSystem: React.FC<AdvancedSharingSystemProps> = ({ devices: allDevices }) => {
  const { sharedUsers, invitations, loading, error, sendNewInvitation, removeUser, cancelPendingInvitation, updateUserAccess } = useSharingContext();
  const [inviteEmail, setInviteEmail] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<SharedUser | null>(null);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<'full' | 'limited' | 'view-only'>('view-only');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  useEffect(() => {
    if (editingUser) {
      setSelectedAccessLevel(editingUser.accessLevel);
      setSelectedDevices(editingUser.devices || []);
    }
  }, [editingUser]);

  const handleInviteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
import { useState, useEffect } from 'react';
import { useAppDispatch } from '../store';
import {
  sendNewInvitation,
  updateInvitationStatus,
  inviteUser,
  getInvitations,
} from '../api/user';
import { setSnackbar } from '../store/uiSlice';
import { InvitationStatus } from '../types/user';

interface AdvancedSharingSystemProps {}

const AdvancedSharingSystem: React.FC<AdvancedSharingSystemProps> = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const dispatch = useAppDispatch();

  const handleInviteEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInviteEmail(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail || !/\S+@\S+\.\S+/.test(inviteEmail)) {
      dispatch(
        setSnackbar('Please enter a valid email address.', 'error')
      );
      return;
    }

    try {
      const response = await sendNewInvitation(inviteEmail);
      if (response.success) {
        dispatch(
          setSnackbar('Invitation sent successfully!', 'success')
        );
        // Optionally, clear the input field
        setInviteEmail('');
      } else {
        dispatch(
          setSnackbar(response.message, 'error')
        );
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      dispatch(
        setSnackbar('Failed to send invitation.', 'error')
      );
    }
  };

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const invitations = await getInvitations();
        // Optionally, store invitations in the store if needed
        // dispatch(setInvitations(invitations));
      } catch (error) {
        console.error('Error fetching invitations:', error);
      }
    };

    fetchInvitations();
  }, []);

  const handleSendInvitation = async () => {
    if (!inviteEmail || !/\S+@\S+\.\S+/.test(inviteEmail)) {
      dispatch(
        setSnackbar('Please enter a valid email address.', 'error')
      );
      return;
    }

    try {
      const response = await sendNewInvitation(inviteEmail);
      if (response.success) {
        dispatch(
          setSnackbar('Invitation sent successfully!', 'success')
        );
        // Optionally, clear the input field
        setInviteEmail('');
      } else {
        dispatch(
          setSnackbar(response.message, 'error')
        );
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      dispatch(
        setSnackbar('Failed to send invitation.', 'error')
      );
    }
  };

  return (
    <div>
      <h2>Invite a Friend</h2>
      <form onSubmit={handleSendInvitation}>
        <input
          type="email"
          placeholder="Enter friend's email"
          value={inviteEmail}
          onChange={handleInviteEmailChange}
          required
        />
        <button type="submit" disabled={!inviteEmail}>Send Invitation</button>
      </form>
    </div>
  );
};

export default AdvancedSharingSystem;
import { useState, useEffect, useCallback } from 'react';
import { apiService } from './api';
import { UserInviteResponse, UserDeleteResponse, User } from './types';

interface AdvancedSharingSystemProps {
  inviteEmail: string;
  onInviteUser: (email: string) => void;
  onRemoveUser: (userId: string) => void;
}

const AdvancedSharingSystem: React.FC<AdvancedSharingSystemProps> = ({ inviteEmail, onInviteUser, onRemoveUser }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]> ([]);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getUsers();
        setUsers(response.users);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleInviteUser = useCallback(async (email: string) => {
    if (!email) {
      showSnackbar('Please enter a valid email address.', 'error');
      return;
    }

    try {
      const response: UserInviteResponse = await apiService.inviteUser(email);
      showSnackbar(`Invitation sent to ${email}!`, 'success');
      setInviteEmail('');
    } catch (err: any) {
      showSnackbar('Failed to send invitation.', 'error');
      console.error('Error inviting user:', err); // Log for debugging
    }
  }, [inviteEmail, showSnackbar]);

  const handleRemoveUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      try {
        const response: UserDeleteResponse = await apiService.deleteUser(userId);
        showSnackbar(`User ${userId} deleted successfully!`, 'success');
        // Refresh user list after successful deletion
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      } catch (err: any) {
        showSnackbar(`Failed to delete user ${userId}.`, 'error');
        console.error('Error deleting user:', err);
      }
    }
  };

  return (
    <div>
      <h2>Advanced Sharing System</h2>
      <input
        type="email"
        placeholder="Enter email to invite"
        value={inviteEmail}
        onChange={(e) => setInviteEmail(e.target.value)}
      />
      <button onClick={() => handleInviteUser(inviteEmail)} disabled={!inviteEmail || isLoading}>
        {isLoading ? 'Inviting...' : 'Invite User'}
      </button>
      {users.length > 0 && (
        <ul>
          {users.map((user) => (
            <li key={user._id}>
              {user.name} - {user.email} - <button onClick={() => handleRemoveUser(user._id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdvancedSharingSystem;
import { useState, useEffect } from 'react';
import { User, Invitation } from '../interfaces/interfaces';
import { apiService } from '../services/apiService';

interface AdvancedSharingSystemProps {
  // Add props as needed
}

const AdvancedSharingSystem = ({ }: AdvancedSharingSystemProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiService.getAllUsers();
        setUsers(response.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        // Handle error appropriately, e.g., show an error message
      }
    };

    const fetchInvitations = async () => {
      try {
        const response = await apiService.getAllInvitations();
        setInvitations(response.invitations);
      } catch (error) {
        console.error('Error fetching invitations:', error);
      }
    };

    fetchUsers();
    fetchInvitations();
  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleRemoveUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      try {
        const response = await apiService.removeUser(userId);
        if (response.success) {
          showSnackbar('User removed successfully.', 'success');
          // Refetch users to ensure the UI updates
          fetchUsers();
        } else {
          showSnackbar('Failed to remove user.', 'error');
        }
      } catch (error) {
        console.error('Error removing user:', error);
        showSnackbar('Failed to remove user.', 'error');
      }
    }
  };

  const handleCancelInvitation = async (inviteId: string) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        const response = await apiService.cancelInvitation(inviteId);
        if (response.success) {
          showSnackbar('Invitation cancelled successfully.', 'success');
          // Refetch invitations to ensure the UI updates
          fetchInvitations();
        } else {
          showSnackbar('Failed to cancel invitation.', 'error');
        }
      } catch (error) {
        console.error('Error cancelling invitation:', error);
        showSnackbar('Failed to cancel invitation.', 'error');
      }
    }
  };

  return (
    <div>
      <h2>User Management</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email} - <button onClick={() => handleSelectUser(user)} >Select</button>
            <button onClick={() => handleRemoveUser(user.id)} >Remove</button>
          </li>
        ))}
      </ul>

      <h2>Invitation Management</h2>
      <ul>
        {invitations.map((invitation) => (
          <li key={invitation.id}>
            {invitation.email} - <button onClick={() => handleCancelInvitation(invitation.id)}>Cancel</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdvancedSharingSystem;
import {
  CancelInvitationResponse,
  SharedUser,
  InviteType,
  InviteStatus,
  InviteData,
  InvitationPayload,
  InviteEvent,
  InviteChannel,
} from '../../interfaces/invite';
import { apiService } from '../../services/api';
import { showSnackbar } from '../../components/ui/Snackbar';
import { navigate } from '../../hooks/useNavigate';
import { useCallback } from 'react';
import { useAppDispatch } from '../../store';
import { setInviteStatus } from '../../store/inviteSlice';

interface InviteComponentProps {
  invite: InviteData;
}

const InviteComponent: React.FC<InviteComponentProps> = ({ invite }) => {
  const dispatch = useAppDispatch();

  const handleAcceptInvite = useCallback(
    async (payload: InvitationPayload) => {
      try {
        const response = await apiService.post(`/invites/${invite.id}/accept`, payload);
        if (response.success) {
          dispatch(
            setInviteStatus({
              inviteId: invite.id,
              status: InviteStatus.Accepted,
            })
          );
          navigate('/dashboard/my-invitations'); // Redirect to the dashboard
          showSnackbar('Invitation accepted.', 'success');
        } else {
          showSnackbar(response.message, 'error');
        }
      } catch (error) {
        console.error('Error accepting invitation:', error);
        showSnackbar('Failed to accept invitation.', 'error');
      }
    },
    [invite.id]
  );

  const handleRejectInvite = useCallback(
    async (payload: InvitationPayload) => {
      try {
        const response = await apiService.post(`/invites/${invite.id}/reject`, payload);
        if (response.success) {
          dispatch(
            setInviteStatus({
              inviteId: invite.id,
              status: InviteStatus.Rejected,
            })
          );
          showSnackbar('Invitation rejected.', 'success');
        } else {
          showSnackbar(response.message, 'error');
        }
      } catch (error) {
        console.error('Error rejecting invitation:', error);
        showSnackbar('Failed to reject invitation.', 'error');
      }
    },
    [invite.id]
  );

  const handleCancelInvite = useCallback(
    async (payload: InvitationPayload) => {
      const success = await apiService.post(`/invites/${invite.id}/cancel`, payload);
      if (success) {
        showSnackbar('Invitation cancelled.', 'success');
      } else {
        showSnackbar('Failed to cancel invitation.', 'error');
      }
    },
    [invite.id]
  );

  return (
    <div className={`invite-component ${invite.status}`}>
      <p>
        Invite by: {invite.inviterName} - {invite.inviterEmail}
      </p>
      <p>
        {invite.inviteMessage}
      </p>
      <button onClick={() => handleAcceptInvite({})} className="accept-invite-button">
        Accept
      </button>
      <button onClick={() => handleRejectInvite({})} className="reject-invite-button">
        Reject
      </button>
      <button onClick={() => handleCancelInvite({})} className="cancel-invite-button">
        Cancel
      </button>
    </div>
  );
};

export default InviteComponent;
    setEditingUser(user);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingUser(null);
    setSelectedAccessLevel('view-only');
    setSelectedDevices([]);
  };

  const handleSaveUserAccess = async () => {
    if (!editingUser) return;

    const success = await updateUserAccess(
      editingUser.id,
      selectedAccessLevel,
      selectedAccessLevel === 'limited' ? selectedDevices : undefined
    );

import { useState, useEffect } from 'react';
import axios from 'axios';

interface UserAccessLevel {
  full: 'full';
  limited: 'limited';
  viewOnly: 'view-only';
}

interface UserData {
  id: number;
  name: string;
  email: string;
  accessLevel: UserAccessLevel;
  createdAt: string;
  updatedAt: string;
}

interface UserContext {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  isLoading: boolean;
  error: string | null;
}

export const UserContext: UserContext = ({}: UserContext);

export const useUser = (): UserContext => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get<UserData>('/api/users/current');
        setUser(response);
      } catch (error: any) {
        console.error('Error fetching user:', error);
        setError(error.message || 'Failed to fetch user.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  return {
    user,
    isLoading,
    error,
    setUser,
  };
};

// Example Usage Component
import React from 'react';
import { useUser } from './UserContext';

function UserProfile() {
  const { user, isLoading, error, setUser } = useUser();

  const handleUpdateAccessLevel = async (
    accessLevel: 'full' | 'limited' | 'view-only'
  ) => {
    if (!user) return;

    try {
      const response = await axios.put(`/api/users/${user.id}/access`, {
        accessLevel,
      });
      if (response.status === 200) {
        showSnackbar('User access updated successfully.', 'success');
        handleCloseEditDialog();
      } else {
        showSnackbar('Failed to update user access.', 'error');
      }
    } catch (error: any) {
      console.error('Error updating user access:', error);
      showSnackbar('Failed to update user access.', 'error');
    }
  };

  if (isLoading) {
    return <div>Loading user...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>User Profile</h1>
      {user && (
        <div>
          <h2>{user.name}</h2>
          <p>Email: {user.email}</p>
          <p>Access Level: {user.accessLevel}</p>
          <button onClick={() => handleUpdateAccessLevel('full')}>
            Make Full Access
          </button>
          <button onClick={() => handleUpdateAccessLevel('limited')}>
            Make Limited Access
          </button>
          <button onClick={() => handleUpdateAccessLevel('view-only')}>
            Make View-Only Access
          </button>
        </div>
      )}
    </div>
  );
}
    if (event.target.value !== 'limited') {
      setSelectedDevices([]); // Clear selected devices if not limited access
    }
  };

  const handleDeviceSelectionChange = (event: any) => {
    setSelectedDevices(event.target.value as string[]);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
import React, { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'react-snackbar';

interface Device {
  id: string;
  name: string;
  type: string;
  status: boolean;
  capabilities: string[];
}

interface AdvancedSharingSystemProps {
  devices: Device[];
  user: {
    name: string;
    calendarIds: string[];
  };
}

const AdvancedSharingSystem: React.FC<AdvancedSharingSystemProps> = ({ devices, user }) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const { setSnackbar, setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen } = useSnackbar();

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    setSnackbarMessage(`Device "${device.name}" selected`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleDeviceDeselect = () => {
    setSelectedDevice(null);
    setSnackbarMessage('Device deselected');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };

  const handleShareDevice = useCallback(
    (device: Device) => {
      if (!device) {
        return;
      }

      setSnackbarMessage(`Sharing device: ${device.name}`);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);

      // Simulate sharing process (replace with actual sharing logic)
      setTimeout(() => {
        setSnackbarMessage(`Device "${device.name}" shared successfully!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }, 2000);
    },
    [ setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen ]
  );

  return (
    <div>
      <h2>Advanced Sharing Controls</h2>
      <ul>
        {devices.map((device) => (
          <li key={device.id} onClick={() => handleDeviceSelect(device)}>
            {device.name} - {device.type} - {device.status ? 'Online' : 'Offline'}
          </li>
        ))}
      </ul>
      <button onClick={() => handleShareDevice(selectedDevice)}>Share Selected Device</button>
      <button onClick={handleDeviceDeselect}>Deselect Device</button>
    </div>
  );
};

export default AdvancedSharingSystem;
  };

  if (loading) return <Typography>Loading sharing settings...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <SharingProvider allDevices={allDevices}> {/* Wrap content with SharingProvider */}
      <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
        <Typography variant="h4" gutterBottom component="h1">Advanced Sharing System</Typography>

import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, Avatar, IconButton, Tooltip, Badge, ListItemButton, Menu, MenuItem, MenuAdornment, Typography as StyledTypography, Divider } from '@mui/material';
import { DeleteOutline, AddUser, UserSettings } from '@mui/icons-material';
import { useAuthContext } from '../../context/AuthContext';
import { UserProfile } from '../components/UserProfile';
import { useSnackbar } from 'not-ist';

interface SharedUserItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  permissions: string[];
}

interface SharedUsersProps {
  sharedUsers: SharedUserItem[];
}

const SharedUsers: React.FC<SharedUsersProps> = ({ sharedUsers }) => {
  const { authUser, logout } = useAuthContext();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<SharedUserItem | null>(null);

  const handleDeleteDialogOpen = (user: SharedUserItem) => {
    setSelectedUser(user);
    openMenu(true);
  };

  const handleUserDelete = async (user: SharedUserItem) => {
    try {
      const response = await fetch(`/api/shared-users/${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        enqueueSnackbar('User removed successfully', { variant: 'success' });
        // Refresh shared users list
        fetchSharedUsers();
      } else {
        enqueueSnackbar(`Failed to remove user: ${response.statusText}`, { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      enqueueSnackbar(`Failed to remove user: ${error}`, { variant: 'error' });
    }
  };

  const fetchSharedUsers = async () => {
    try {
      const response = await fetch('/api/shared-users', {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(null); // Clear selected user
        setSharedUsers(data);
      } else {
        console.error('Failed to fetch shared users');
      }
    } catch (error) {
      console.error('Error fetching shared users:', error);
    }
  };

  useEffect(() => {
    fetchSharedUsers();
  }, []);

  const handleClose = () => {
    setOpenMenu(false);
    setSelectedUser(null);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
      <Typography variant="h6">Shared Users</Typography>
      <Tooltip title="Add User">
        <IconButton onClick={() => {
          // Implement logic for adding a user (e.g., modal, form)
          console.log("Add User clicked");
        }}>
          <AddUser />
        </IconButton>
      </Tooltip>
      <List>
        {sharedUsers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No shared users.</Typography>
        ) : (
          sharedUsers.map((user) => (
            <ListItem key={user.id}
              secondaryAction={
                <Tooltip title="Remove User">
                  <IconButton onClick={() => handleDeleteDialogOpen(user)} color="error">
                    <DeleteOutline />
                  </IconButton>
                </Tooltip>
              }
            >
              <Avatar alt={user.name} src={user.avatarUrl || '/default-avatar.png'} />
              <ListItemButton onClick={() => console.log(`User Profile: ${user.name}`)}>
                <Typography variant="subtitle1">{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
};

export default SharedUsers;
import { useState, useEffect, ChangeEvent } from 'react';
import { Box, IconButton, Select, Button, Input, Typography, Skeleton, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { User } from '../interfaces/user.interface';
import { API_BASE_URL } from '../constants/api';
import axios, { AxiosResponse } from 'axios';

interface UserListProps {
  users: User[];
}

const UserList: React.FC<UserListProps> = ({ users }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingUserData, setEditingUserData] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (editingUserData) {
      setOpenEditDialog(true);
    } else {
      setOpenEditDialog(false);
    }
  }, [editingUserData]);

  const handleOpenEditDialog = (user: User) => {
    setEditingUserData(user);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setEditingUserData(null);
    setOpenEditDialog(false);
  };

  const handleSaveUser = async (id: number, userData: User) => {
    try {
      const response: AxiosResponse<User> = await axios.put(`${API_BASE_URL}/users/${id}`, userData);
      console.log('User updated successfully:', response.data);
      handleCloseEditDialog();
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user.');
    }
  };

  const handleRemoveUser = async (userId: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`User ${userId} deleted successfully`);
      // Refresh user list after deletion
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user.');
    }
  };

  const loadUsers = async () => {
    try {
      const response: AxiosResponse<User[]> = await axios.get<User[]>(`${API_BASE_URL}/users`);
      console.log('Users loaded successfully:', response.data);
      setUsers(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError(error.message || 'Failed to load users.');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditingUserData({ ...editingUserData, [name]: value });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        User List
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Skeleton count={5} />
      ) : (
        <List>
          {users.map((user) => (
            <ListItem key={user.id}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1">{user.name}</Typography>
                <Box display="flex" alignItems="center">
                  <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditDialog(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveUser(user.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      )}
      {openEditDialog && (
        <EditUserDialog
          editingUserData={editingUserData}
          onClose={() => handleCloseEditDialog()}
          onSave={(id, data) => handleSaveUser(id, data)}
        />
      )
    </Box>
  );
};

interface EditUserDialogProps {
  editingUserData: User | null;
  onClose: () => void;
  onSave: (id: number, data: User) => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ editingUserData, onClose, onSave }) => {
  const { id, name, email, password } = editingUserData || {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(id, { id, name, email, password });
  };

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        <Form onSubmit={handleSubmit}>
          <Input label="Name" name="name" value={name || ""} placeholder="Enter name" fullWidth required />
          <Input label="Email" name="email" value={email || ""} placeholder="Enter email" fullWidth required />
          <Input label="Password" name="password" type="password" value={password || ""} placeholder="Enter password" fullWidth required />
          <Button variant="contained" type="submit" color="primary">Save</Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserList;
                  <ListItemText
                    primary={`${user.name} (${user.email})`}
                    secondary={
                      <Box>
                        <Typography component="span" variant="body2" color="text.secondary">
                          Access Level: {user.accessLevel}
                        </Typography>
                        {user.accessLevel === 'limited' && user.devices && user.devices.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 0.5 }}>
                            {user.devices.map(deviceId => {
                              const device = allDevices.find(d => d.id === deviceId);
                              return device ? (
                                <Chip key={deviceId} label={device.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                              ) : null;
                            })}
                          </Box>
                        )}
                      </Box>
                    }
                  />
import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, Skeleton, Pagination, SkeletonLoader } from '@mui/material';

interface Invitation {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
}

// Mock Data - Replace with your actual data fetching logic
const initialInvitations: Invitation[] = [
  { id: 'inv1', senderId: 'user1', receiverId: 'user2', status: 'pending', message: 'Join our new project!' },
  { id: 'inv2', senderId: 'user1', receiverId: 'user3', status: 'accepted', message: 'Welcome to the team!' },
  { id: 'inv3', senderId: 'user2', receiverId: 'user4', status: 'pending', message: 'Collaboration opportunity.' },
];

// Sample API endpoint (replace with your actual API calls)
async function fetchInvitations(): Promise<Invitation[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return initialInvitations; // Replace with your data fetching logic
}

function PendingInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadInvitations = async () => {
      setIsLoading(true);
      const data = await fetchInvitations();
      setInvitations(data);
      setIsLoading(false);
    };

    loadInvitations();
  }, []);

  if (isLoading) {
    return (
      <Box>
        <SkeletonLoader />
        <Typography variant="h6">Loading invitations...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5">Pending Invitations</Typography>
      <List>
        {invitations.length === 0 ? (
          <ListItem>
            <Typography variant="body2">No pending invitations.</Typography>
          </ListItem>
        ) : (
          invitations.map((invitation) => (
            <ListItem key={invitation.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 40, height: 40, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  {/* Replace with user avatar or initials */}
                  {/* {invitation.senderId.charAt(0)} */}
                </Box>
                <Box>
                  <Typography variant="body2">{invitation.senderId}</Typography>
                  <Typography variant="caption">{invitation.message}</Typography>
                </Box>
                <Box sx={{ width: 80, height: 30, bgcolor: 'secondary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  {invitation.status === 'pending' ? 'Pending' : invitation.status}
                </Box>
              </Box>
            </ListItem>
          ))
        }
      </List>
    </Box>
  );
}

export default PendingInvitations;
              <Typography variant="body2" color="text.secondary">No pending invitations.</Typography>
            ) : (
              invitations.map((invite) => (
                <ListItem
                  key={invite.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="cancel" onClick={() => handleCancelInvitation(invite.id)}>
                      <CloseIcon />
                    </IconButton>
                  }
import React from 'react';
import { Box, List, ListItem, ListItemText } from '@mui/material';

interface InviteItemProps {
  invite: {
    email: string;
    status: 'pending' | 'accepted' | 'declined';
    invitedBy: string;
  };
}

const InviteItem: React.FC<InviteItemProps> = ({ invite }) => {
  const statusColor = invite.status === 'pending' ? 'orange' : invite.status === 'accepted' ? 'success' : 'error';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, padding: 1 }}>
      <ListItem alignItems="center" disableRipple>
        <ListItemText primary={invite.email} secondary={`Status: ${invite.status} (Invited by: ${invite.invitedBy})`} />
      </ListItem>
    </Box>
  );
};

export default InviteItem;
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useAuthContext } from '../../auth/AuthContext';
import { sendInviteEmail } from '../../api/authApi';
import { useToast } from '../../components/Toastify';

interface InviteUserProps {
  userId: number;
}

const InviteUser: React.FC<InviteUserProps> = ({ userId }) => {
  const { auth } = useAuthContext();
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const { showToast, addToast } = useToast();

  useEffect(() => {
    // Clean up any existing toasts when the component unmounts
    return () => {
      addToast(null, { toastId: '' });
    };
  }, [addToast]);

  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInviteEmail(e.target.value);
  };

  const handleInviteClick = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      addToast('Please enter a valid email address.', { type: 'error' });
      return;
    }

    try {
      const response = await sendInviteEmail(inviteEmail, userId);

      if (response.success) {
        addToast('Invitation email sent successfully!', { type: 'success' });
        setInviteEmail('');
      } else {
        addToast(response.message || 'Failed to send invitation email.', { type: 'error' });
      }
    } catch (error) {
      console.error('Error sending invitation email:', error);
      addToast('Failed to send invitation email. Please try again later.', { type: 'error' });
    }
  };

  return (
    <Box sx={{ mt: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>Invite New User</Typography>
      <TextField
        label="Email Address"
        type="email"
        fullWidth
        value={inviteEmail}
        onChange={handleInviteChange}
        margin="normal"
        helperText="Enter the email address of the user you want to invite."
      />
      <Button onClick={handleInviteClick} variant="contained" color="primary">
        Invite User
      </Button>
      {/* Optional: Display status message */}
      {/* <Alert severity="info" variant="outlined" sx={{mt:2}}>{inviteStatus}</Alert> */}
    </Box>
  );
};

export default InviteUser;
            variant="outlined"
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSendInvitation} edge="end" color="primary">
                  <PersonAddIcon />
                </IconButton>
              ),
            }}
          />
          <Button
import { Button, Box, Typography, IconButton, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from 'react';

interface InvitationData {
    userId: string;
    email: string;
    name: string;
    status: 'pending' | 'accepted' | 'rejected';
}

interface UserInvitationState {
    pendingInvitations: InvitationData[];
    acceptedInvitations: InvitationData[];
    rejectedInvitations: InvitationData[];
}

const UserInvitationState: UserInvitationState = {
    pendingInvitations: [],
    acceptedInvitations: [],
    rejectedInvitations: [],
};

export const UserInvitations = ({ invitations, onSendInvitation }) => {
    const [state, setState] = useState<UserInvitationState>(UserInvitationState);

    useEffect(() => {
        setState(state => ({
            pendingInvitations: state.pendingInvitations.filter(invitation => invitation.status === 'pending'),
            acceptedInvitations: state.acceptedInvitations,
            rejectedInvitations: state.rejectedInvitations,
        }));
    }, [state.pendingInvitations, state.acceptedInvitations, state.rejectedInvitations]);

    const handleSendInvitation = (userId: string) => {
        // Simulate sending an invitation
        console.log(`Sending invitation to user: ${userId}`);
        // In a real application, this would trigger an API call to send the invitation
        // and update the invitation status in the backend.
        setState(prevState => ({
            pendingInvitations: prevState.pendingInvitations.filter(invitation => invitation.userId !== userId),
            acceptedInvitations: prevState.acceptedInvitations,
            rejectedInvitations: prevState.rejectedInvitations,
        }));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Pending Invitations</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
                {state.pendingInvitations.map(invitation => (
                    <Box key={invitation.userId} sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', cursor: 'pointer' } }>
                        <Typography variant="caption" sx={{ marginRight: '10px' }}>{invitation.name} ({invitation.email})</Typography>
                        <Button variant="contained" color="primary" onClick={() => handleSendInvitation(invitation.userId)} sx={{ width: 'auto', marginRight: '5px' }}>Accept</Button>
                    </Box>
                ))}
            </Box>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Accepted Invitations</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
                {state.acceptedInvitations.map(invitation => (
                    <Box key={invitation.userId} sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', cursor: 'pointer' }}>
                        <Typography variant="caption" sx={{ marginRight: '10px' }}>{invitation.name} ({invitation.email})</Typography>
                    </Box>
                ))}
            </Box>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Rejected Invitations</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
                {state.rejectedInvitations.map(invitation => (
                    <Box key={invitation.userId} sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', cursor: 'pointer' }}>
                        <Typography variant="caption" sx={{ marginRight: '10px' }}>{invitation.name} ({invitation.email})</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
        <Dialog open={openEditDialog} onClose={handleCloseEditDialog} fullWidth maxWidth="sm">
          <DialogTitle>Edit User Access</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Editing access for: {editingUser?.name} ({editingUser?.email})
            </DialogContentText>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel id="access-level-label">Access Level</InputLabel>
              <Select
                labelId="access-level-label"
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { FormControl, InputLabel, MenuItem, Typography } from '@mui/material';

interface DeviceSettingsState {
  name: string;
  type: string;
  status: boolean;
  accessLevel: 'full' | 'limited' | 'view-only';
}

const DeviceSettings: React.FC<{ deviceData: DeviceSettingsState; onSaveChanges: (updatedData: DeviceSettingsState) => void; }> = ({ deviceData, onSaveChanges }) => {
  const [deviceName, setDeviceName] = useState(deviceData.name);
  const [deviceType, setDeviceType] = useState(deviceData.type);
  const [deviceStatus, setDeviceStatus] = useState(deviceData.status);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState(deviceData.accessLevel);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDeviceName(event.target.value);
  };

  const handleTypeChange = (option: React.Option<string>) => {
    setDeviceType(option.value);
  };

  const handleStatusToggle = () => {
    setDeviceStatus(!deviceStatus);
  };

  const handleAccessLevelChange = (option: React.Option<string>) => {
    setSelectedAccessLevel(option.value);
  };

  const handleSaveChanges = () => {
    onSaveChanges({
      name: deviceName,
      type: deviceType,
      status: deviceStatus,
      accessLevel: selectedAccessLevel,
    });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
      <Typography variant="h6" style={{ textAlign: 'center', marginBottom: '16px' }}>
        Device Settings
      </Typography>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
        <InputLabel style={{ marginBottom: '8px' }} htmlFor="deviceName">Name</InputLabel>
        <input
          type="text"
          id="deviceName"
          value={deviceName}
          onChange={handleNameChange}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', marginBottom: '8px' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
        <InputLabel style={{ marginBottom: '8px' }} htmlFor="deviceType">Type</InputLabel>
        <Select
          id="deviceType"
          value={deviceType}
          onChange={handleTypeChange}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
        >
          <MenuItem value="light" >Light</MenuItem>
          <MenuItem value="switch" >Switch</MenuItem>
          <MenuItem value="sensor" >Sensor</MenuItem>
        </Select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Typography style={{ width: '160px', verticalAlign: 'bottom' }}>
          Status
        </Typography>
        <ToggleSwitch checked={deviceStatus} onChange={handleStatusToggle} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Typography style={{ width: '160px', verticalAlign: 'bottom' }}>
          Access Level
        </Typography>
        <Select
          id="accessLevel"
          value={selectedAccessLevel}
          onChange={handleAccessLevelChange}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
        >
          <MenuItem value="full">Full Access</MenuItem>
          <MenuItem value="limited">Limited Access</MenuItem>
          <MenuItem value="view-only">View Only</MenuItem>
        </Select>
      </div>
      <Button variant="contained" color="primary" onClick={handleSaveChanges}>
        Save Changes
      </Button>
    </div>
  );
};

export default DeviceSettings;

=== END ===
import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, Alert } from '@mui/material';
import { DeviceType } from './types'; // Import DeviceType

interface AdvancedSharingSystemProps {
  // Add props here if needed
}

const AdvancedSharingSystem: React.FC<AdvancedSharingSystemProps> = () => {
  const [selectedDevices, setSelectedDevices] = useState<DeviceType[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([
    { id: 'light', name: 'Lights', description: 'Control your smart lights.' },
    { id: 'climate', name: 'Climate', description: 'Manage your thermostat and AC.' },
    { id: 'media', name: 'Media', description: 'Control your audio and video devices.' },
    { id: 'security', name: 'Security', description: 'Control your security systems.' },
    { id: 'wellness', name: 'Wellness', description: 'Monitor and control your wellness devices.' },
    { id: 'productivity', name: 'Productivity', description: 'Manage your productivity tools.' },
    { id: 'communication', name: 'Communication', description: 'Control your communication devices.' },
  ]);

  const handleDeviceSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = event.target.value;
    if (selectedOption) {
      const newSelectedDevices = selectedOption ? [...selectedDevices, selectedOption] : selectedDevices;
      setSelectedDevices(newSelectedDevices);
    } else {
      setSelectedDevices(selectedDevices.filter((device) => device !== selectedOption));
    }
  };

  const handleAddDevice = (deviceType: DeviceType) => {
    if (!selectedDevices.find((d) => d.id === deviceType.id)) {
      setSelectedDevices([...selectedDevices, deviceType]);
    }
  };

  const handleRemoveDevice = (deviceType: DeviceType) => {
    setSelectedDevices(selectedDevices.filter((d) => d.id !== deviceType.id));
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Advanced Device Sharing
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {deviceTypes.map((deviceType) => (
          <Box
            key={deviceType.id}
            sx={{
              border: '1px solid #ccc',
              padding: '10px',
              borderRadius: '5px',
              width: 'calc(50% - 10px)', // Adjust width for responsiveness
              textAlign: 'center',
            }}
            onClick={() => handleAddDevice(deviceType)}
          >
            <Typography sx={{ fontWeight: 'bold' }}>{deviceType.name}</Typography>
            <Typography>{deviceType.description}</Typography>
          </Box>
        ))}
      </Box>

      {selectedDevices.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Selected Devices:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {selectedDevices.map((deviceType) => (
              <Box
                key={deviceType.id}
                sx={{
                  border: '1px solid #ccc',
                  padding: '10px',
                  borderRadius: '5px',
                  width: 'calc(50% - 10px)',
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ fontWeight: 'bold' }}>{deviceType.name}</Typography>
                <Typography>{deviceType.description}</Typography>
                <Button
                  onClick={() => handleRemoveDevice(deviceType)}
                  color="error"
                  variant="contained"
                  sx={{ mt: 1 }}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdvancedSharingSystem;
                      {(selected as string[]).map((value) => {
                        const device = allDevices.find(d => d.id === value);
                        return device ? <Chip key={value} label={device.name} /> : null;
                      })}
                    </Box>
                  )}
                  label="Select Devices"
                >
                  {allDevices.map((device) => (
                    <MenuItem key={device.id} value={device.id}>
import React, { useState, useEffect, ChangeEvent, FormHTMLControl } from 'react';
import { SelectChangeEvent } from 'formik';
import { DeviceType, UserAccess } from './types'; // Import types

interface DeviceOptions {
  [key: string]: DeviceType;
}

interface DeviceFormValues {
  id: string;
  name: string;
  type: DeviceType;
  userId: string;
}

const DeviceForm = ({
  initialValues,
  handleSubmit,
  errors,
  handleChange,
  handleBlur,
}) => {
  const { id, name, type, userId } = initialValues;

  const deviceOptions: DeviceOptions = {
    'smart_light': 'Smart Light',
    'smart_thermostat': 'Smart Thermostat',
    'smart_speaker': 'Smart Speaker',
    'smart_lock': 'Smart Lock',
    'smart_sensor': 'Smart Sensor',
  };

  const [formValues, setFormValues] = useState<DeviceFormValues>({
    id: '',
    name: '',
    type: '',
    userId: '',
  });

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmitForm = (event: Event) => {
    event.preventDefault();
    handleSubmit(formValues);
  };

  return (
    <form onSubmit={handleSubmitForm}>
      <div className="form-group">
        <label htmlFor="name">Device Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={errors.name ? 'form-control is-invalid' : 'form-control'}
        />
        {errors.name && <span className="invalid-feedback">Device name is required.</span>}
      </div>

      <div className="form-group">
        <label htmlFor="type">Device Type:</label>
        <Select
          id="type"
          name="type"
          options={Object.entries(deviceOptions).map(([key, value]) => ({ key, value }))}
          value={formValues.type}
          onChange={(event: SelectChangeEvent<string>) => {
            handleChange(event, 'type');
          }}
          className={errors.type ? 'form-control is-invalid' : 'form-control'}
        />
        {errors.type && <span className="invalid-feedback">Select a device type.</span>}
      </div>

      <div className="form-group">
        <label htmlFor="userId">User ID:</label>
        <input
          type="text"
          id="userId"
          name="userId"
          value={formValues.userId}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={errors.userId ? 'form-control is-invalid' : 'form-control'}
        />
        {errors.userId && <span className="invalid-feedback">User ID is required.</span>}
      </div>

      <button type="submit" className="btn btn-primary" disabled={!formValues.name || !formValues.type || !formValues.userId}>
        Save Device
      </button>
    </form>
  );
};

export default DeviceForm;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SharingProvider, ShareButton, ShareDialog, DialogActions, Alert, Paper, Snackbar } from '@mui/material';
import { useAppDispatch } from '../app/hooks';
import { selectDevices, selectUser, selectSharingStatus } from '../app/slices';
import { ShareItem } from '../types/shareItem';
import { Device } from '../types/device';
import { ShareType } from '../types/shareType';

interface AdvancedSharingSystemProps {
  // No props needed for this component
}

const AdvancedSharingSystem: React.FC<AdvancedSharingSystemProps> = () => {
  const dispatch = useAppDispatch();
  const user = selectUser();
  const sharingStatus = selectSharingStatus();
  const devices = selectDevices();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<ShareType | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>('');

  // Use useCallback to memoize the shareItems function
  const shareItems = useCallback(
    () => {
      const items: ShareItem[] = [];
      for (const device of devices) {
        items.push({
          id: device.id,
          type: 'device',
          name: device.name,
          description: device.description,
          imageUrl: device.imageUrl,
          // You could add more details here if needed
        });
      }
      return items;
    },
    [devices] // Re-create when devices change
  );

  const handleShare = useCallback(
    (item: ShareItem) => {
      // Simulate sharing logic (replace with actual sharing implementation)
      console.log(`Sharing ${item.type} ${item.name}`);

      if (item.type === 'device') {
        setSnackbarMessage(`Shared ${item.name} successfully!`);
        setSnackbarSeverity('device');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(`Sharing ${item.type} ${item.name} - processing...`);
        setSnackbarSeverity(item.type);
        setSnackbarOpen(true);
      }
    },
    [snackbarOpen, setSnackbarOpen, setSnackbarSeverity, setSnackbarMessage]
  );


  return (
    <SharingProvider>
      <Paper sx={{ mt: 2, p: 2 }}>
        <Button onClick={() => {
          const items = shareItems();
          if (items.length > 0) {
              const shareDialog = new ShareDialog({
                  shareItems: items,
                  onShare: handleShare
              })
              shareDialog.open()

          }
        }} variant="contained" color="primary">
          Share Devices
        </Button>

        {/* Placeholder for more advanced sharing options */}
      </Paper>
    </SharingProvider>
  );
};

export default AdvancedSharingSystem;
  );
};

export default AdvancedSharingSystem;