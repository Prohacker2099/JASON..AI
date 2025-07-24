# JASON API Documentation

This document provides detailed information about the JASON API endpoints, request/response formats, and authentication.

## API Overview

JASON provides a RESTful API for controlling devices, managing scenes, and more. All API endpoints are versioned under `/api/v1/`.

## Authentication

All API requests require an API key, which should be included in the `X-API-Key` header.

Example:

```
X-API-Key: jason_abc123def456
```

## API Endpoints

### Devices

#### Get All Devices

```
GET /api/v1/devices
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "hue-light-1",
      "name": "Living Room Light",
      "type": "light",
      "manufacturer": "Philips",
      "model": "Hue White and Color",
      "protocol": "hue",
      "location": "Living Room",
      "capabilities": ["on", "brightness", "color"],
      "state": {
        "on": true,
        "brightness": 100,
        "color": {
          "h": 240,
          "s": 100,
          "v": 100
        }
      },
      "online": true
    }
  ]
}
```

#### Get a Specific Device

```
GET /api/v1/devices/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "hue-light-1",
    "name": "Living Room Light",
    "type": "light",
    "manufacturer": "Philips",
    "model": "Hue White and Color",
    "protocol": "hue",
    "location": "Living Room",
    "capabilities": ["on", "brightness", "color"],
    "state": {
      "on": true,
      "brightness": 100,
      "color": {
        "h": 240,
        "s": 100,
        "v": 100
      }
    },
    "online": true
  }
}
```

#### Start Device Discovery

```
POST /api/v1/devices/discover
```

Response:

```json
{
  "success": true,
  "message": "Device discovery started"
}
```

#### Control a Device

```
POST /api/v1/devices/:id/control
```

Request:

```json
{
  "type": "power",
  "params": {
    "value": true
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "on": true
  }
}
```

### Scenes

#### Get All Scenes

```
GET /api/v1/scenes
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "scene-1",
      "name": "Movie Night",
      "deviceStates": [
        {
          "deviceId": "hue-light-1",
          "state": {
            "on": true,
            "brightness": 30,
            "color": {
              "h": 240,
              "s": 100,
              "v": 100
            }
          }
        }
      ],
      "createdAt": "2023-05-01T12:00:00Z",
      "updatedAt": "2023-05-01T12:00:00Z",
      "lastActivatedAt": "2023-05-01T18:00:00Z"
    }
  ]
}
```

#### Get a Specific Scene

```
GET /api/v1/scenes/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "scene-1",
    "name": "Movie Night",
    "deviceStates": [
      {
        "deviceId": "hue-light-1",
        "state": {
          "on": true,
          "brightness": 30,
          "color": {
            "h": 240,
            "s": 100,
            "v": 100
          }
        }
      }
    ],
    "createdAt": "2023-05-01T12:00:00Z",
    "updatedAt": "2023-05-01T12:00:00Z",
    "lastActivatedAt": "2023-05-01T18:00:00Z"
  }
}
```

#### Create a New Scene

```
POST /api/v1/scenes
```

Request:

```json
{
  "name": "Movie Night",
  "deviceStates": [
    {
      "deviceId": "hue-light-1",
      "state": {
        "on": true,
        "brightness": 30,
        "color": {
          "h": 240,
          "s": 100,
          "v": 100
        }
      }
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "scene-1",
    "name": "Movie Night",
    "deviceStates": [
      {
        "deviceId": "hue-light-1",
        "state": {
          "on": true,
          "brightness": 30,
          "color": {
            "h": 240,
            "s": 100,
            "v": 100
          }
        }
      }
    ],
    "createdAt": "2023-05-01T12:00:00Z",
    "updatedAt": "2023-05-01T12:00:00Z"
  }
}
```

#### Update a Scene

```
PUT /api/v1/scenes/:id
```

Request:

