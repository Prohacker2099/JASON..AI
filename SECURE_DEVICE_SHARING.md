# 🚀 JASON Secure Device Discovery & Sharing

## Overview

JASON's secure device discovery and sharing system allows phones and other devices on your network to:

1. 🔍 **Discover each other securely**
   - Privacy-first device detection
   - Encrypted device registration
   - Permission-based visibility

2. 📁 **Share files safely**
   - End-to-end encrypted transfers
   - Multiple sharing methods (AirDrop, Nearby Share, WebRTC, etc.)
   - Progress tracking and resume support
   - Automatic best method selection

3. 🖥️ **Share screens securely**
   - WebRTC-based screen sharing
   - Encrypted video streams
   - Audio support
   - Low latency

## Security Features

- ✅ All communications encrypted (AES-256)
- ✅ Device authentication required
- ✅ Granular permission control
- ✅ No cloud dependencies
- ✅ Local network only by default
- ✅ Audit logging of all operations

## Getting Started

1. Install dependencies and start the server:

   ```bash
   ./start-secure-jason.sh
   ```

2. Open the web interface:

   ```
   http://localhost:3000
   ```

3. On mobile devices:
   - Connect to the same network
   - Open the web interface
   - Grant necessary permissions
   - Start sharing!

## Supported Features

### File Sharing

- ✅ Any file type supported
- ✅ Large file transfers
- ✅ Automatic resume on interruption
- ✅ Progress tracking
- ✅ Multiple simultaneous transfers

### Screen Sharing

- ✅ Full screen or window sharing
- ✅ Audio support
- ✅ Multiple viewers
- ✅ Quality adjustment
- ✅ Low latency optimization

## Privacy Settings

All features require explicit user consent:

1. Device Discovery: Accept registration
2. File Sharing: Enable per device
3. Screen Sharing: Enable per device

## Network Requirements

- Devices must be on the same local network
- Required ports:
  - 3000: Web interface
  - 8990: WebSocket server
  - Dynamic: WebRTC (if used)
