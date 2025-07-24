import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_DIR = path.join(__dirname, '..', 'data');
const DEVICES_FILE = path.join(DB_DIR, 'devices.json');
const ACTIVITIES_FILE = path.join(DB_DIR, 'activities.json');
const CONSOLE_MESSAGES_FILE = path.join(DB_DIR, 'console_messages.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize storage with empty data if files don't exist
async function initialize() {
  if (!fs.existsSync(DEVICES_FILE)) {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify([]));
  }
  
  if (!fs.existsSync(ACTIVITIES_FILE)) {
    fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify([]));
  }
  
  if (!fs.existsSync(CONSOLE_MESSAGES_FILE)) {
    fs.writeFileSync(CONSOLE_MESSAGES_FILE, JSON.stringify([]));
  }
  
  return true;
}

// Device operations
async function getAllDevices() {
  try {
    const data = fs.readFileSync(DEVICES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading devices file:', error);
    return [];
  }
}

async function getDeviceById(deviceId) {
  try {
    const devices = await getAllDevices();
    return devices.filter(device => device.deviceId === deviceId);
  } catch (error) {
    console.error(`Error getting device ${deviceId}:`, error);
    return [];
  }
}

async function updateDeviceStatus(deviceId, isActive, status) {
  try {
    const devices = await getAllDevices();
    const deviceIndex = devices.findIndex(device => device.deviceId === deviceId);
    
    if (deviceIndex === -1) {
      return null;
    }
    
    devices[deviceIndex].isActive = isActive;
    
    if (status) {
      devices[deviceIndex].status = status;
    }
    
    devices[deviceIndex].updatedAt = new Date().toISOString();
    
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
    
    return devices[deviceIndex];
  } catch (error) {
    console.error(`Error updating device ${deviceId}:`, error);
    return null;
  }
}

async function createDevice(device) {
  try {
    const devices = await getAllDevices();
    
    // Check if device already exists
    const existingDeviceIndex = devices.findIndex(d => d.deviceId === device.deviceId);
    
    if (existingDeviceIndex !== -1) {
      // Update existing device
      devices[existingDeviceIndex] = {
        ...devices[existingDeviceIndex],
        ...device,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new device
      devices.push({
        ...device,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
    
    return device;
  } catch (error) {
    console.error('Error creating device:', error);
    return null;
  }
}

// Activities operations
async function getRecentActivities(limit = 10) {
  try {
    const data = fs.readFileSync(ACTIVITIES_FILE, 'utf8');
    const activities = JSON.parse(data);
    
    // Sort by timestamp descending and limit
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('Error reading activities file:', error);
    return [];
  }
}

async function addActivity(activity) {
  try {
    const activities = fs.existsSync(ACTIVITIES_FILE) 
      ? JSON.parse(fs.readFileSync(ACTIVITIES_FILE, 'utf8')) 
      : [];
    
    const newActivity = {
      ...activity,
      activityId: activity.activityId || uuidv4(),
      timestamp: new Date().toISOString()
    };
    
    activities.push(newActivity);
    
    fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify(activities, null, 2));
    
    return newActivity;
  } catch (error) {
    console.error('Error adding activity:', error);
    return null;
  }
}

// Console messages operations
async function getRecentConsoleMessages(limit = 20) {
  try {
    const data = fs.readFileSync(CONSOLE_MESSAGES_FILE, 'utf8');
    const messages = JSON.parse(data);
    
    // Sort by timestamp descending and limit
    return messages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('Error reading console messages file:', error);
    return [];
  }
}

async function addConsoleMessage(message) {
  try {
    const messages = fs.existsSync(CONSOLE_MESSAGES_FILE) 
      ? JSON.parse(fs.readFileSync(CONSOLE_MESSAGES_FILE, 'utf8')) 
      : [];
    
    const newMessage = {
      ...message,
      messageId: message.messageId || uuidv4(),
      timestamp: new Date().toISOString()
    };
    
    messages.push(newMessage);
    
    fs.writeFileSync(CONSOLE_MESSAGES_FILE, JSON.stringify(messages, null, 2));
    
    return newMessage;
  } catch (error) {
    console.error('Error adding console message:', error);
    return null;
  }
}

export {
  initialize,
  getAllDevices,
  getDeviceById,
  updateDeviceStatus,
  createDevice,
  getRecentActivities,
  addActivity,
  getRecentConsoleMessages,
  addConsoleMessage
};

export default {
  initialize,
  getAllDevices,
  getDeviceById,
  updateDeviceStatus,
  createDevice,
  getRecentActivities,
  addActivity,
  getRecentConsoleMessages,
  addConsoleMessage
};import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_DIR = path.join(__dirname, '..', 'data');
const DEVICES_FILE = path.join(DB_DIR, 'devices.json');
const ACTIVITIES_FILE = path.join(DB_DIR, 'activities.json');
const CONSOLE_MESSAGES_FILE = path.join(DB_DIR, 'console_messages.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize storage with empty data if files don't exist
async function initialize() {
  if (!fs.existsSync(DEVICES_FILE)) {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify([]));
  }
  
  if (!fs.existsSync(ACTIVITIES_FILE)) {
    fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify([]));
  }
  
  if (!fs.existsSync(CONSOLE_MESSAGES_FILE)) {
    fs.writeFileSync(CONSOLE_MESSAGES_FILE, JSON.stringify([]));
  }
  
  return true;
}

// Device operations
async function getAllDevices() {
  try {
    const data = fs.readFileSync(DEVICES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading devices file:', error);
    return [];
  }
}

async function getDeviceById(deviceId) {
  try {
    const devices = await getAllDevices();
    return devices.filter(device => device.deviceId === deviceId);
  } catch (error) {
    console.error(`Error getting device ${deviceId}:`, error);
    return [];
  }
}

async function updateDeviceStatus(deviceId, isActive, status) {
  try {
    const devices = await getAllDevices();
    const deviceIndex = devices.findIndex(device => device.deviceId === deviceId);
    
    if (deviceIndex === -1) {
      return null;
    }
    
    devices[deviceIndex].isActive = isActive;
    
    if (status) {
      devices[deviceIndex].status = status;
    }
    
    devices[deviceIndex].updatedAt = new Date().toISOString();
    
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
    
    return devices[deviceIndex];
  } catch (error) {
    console.error(`Error updating device ${deviceId}:`, error);
    return null;
  }
}

async function createDevice(device) {
  try {
    const devices = await getAllDevices();
    
    // Check if device already exists
    const existingDeviceIndex = devices.findIndex(d => d.deviceId === device.deviceId);
    
    if (existingDeviceIndex !== -1) {
      // Update existing device
      devices[existingDeviceIndex] = {
        ...devices[existingDeviceIndex],
        ...device,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new device
      devices.push({
        ...device,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
    
    return device;
  } catch (error) {
    console.error('Error creating device:', error);
    return null;
  }
}

// Activities operations
async function getRecentActivities(limit = 10) {
  try {
    const data = fs.readFileSync(ACTIVITIES_FILE, 'utf8');
    const activities = JSON.parse(data);
    
    // Sort by timestamp descending and limit
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('Error reading activities file:', error);
    return [];
  }
}

async function addActivity(activity) {
  try {
    const activities = fs.existsSync(ACTIVITIES_FILE) 
      ? JSON.parse(fs.readFileSync(ACTIVITIES_FILE, 'utf8')) 
      : [];
    
    const newActivity = {
      ...activity,
      activityId: activity.activityId || uuidv4(),
      timestamp: new Date().toISOString()
    };
    
    activities.push(newActivity);
    
    fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify(activities, null, 2));
    
    return newActivity;
  } catch (error) {
    console.error('Error adding activity:', error);
    return null;
  }
}

// Console messages operations
async function getRecentConsoleMessages(limit = 20) {
  try {
    const data = fs.readFileSync(CONSOLE_MESSAGES_FILE, 'utf8');
    const messages = JSON.parse(data);
    
    // Sort by timestamp descending and limit
    return messages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('Error reading console messages file:', error);
    return [];
  }
}

async function addConsoleMessage(message) {
  try {
    const messages = fs.existsSync(CONSOLE_MESSAGES_FILE) 
      ? JSON.parse(fs.readFileSync(CONSOLE_MESSAGES_FILE, 'utf8')) 
      : [];
    
    const newMessage = {
      ...message,
      messageId: message.messageId || uuidv4(),
      timestamp: new Date().toISOString()
    };
    
    messages.push(newMessage);
    
    fs.writeFileSync(CONSOLE_MESSAGES_FILE, JSON.stringify(messages, null, 2));
    
    return newMessage;
  } catch (error) {
    console.error('Error adding console message:', error);
    return null;
  }
}

export {
  initialize,
  getAllDevices,
  getDeviceById,
  updateDeviceStatus,
  createDevice,
  getRecentActivities,
  addActivity,
  getRecentConsoleMessages,
  addConsoleMessage
};

export default {
  initialize,
  getAllDevices,
  getDeviceById,
  updateDeviceStatus,
  createDevice,
  getRecentActivities,
  addActivity,
  getRecentConsoleMessages,
  addConsoleMessage
};