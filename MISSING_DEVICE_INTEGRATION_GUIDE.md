# JASON Missing Device Integration Guide

## 🔍 Finding Your Alexa Devices and Mobile Phones

Your network discovery found 7 devices but missed Alexa devices and mobile phones. This is normal due to privacy settings and power management. Here's how to find and integrate them:

## 🎤 Finding Alexa/Echo Devices

### Step 1: Router Admin Panel Check

1. **Access Router**: Go to http://192.168.0.1 in your browser
2. **Login**: Use your router admin credentials
3. **Find Device List**: Look for:
   - "Connected Devices"
   - "DHCP Client List"
   - "Device Manager"
   - "Network Map"

### Step 2: Look for Alexa Device Names

Search for devices with names like:

- `Echo-XXX`
- `Amazon-XXX`
- `Alexa-XXX`
- `Dot-XXX`
- `Show-XXX`
- `Studio-XXX`

### Step 3: Identify by MAC Address

Alexa devices often have MAC addresses starting with:

- `44:D9:E7`
- `74:75:48`
- `68:A4:0E`
- `F0:27:2D`
- `00:FC:8B`
- `74:C2:46`

### Step 4: Manual Network Scan

```bash
# If you have nmap installed:
nmap -sn 192.168.0.1/24

# Look for devices responding on Alexa ports:
# Port 4070: Alexa Voice Service
# Port 55443: Alexa Communication
# Port 40317: Alexa Discovery
```

## 📱 Finding Mobile Devices

### Step 1: Router Device List

Look for devices with names like:

- `iPhone-XXX`
- `iPad-XXX`
- `[Name]'s iPhone`
- `android-XXX`
- `Samsung-XXX`
- `Pixel-XXX`

### Step 2: Check by Manufacturer

In router device list, look for:

- **Apple Inc.** (iPhones, iPads)
- **Samsung** (Android phones)
- **Google** (Pixel phones)
- **LG Electronics** (LG phones)

### Step 3: WiFi Settings Check

On your mobile devices:

1. **iOS**: Settings → WiFi → (i) next to network name
2. **Android**: Settings → WiFi → Advanced → IP Address

## 🔧 Manual Integration Steps

### Adding Alexa Devices to JASON

1. **Document Device Info**:

   ```
   Device: Echo Dot
   IP: 192.168.0.XXX
   MAC: XX:XX:XX:XX:XX:XX
   Hostname: Echo-XXXXX
   ```

2. **Add to JASON Configuration**:

   ```json
   {
     "alexa_devices": [
       {
         "name": "Living Room Echo",
         "ip": "192.168.0.XXX",
         "type": "echo_dot",
         "capabilities": ["voice_assistant", "smart_speaker", "music_streaming"]
       }
     ]
   }
   ```

3. **Test Connectivity**:

   ```bash
   # Test if device responds
   ping 192.168.0.XXX

   # Check Alexa ports
   telnet 192.168.0.XXX 4070
   ```

### Adding Mobile Devices to JASON

1. **Document Device Info**:

   ```
   Device: iPhone
   IP: 192.168.0.XXX (may change)
   MAC: XX:XX:XX:XX:XX:XX
   Owner: [Name]
   ```

2. **Add to JASON Configuration**:
   ```json
   {
     "mobile_devices": [
       {
         "name": "John's iPhone",
         "mac": "XX:XX:XX:XX:XX:XX",
         "type": "iphone",
         "owner": "John",
         "capabilities": [
           "presence_detection",
           "notifications",
           "remote_control"
         ]
       }
     ]
   }
   ```

## 🏠 Integration Benefits

### Alexa Integration

- **Voice Coordination**: "Hey JASON, tell Alexa to play music"
- **Multi-Room Audio**: Coordinate announcements across devices
- **Skill Integration**: Create JASON Alexa skill
- **Backup Voice Control**: Redundant voice interfaces

### Mobile Integration

- **Presence Detection**: Know who's home based on WiFi
- **Notifications**: Send alerts to phones
- **Remote Control**: Control JASON via mobile app
- **Geofencing**: Trigger automations based on location

## 🎯 Common Issues & Solutions

### Alexa Devices Not Found

**Problem**: Alexa devices don't appear in scans
**Solutions**:

1. Check if devices are on guest network
2. Ensure devices are powered on and connected
3. Try saying "Alexa, what's my IP address?"
4. Check router's IoT device isolation settings

### Mobile Devices Not Found

**Problem**: Phones/tablets don't appear in discovery
**Solutions**:

1. Ensure devices are connected to WiFi (not cellular)
2. Check if "Private WiFi Address" is enabled (iOS)
3. Look for devices in router's "Offline Devices" list
4. Check if devices are in power saving mode

### IP Addresses Keep Changing

**Problem**: Device IPs change frequently
**Solutions**:

1. Set up DHCP reservations in router
2. Use MAC addresses for identification
3. Configure static IPs for important devices
4. Use hostname resolution instead of IPs

## 🚀 Next Steps

### Immediate Actions

1. **Router Check**: Access router admin panel now
2. **Document Devices**: Create list of all found devices
3. **Test Connectivity**: Verify device accessibility
4. **Update JASON Config**: Add devices to configuration

### Advanced Integration

1. **Alexa Skill Development**: Create custom JASON skill
2. **Mobile App**: Develop JASON mobile companion
3. **Presence Automation**: Set up location-based rules
4. **Network Monitoring**: Implement device health checks

### Voice Commands Ready After Integration

```
"Hey JASON, coordinate with all Alexa devices"
"Hey JASON, who's home right now?"
"Hey JASON, send notification to all phones"
"Hey JASON, enable away mode when no one's home"
"Hey JASON, show me all connected devices"
```

## 📊 Expected Results

After manual integration, your complete smart home ecosystem should include:

- **7 Discovered Devices**: Cameras, smart plug, router, extender
- **X Alexa Devices**: Voice assistants and smart speakers
- **X Mobile Devices**: Phones and tablets
- **X Additional Devices**: Computers, smart TVs, etc.

**Total Expected**: 15-25+ devices in a typical smart home

This comprehensive integration will give JASON complete visibility and control over your entire smart home ecosystem across the extended network!
