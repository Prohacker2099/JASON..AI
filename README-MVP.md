# JASON AI Architect - MVP Implementation

This document provides an overview of the Minimum Viable Product (MVP) implementation of JASON AI Architect, a universal smart home hub with local AI capabilities.

## Core Features

### 1. Universal Device Discovery & Control

- **Multi-Protocol Support**: Discover and control devices using SSDP/UPnP, mDNS, and direct API integrations
- **Supported Device Types**: Lights, switches, outlets, thermostats, cameras, sensors, and more
- **Real-Time State Management**: Bidirectional state synchronization with WebSocket support
- **Plugin Architecture**: Extensible framework for adding new device protocols

### 2. Local AI Assistant

- **Natural Language Processing**: Process simple commands like "turn on the living room lights"
- **Local-First Processing**: All core AI functionality runs on your local network
- **Basic Pattern Recognition**: Learn from user behavior to suggest automations
- **Privacy-Focused**: No cloud dependencies for core functionality

### 3. Automation Engine

- **Trigger Types**: Time-based, device state, sensor readings
- **Conditional Logic**: If-then rules with multiple conditions
- **Action Types**: Device control, scene activation, notifications
- **Scheduling**: Reliable time-based automation execution

### 4. Scene Management

- **Device State Collections**: Group multiple device states into scenes
- **One-Touch Activation**: Activate multiple devices with a single command
- **Scene Capture**: Create scenes from current device states
- **Scheduling**: Activate scenes based on time or triggers

### 5. Voice Assistant Integration

- **Protocol Emulation**: Emulate Philips Hue bridge for native voice assistant discovery
- **No Login Required**: Voice assistants communicate directly with JASON without storing credentials
- **Matter/Thread Support**: Future-proof integration with emerging smart home standards

## Getting Started

### Prerequisites

- Node.js 16+
- npm 7+
- Smart home devices on your local network

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/JASON_TheOmnipotentAIArchitect.git
   cd JASON_TheOmnipotentAIArchitect
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Configure your environment:

   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration:
   ```
   # Required for Philips Hue integration
   HUE_USERNAME=your_hue_username
   HUE_BRIDGE_IP=your_hue_bridge_ip
   ```

### Running JASON

#### Development Mode

```
npm run dev
```

#### Production Deployment

Build the application:

```
npm run build
```

Start the server:

```
npm start
```

#### Docker Deployment (Recommended)

```
docker-compose up -d
```

## API Reference

### Device Management

- `GET /api/devices` - Get all discovered devices
- `POST /api/devices/discovery/start` - Start device discovery
- `POST /api/devices/discovery/stop` - Stop device discovery
- `POST /api/devices/:id/command` - Send command to device

### AI Assistant

- `POST /api/ai/process` - Process natural language command
- `GET /api/ai/insights/:userId` - Get AI-generated insights

### Automation

- `GET /api/automations` - Get all automations
- `POST /api/automations` - Create a new automation
- `PUT /api/automations/:id` - Update an automation
- `DELETE /api/automations/:id` - Delete an automation
- `POST /api/automations/:id/trigger` - Trigger an automation manually

### Scenes

- `GET /api/scenes` - Get all scenes
- `POST /api/scenes` - Create a new scene
- `PUT /api/scenes/:id` - Update a scene
- `DELETE /api/scenes/:id` - Delete a scene
- `POST /api/scenes/:id/activate` - Activate a scene
- `POST /api/scenes/capture` - Capture current device states as a new scene

## WebSocket Events

Connect to WebSocket at `ws://localhost:PORT` to receive:

- `deviceDiscovered` - New device found
- `deviceStateChanged` - Device state updated
- `deviceRemoved` - Device removed
- `automationExecuted` - Automation executed
- `sceneActivated` - Scene activated
- `aiResponse` - Response from AI assistant

## Next Steps

After the MVP is stable, the following features will be implemented:

1. **Advanced AI Engine**: Machine learning for pattern recognition and predictive automation
2. **Voice Assistant Integration**: Alexa Skill and Google Assistant Action development
3. **Data Analytics**: Energy usage monitoring and device usage patterns
4. **Plugin Marketplace**: Developer SDK and plugin submission system

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
