#!/bin/zsh

echo "🔧 Setting up JASON phone control prerequisites..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Android platform tools (adb)
if ! command -v adb &> /dev/null; then
    echo "📱 Installing Android platform tools..."
    brew install android-platform-tools
fi

# Install libimobiledevice for iOS device support
if ! command -v idevice_id &> /dev/null; then
    echo "📱 Installing libimobiledevice for iOS support..."
    brew install libimobiledevice
fi

# Install usbmuxd
if ! brew list usbmuxd &> /dev/null; then
    echo "Installing usbmuxd..."
    brew install usbmuxd
fi

echo "✅ Phone control prerequisites installed successfully!"
echo ""
echo "To enable Android debugging:"
echo "1. Go to Settings > About Phone"
echo "2. Tap Build Number 7 times to enable Developer Options"
echo "3. Go to Settings > Developer Options"
echo "4. Enable USB Debugging"
echo "5. Connect your phone and accept the debugging prompt"
echo ""
echo "To enable iOS device control:"
echo "1. Connect your iOS device via USB"
echo "2. Trust this computer when prompted on your device"
echo "3. Enter your device passcode to confirm"
