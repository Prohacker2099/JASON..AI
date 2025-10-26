/**
 * JASON - The Omnipotent AI Architect
 * Main application JavaScript
 */


  if (!connected) {
    
    devices = [
      {
        id: "light-1",
        name: "Living Room Light",
        type: "light",
        manufacturer: "Philips",
        model: "Hue",
        capabilities: ["on", "brightness", "color"],
        state: { on: true, brightness: 80, color: { h: 240, s: 100, v: 100 } },
        connected: true,
      },
      {
        id: "light-2",
        name: "Kitchen Light",
        type: "light",
        manufacturer: "LIFX",
        model: "A19",
        capabilities: ["on", "brightness", "color"],
        state: { on: false, brightness: 100, color: { h: 0, s: 0, v: 100 } },
        connected: true,
      },
      {
        id: "thermostat-1",
        name: "Living Room Thermostat",
        type: "thermostat",
        manufacturer: "Nest",
        model: "Learning Thermostat",
        capabilities: ["temperature", "mode"],
        state: { temperature: 72, targetTemperature: 70, mode: "heat" },
        connected: true,
      },
      {
        id: "switch-1",
        name: "Porch Light Switch",
        type: "switch",
        manufacturer: "WeMo",
        model: "Smart Switch",
        capabilities: ["on"],
        state: { on: true },
        connected: true,
      },
      {
        id: "sensor-1",
        name: "Front Door Sensor",
        type: "sensor",
        manufacturer: "SmartThings",
        model: "Multipurpose Sensor",
        capabilities: ["contact", "temperature", "battery"],
        state: { contact: false, temperature: 68, battery: 92 },
        connected: true,
      },
      {
        id: "camera-1",
        name: "Front Door Camera",
        type: "camera",
        manufacturer: "Ring",
        model: "Video Doorbell",
        capabilities: ["motion", "video", "battery"],
        state: { motion: false, battery: 78 },
        connected: false,
      },
    ];

    
    scenes = [
      {
        id: "scene-1",
        name: "Movie Night",
        description: "Dim lights and set temperature for movie watching",
        devices: ["light-1", "light-2", "thermostat-1"],
        lastActivated: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: "scene-2",
        name: "Good Morning",
        description: "Gradually turn on lights and adjust temperature",
        devices: ["light-1", "light-2", "thermostat-1"],
        lastActivated: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        id: "scene-3",
        name: "Away Mode",
        description: "Turn off all devices and enable security",
        devices: ["light-1", "light-2", "thermostat-1", "switch-1"],
        lastActivated: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ];

    
    automations = [
      {
        id: "auto-1",
        name: "Morning Routine",
        description: "Turn on lights at sunrise",
        trigger: { type: "time", time: "7:00 AM" },
        actions: [
          { deviceId: "light-1", action: "turnOn" },
          { deviceId: "light-2", action: "turnOn" },
        ],
        enabled: true,
      },
      {
        id: "auto-2",
        name: "Night Mode",
        description: "Turn off lights at bedtime",
        trigger: { type: "time", time: "11:00 PM" },
        actions: [
          { deviceId: "light-1", action: "turnOff" },
          { deviceId: "light-2", action: "turnOff" },
        ],
        enabled: true,
      },
      {
        id: "auto-3",
        name: "Motion Detection",
        description: "Turn on porch light when motion detected",
        trigger: {
          type: "device",
          deviceId: "camera-1",
          deviceName: "Front Door Camera",
          condition: "detects motion",
        },
        actions: [{ deviceId: "switch-1", action: "turnOn" }],
        enabled: false,
      },
    ];

    
    updateDeviceCounts();
    renderDevices();
    updateSceneCounts();
    renderScenes();
    updateAutomationCounts();
    renderAutomations();
  }
});
