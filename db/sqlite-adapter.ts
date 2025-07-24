atures import { setupDatabase as initializeDatabase } from './setup.js'; // Corrected import
import { v4 as uuidv4 } from 'uuid';

let db: any = null;

/**
 * Initialize the database connection
 */
export async function initialize() {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
}

/**
 * Get all devices from the database
 */
export async function getAllDevices() {
  try {
    await initialize();
    const devices = await db.all('SELECT * FROM devices ORDER BY updated_at DESC');
    
    // Parse JSON fields
    return devices.map(device => ({
      ...device,
      details: device.details ? JSON.parse(device.details) : {},
      metrics: device.metrics ? JSON.parse(device.metrics) : []
    }));
  } catch (error) {
    console.error('Error getting devices:', error);
    return [];
  }
}

/**
 * Get a device by ID
 */
export async function getDeviceById(deviceId: string) {
  try {
    await initialize();
    const device = await db.get('SELECT * FROM devices WHERE device_id = ?', deviceId);
    
    if (!device) return null;
    
    // Parse JSON fields
    return {
      ...device,
      details: device.details ? JSON.parse(device.details) : {},
      metrics: device.metrics ? JSON.parse(device.metrics) : []
    };
  } catch (error) {
    console.error(`Error getting device ${deviceId}:`, error);
    return null;
  }
}

/**
 * Update device status
 */
export async function updateDeviceStatus(deviceId: string, isActive: boolean, status?: string) {
  try {
    await initialize();
    
    if (status) {
      await db.run(
        'UPDATE devices SET is_active = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?',
        isActive ? 1 : 0, status, deviceId
      );
    } else {
      await db.run(
        'UPDATE devices SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?',
        isActive ? 1 : 0, deviceId
      );
    }
    
    return await getDeviceById(deviceId);
  } catch (error) {
    console.error(`Error updating device ${deviceId}:`, error);
    return null;
  }
}

/**
 * Create a new device
 */
export async function createDevice(device: any) {
  try {
    await initialize();
    
    const details = JSON.stringify(device.details || {});
    const metrics = JSON.stringify(device.metrics || []);
    
    await db.run(
      `INSERT INTO devices (
        device_id, name, type, icon, status, is_active, details, metrics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      device.deviceId || uuidv4(),
      device.name,
      device.type,
      device.icon || 'device',
      device.status || 'Unknown',
      device.isActive ? 1 : 0,
      details,
      metrics
    );
    
    return await getDeviceById(device.deviceId);
  } catch (error) {
    console.error('Error creating device:', error);
    return null;
  }
}

/**
 * Get all system metrics
 */
export async function getAllSystemMetrics() {
  try {
    await initialize();
    return await db.all('SELECT * FROM system_metrics');
  } catch (error) {
    console.error('Error getting system metrics:', error);
    return [];
  }
}

/**
 * Update a system metric
 */
export async function updateSystemMetric(metricId: string, value: string, percentage?: number, description?: string) {
  try {
    await initialize();
    
    const metric = await db.get('SELECT * FROM system_metrics WHERE metric_id = ?', metricId);
    
    if (!metric) {
      console.error(`Metric ${metricId} not found`);
      return null;
    }
    
    if (percentage !== undefined && description) {
      await db.run(
        'UPDATE system_metrics SET value = ?, percentage = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE metric_id = ?',
        value, percentage, description, metricId
      );
    } else if (percentage !== undefined) {
      await db.run(
        'UPDATE system_metrics SET value = ?, percentage = ?, updated_at = CURRENT_TIMESTAMP WHERE metric_id = ?',
        value, percentage, metricId
      );
    } else if (description) {
      await db.run(
        'UPDATE system_metrics SET value = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE metric_id = ?',
        value, description, metricId
      );
    } else {
      await db.run(
        'UPDATE system_metrics SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE metric_id = ?',
        value, metricId
      );
    }
    
    return await db.get('SELECT * FROM system_metrics WHERE metric_id = ?', metricId);
  } catch (error) {
    console.error(`Error updating metric ${metricId}:`, error);
    return null;
  }
}

/**
 * Get recent activities
 */
export async function getRecentActivities(limit = 10) {
  try {
    await initialize();
    return await db.all('SELECT * FROM activities ORDER BY timestamp DESC LIMIT ?', limit);
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
}

/**
 * Add a new activity
 */
export async function addActivity(activity: any) {
  try {
    await initialize();
    
    await db.run(
      'INSERT INTO activities (activity_id, title, description, type) VALUES (?, ?, ?, ?)',
      activity.activityId || uuidv4(),
      activity.title,
      activity.description,
      activity.type
    );
    
    return true;
  } catch (error) {
    console.error('Error adding activity:', error);
    return false;
  }
}

/**
 * Get recent console messages
 */
export async function getRecentConsoleMessages(limit = 20) {
  try {
    await initialize();
    return await db.all('SELECT * FROM console_messages ORDER BY timestamp DESC LIMIT ?', limit);
  } catch (error) {
    console.error('Error getting console messages:', error);
    return [];
  }
}

/**
 * Add a new console message
 */
export async function addConsoleMessage(message: any) {
  try {
    await initialize();
    
    await db.run(
      'INSERT INTO console_messages (message_id, text, type) VALUES (?, ?, ?)',
      message.messageId || uuidv4(),
      message.text,
      message.type
    );
    
    return true;
  } catch (error) {
    console.error('Error adding console message:', error);
    return false;
  }
}

export default {
  initialize,
  getAllDevices,
  getDeviceById,
  updateDeviceStatus,
  createDevice,
  getAllSystemMetrics,
  updateSystemMetric,
  getRecentActivities,
  addActivity,
  getRecentConsoleMessages,
  addConsoleMessage
};