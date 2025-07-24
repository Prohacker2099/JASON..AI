# JASON Integration Guide

This document outlines the changes made to integrate the JASON platform into the application.

## Overview of Changes

1. **Database Migrations**
   - Created a device table migration (`003_create_devices_table.ts`)
   - Implemented a migration runner (`db/migrations/index.ts`)

2. **Matter Protocol Support**
   - Added Matter controller integration (`integrations/matter-controller/index.ts`)
   - Created setup script for Matter controller (`integrations/matter-controller/setup.ts`)

3. **Enhanced Plugin System**
   - Implemented a comprehensive plugin system (`server/services/pluginSystem.ts`)
   - Created a plugin discovery script (`scripts/discover-plugins.ts`)

4. **API Enhancements**
   - Created dedicated device API routes (`server/routes/api/devices.ts`)
   - Updated main API router to use the new device routes

5. **Server Improvements**
   - Fixed duplicate imports in server entry point
   - Added database migration initialization
   - Integrated plugin system with server startup

6. **Documentation**
   - Updated README with new features
   - Enhanced plugin development documentation
   - Added new npm scripts for migrations and plugin discovery

## How to Use the Integration

### Setting Up

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run database migrations:

   ```bash
   npm run migrate
   ```

3. Set up Matter controller:

   ```bash
   npm run matter:setup
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Discovering Devices

The application now supports multiple ways to discover devices:

1. **API Endpoint**: Send a POST request to `/api/devices/discover`
2. **WebSocket**: Send a message with `type: 'startDiscovery'`
3. **UI**: Use the device discovery button in the web interface

### Using Matter Devices

Matter devices are automatically discovered and integrated into the platform. In development mode, mock Matter devices are created for testing.

### Creating Plugins

You can extend the platform by creating plugins:

1. Create a new directory in the `plugins` directory
2. Create an `index.ts` file that exports a class extending `BaseDevicePlugin`
3. Implement the required methods: `initialize()`, `discoverDevices()`, and `controlDevice()`
4. The plugin will be automatically loaded when the server starts

### Discovering Plugins

To see all available plugins:

```bash
npm run plugin:discover
```

## Architecture

The integration follows a modular architecture:

- **Core Services**: Device discovery, device management, automation engine, scene manager
- **Plugin System**: Dynamically loads and manages plugins
- **API Layer**: REST API and WebSocket for device control and real-time updates
- **Database Layer**: SQLite with migrations for persistence

## Next Steps

1. **Implement Additional Protocols**: Add support for Zigbee, Z-Wave, and other protocols
2. **Enhance AI Capabilities**: Improve natural language processing and pattern recognition
3. **Develop Mobile App**: Create a mobile app for controlling devices on the go
4. **Implement User Management**: Add user accounts and permissions
5. **Add Energy Monitoring**: Track energy usage and provide insights