```json
{
  "name": "Movie Night Updated",
  "deviceStates": [
    {
      "deviceId": "hue-light-1",
      "state": {
        "on": true,
        "brightness": 20,
        "color": {
          "h": 240,
          "s": 100,
          "v": 100
        }
      }
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "scene-1",
    "name": "Movie Night Updated",
    "deviceStates": [
      {
        "deviceId": "hue-light-1",
        "state": {
          "on": true,
          "brightness": 20,
          "color": {
            "h": 240,
            "s": 100,
            "v": 100
          }
        }
      }
    ],
    "createdAt": "2023-05-01T12:00:00Z",
    "updatedAt": "2023-05-01T13:00:00Z"
  }
}
```

#### Delete a Scene

```
DELETE /api/v1/scenes/:id
```

Response:

```json
{
  "success": true,
  "message": "Scene deleted"
}
```

#### Activate a Scene

```
POST /api/v1/scenes/:id/activate
```

Response:

```json
{
  "success": true,
  "message": "Scene activated"
}
```

### Automations

#### Get All Automations

```
GET /api/v1/automations
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "automation-1",
      "name": "Turn on lights at sunset",
      "trigger": {
        "type": "time",
        "time": "sunset"
      },
      "action": {
        "type": "scene",
        "sceneId": "scene-1"
      },
      "enabled": true,
      "createdAt": "2023-05-01T12:00:00Z",
      "updatedAt": "2023-05-01T12:00:00Z",
      "lastTriggeredAt": "2023-05-01T18:00:00Z"
    }
  ]
}
```

#### Get a Specific Automation

```
GET /api/v1/automations/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "automation-1",
    "name": "Turn on lights at sunset",
    "trigger": {
      "type": "time",
      "time": "sunset"
    },
    "action": {
      "type": "scene",
      "sceneId": "scene-1"
    },
    "enabled": true,
    "createdAt": "2023-05-01T12:00:00Z",
    "updatedAt": "2023-05-01T12:00:00Z",
    "lastTriggeredAt": "2023-05-01T18:00:00Z"
  }
}
```

#### Create a New Automation

```
POST /api/v1/automations
```

Request:

```json
{
  "name": "Turn on lights at sunset",
  "trigger": {
    "type": "time",
    "time": "sunset"
  },
  "action": {
    "type": "scene",
    "sceneId": "scene-1"
  },
  "enabled": true
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "automation-1",
    "name": "Turn on lights at sunset",
    "trigger": {
      "type": "time",
      "time": "sunset"
    },
    "action": {
      "type": "scene",
      "sceneId": "scene-1"
    },
    "enabled": true,
    "createdAt": "2023-05-01T12:00:00Z",
    "updatedAt": "2023-05-01T12:00:00Z"
  }
}
```

### AI

#### Process a Natural Language Command

```
POST /api/v1/ai/command
```

Request:

```json
{
  "command": "Turn on the living room light"
}
```

Response:

```json
{
  "success": true,
  "type": "device_control",
  "response": "Turned on Living Room Light.",
  "data": {
    "device": {
      "id": "hue-light-1",
      "name": "Living Room Light",
      "type": "light"
    },
    "action": "on",
    "result": {
      "on": true
    }
  }
}
```

#### Get Help Information

```
GET /api/v1/ai/help
```

Response:

```json
{
  "success": true,
  "response": "Here are some commands you can try:\n- Turn on/off [device name]\n- Set [device name] to [X]%\n- Activate [scene name] scene\n- What is the status of [device name]\n- List all devices\n- Discover devices\n- System status"
}
```

## WebSocket API

JASON also provides a WebSocket API for real-time updates. Connect to `/ws` to receive events.

### Events

#### Device State Changed

```json
{
  "type": "deviceStateChanged",
  "device": {
    "id": "hue-light-1",
    "name": "Living Room Light",
    "type": "light",
    "state": {
      "on": true,
      "brightness": 100
    }
  }
}
```

#### Scene Activated

```json
{
  "type": "sceneActivated",
  "scene": {
    "id": "scene-1",
    "name": "Movie Night"
  }
}
```

#### Automation Triggered

```json
{
  "type": "automationTriggered",
  "automation": {
    "id": "automation-1",
    "name": "Turn on lights at sunset"
  }
}
```

## Error Handling

All API endpoints return a standard error format:

```json
{
  "success": false,
  "error": "Error message"
}
```

HTTP status codes are used to indicate the type of error:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
