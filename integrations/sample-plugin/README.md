# JASON Sample Plugin

This is a sample plugin for the JASON smart home platform. It demonstrates how to create a plugin that can discover and control devices.

## Features

- Discovers sample devices (lights, switches, sensors)
- Controls device states (power, brightness, color)
- Implements the JASON plugin interface

## Installation

1. Place this folder in the `/integrations/sample-plugin` directory of your JASON installation.
2. Install dependencies:
   ```bash
   cd integrations/sample-plugin
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. Restart the JASON server.

## Usage

Once installed, the sample plugin will be automatically loaded by JASON. You can verify it's working by:

1. Checking the server logs for "Sample plugin initialized"
2. Calling the `/api/plugins` endpoint to see if the sample plugin is listed
3. Triggering device discovery to find the sample devices

## Development

This plugin serves as a template for creating your own JASON plugins. To create a new plugin:

1. Copy this directory to a new location
2. Modify the `package.json` to change the name and description
3. Update the plugin class in `index.ts` to implement your device discovery and control logic
4. Build and test your plugin

## API

The plugin implements the `IDevicePlugin` interface, which includes:

- `discover()`: Discovers devices and returns them
- `control(deviceId, command)`: Controls a device and returns the updated state
- `getCapabilities(deviceId)`: Returns the capabilities of a device
- `validateCommand(deviceId, command)`: Validates if a command is supported by a device

## License

MIT
