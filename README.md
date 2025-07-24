# JASON - The Omnipotent AI Architect

JASON (Just Another Smart Operating Network) is a universal device control system with voice assistant and local AI capabilities.

## Features

- **Universal Device Control**: Control all your smart home devices, computers, phones, and more from a single interface
- **Voice Assistant**: Natural language interface with "Hey JASON" wake word
- **Local AI Processing**: Privacy-focused AI that runs locally on your device
- **Multi-Device Support**: Connect and control devices across different platforms and protocols
- **Phone Control System**: Comprehensive phone management for Android and iOS devices

## Phone Control System

JASON includes a production-ready phone control system that can:

- **Discover Phones**: Automatically detect phones connected via USB, network, or Bluetooth
- **Send Notifications**: Send custom notifications to phones
- **Control Settings**: Manage phone settings like Wi-Fi, Bluetooth, brightness, and more
- **Launch Apps**: Start applications on connected phones
- **Take Screenshots**: Capture and display phone screens remotely

### Supported Connection Methods

- **USB Connection**: Direct control via USB for both Android (ADB) and iOS (libimobiledevice)
- **Network Connection**: Discover and control phones on the local network
- **Bluetooth Connection**: Detect phones connected via Bluetooth

### Platform Support

- **Android**: Full support for notifications, settings control, app launching, and screenshots
- **iOS**: Support for notifications, app launching, and screenshots (some features require additional setup)

## Installation

1. Clone the repository:

```
git clone https://github.com/yourusername/JASON_TheOmnipotentAIArchitect.git
cd JASON_TheOmnipotentAIArchitect
```

2. Install dependencies:

```
npm run install:all
```

3. Install required tools for phone control:
   - For Android: Install ADB (Android Debug Bridge)
   - For iOS: Install libimobiledevice

4. Start the development server:

```
npm run dev:all
```

## Production Deployment

To build and deploy JASON for production:

1. Build the client and server:

```
npm run build:all
```

2. Start the production server:

```
npm start
```

3. Alternatively, use the deployment script:

```
./deploy-production.sh
```

### Using Process Manager (PM2)

For production environments, it's recommended to use PM2:

1. Install PM2 globally:

```
npm install -g pm2
```

2. Start JASON with PM2:

```
pm2 start production-deploy.js
```

3. Monitor the application:

```
pm2 monit
```

## Usage

### Phone Control

1. Connect your phone via USB, ensure it's on the same network, or pair it via Bluetooth
2. Navigate to the Phone Control section in the JASON interface
3. Select your phone from the discovered devices list
4. Use the various tabs to control your phone:
   - **Info**: View detailed information about your phone
   - **Notifications**: Send custom notifications
   - **Settings**: Control phone settings
   - **Apps**: Launch applications
   - **Screenshot**: Take and view screenshots

### API Endpoints

The phone control system exposes the following API endpoints:

- `GET /api/phones`: Get all discovered phones
- `GET /api/phones/:id`: Get detailed information about a specific phone
- `POST /api/phones/:id/notification`: Send a notification to a phone
- `POST /api/phones/:id/settings`: Control phone settings
- `POST /api/phones/:id/app`: Launch an app on a phone
- `GET /api/phones/:id/screenshot`: Take a screenshot from a phone

## Development

### Project Structure

```
JASON_TheOmnipotentAIArchitect/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/       # API services
│   │   └── ...
├── server/                 # Node.js backend
│   ├── controllers/        # Business logic
│   ├── routes/             # API routes
│   └── ...
├── test/                   # Test files
└── ...
```

### Adding New Features

1. Create a new controller in `server/controllers/`
2. Add routes in `server/routes/`
3. Create a service in `client/src/services/`
4. Add UI components in `client/src/components/`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
