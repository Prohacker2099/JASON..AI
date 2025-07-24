# Voice Assistant Integration Without Login Credentials

This guide explains how JASON integrates with major voice assistants like Amazon Alexa and Google Assistant without requiring you to share your login credentials with JASON.

## Overview

JASON offers three privacy-preserving approaches to voice assistant integration:

1. **Local Protocol Emulation** - Emulates protocols that voice assistants can discover directly on your local network
2. **Matter Protocol Bridge** - Uses the open Matter standard for local control without cloud dependencies
3. **Token-Based Integration** - Secure, minimal cloud connector that bridges voice assistants to your local JASON instance

## 1. Local Protocol Emulation (Hue Bridge Emulation)

This approach allows JASON to appear as a Philips Hue Bridge on your local network, which voice assistants can discover and control directly without any cloud accounts.

### How It Works

1. JASON runs a service that emulates the Philips Hue Bridge API and discovery protocols (SSDP/UPnP)
2. Voice assistants like Alexa and Google Assistant discover this "bridge" on your local network
3. When you say "Alexa, turn on the living room light," Alexa sends commands directly to JASON over your local network
4. JASON translates these commands to control your actual devices

### Setup Instructions

1. Enable Hue Emulation in JASON settings: `Settings > Voice Assistant Integration > Hue Emulation`
2. In your Alexa or Google Home app:
   - Select "Add Device" or "Set up device"
   - Choose "Philips Hue" as the device type
   - Follow the instructions to discover the JASON Hue Bridge
   - Your JASON-controlled devices will appear as Hue devices

### Benefits

- **No Cloud Required**: All communication happens locally on your network
- **No Account Linking**: No need to link accounts or provide credentials
- **Wide Compatibility**: Works with most voice assistants that support Hue
- **Privacy-First**: Your commands never leave your local network

### Limitations

- Limited to device types that Hue supports (mainly lights, switches)
- Some advanced features may not be available

## 2. Matter Protocol Bridge

Matter is a new open standard designed for local control and interoperability across smart home ecosystems. JASON implements a Matter bridge to expose your devices to Matter-compatible voice assistants.

### How It Works

1. JASON runs a Matter commissioner/bridge on your local network
2. Voice assistants that support Matter can discover and communicate with JASON using the Matter protocol
3. Commands are processed locally without cloud dependencies
4. JASON translates Matter commands to control your actual devices

### Setup Instructions

1. Enable Matter Bridge in JASON settings: `Settings > Voice Assistant Integration > Matter Bridge`
2. Use the generated QR code or pairing code to add JASON to your Matter-compatible app:
   - Open your Matter-compatible app (Alexa, Google Home, Apple Home)
   - Select "Add Device" or "Set up device"
   - Choose "Matter" as the device type
   - Scan the QR code or enter the pairing code manually
   - Follow the instructions to complete setup

### Benefits

- **Future-Proof**: Matter is the new industry standard for smart home interoperability
- **Multi-Platform**: Works across Amazon, Google, Apple, and other ecosystems
- **Local Control**: All communication happens on your local network
- **Enhanced Security**: Uses modern security protocols

### Limitations

- Requires Matter support in your voice assistant (rolling out throughout 2023-2024)
- Some older voice assistant devices may not support Matter

## 3. Token-Based Integration

For scenarios where local discovery isn't possible or for advanced features, JASON offers a token-based integration that maintains privacy while enabling cloud-to-local communication.

### How It Works

1. You generate a secure token in JASON (not your voice assistant credentials)
2. This token is used to establish a secure connection between the JASON skill/action in the cloud and your local JASON instance
3. When you issue a voice command, it goes to the voice assistant cloud, then to the JASON skill/action
4. The JASON skill/action uses your token to securely forward the command to your local JASON instance
5. Your local JASON processes the command and controls your devices

### Setup Instructions

1. Generate a token in JASON: `Settings > Voice Assistant Integration > Token-Based > Generate Token`
2. Install the JASON skill (Alexa) or action (Google Assistant) from their respective stores
3. During setup, enter the token when prompted to link your JASON instance
4. Your voice assistant will now be able to control your JASON devices

### Benefits

- **No Credential Sharing**: JASON never sees your voice assistant login information
- **Revocable Access**: You can revoke the token at any time
- **Enhanced Features**: Enables features that may not be possible with local-only approaches
- **Minimal Cloud Footprint**: The cloud component is just a secure relay, not storing your data

### Limitations

- Requires a small cloud component (the skill/action)
- Internet connectivity required for operation

## Choosing the Right Approach

For maximum privacy and local control:

1. **Hue Emulation** is the simplest approach for basic device control
2. **Matter Bridge** is the most future-proof and interoperable solution
3. **Token-Based** provides the most features while still preserving privacy

You can enable multiple approaches simultaneously for maximum compatibility across your devices.

## Technical Details

### Hue Emulation

JASON's Hue emulation implements:

- SSDP/UPnP discovery protocols
- Hue API v1 endpoints for device control
- Automatic mapping of JASON devices to Hue-compatible device types

### Matter Bridge

JASON's Matter implementation includes:

- Matter commissioner/bridge functionality
- Device type mapping to Matter device types
- Local control via Matter protocol
- Secure commissioning process

### Token-Based Integration

The token-based approach uses:

- Secure WebSocket connections for real-time communication
- End-to-end encryption for commands
- Automatic token refresh and management
- Minimal cloud relay that doesn't store your data

## Troubleshooting

### Hue Emulation Issues

- Ensure your voice assistant device is on the same network as JASON
- Check that UPnP/SSDP discovery is enabled on your network
- Restart JASON's Hue emulation service if devices aren't discovered

### Matter Bridge Issues

- Verify your voice assistant supports Matter
- Ensure your Matter controller device (phone, hub) is on the same network as JASON
- Try regenerating the pairing code if commissioning fails

### Token-Based Issues

- Regenerate your token if you experience connection issues
- Ensure your JASON instance has internet connectivity
- Check that your router allows outbound WebSocket connections

## Security Considerations

All three integration approaches prioritize your privacy and security:

- **Local Control**: Whenever possible, commands stay on your local network
- **No Credential Storage**: JASON never stores your voice assistant credentials
- **Encryption**: All communication is encrypted
- **Minimal Data**: JASON only processes the commands needed to control your devices
- **User Control**: You can disable any integration method at any time
