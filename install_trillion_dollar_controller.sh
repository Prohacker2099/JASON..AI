#!/bin/bash

# JASON Trillion Dollar Device Controller Installation Script
# This script sets up the ultimate device controller that can control
# every device on WiFi networks including phones, Alexa, Google, computers, and more.

set -e

echo "🌟 JASON - Trillion Dollar Device Controller Installation"
echo "========================================================"
echo ""
echo "This will install the most advanced device controller ever created!"
echo "It can control:"
echo "📱 Phones (iOS/Android) - Remote control, notifications, apps"
echo "🗣️  Alexa/Google - Voice commands, music, smart home control"
echo "💻 Computers - Remote desktop, file access, system control"
echo "📺 Smart TVs - Channel control, volume, apps, casting"
echo "🏠 IoT Devices - Lights, switches, sensors, cameras"
echo "🌐 Network Equipment - Routers, extenders, access points"
echo "🎮 Gaming Consoles - Power, media, game launching"
echo "📡 Streaming Devices - Roku, Chromecast, Apple TV, Fire TV"
echo "🏠 Smart Appliances - Refrigerators, washing machines, thermostats"
echo "🔒 Security Systems - Cameras, alarms, door locks"
echo "🔊 Audio Systems - Speakers, soundbars, receivers"
echo "🔮 Matter Devices - Future-proof unified control"
echo "🌍 ANY device with an IP address"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Node.js if not present
install_nodejs() {
    echo "📦 Installing Node.js..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            echo "✅ Node.js $NODE_VERSION is already installed"
            return
        else
            echo "⚠️  Node.js version is too old. Installing newer version..."
        fi
    fi
    
    # Install Node.js using NodeSource repository
    if command_exists curl; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command_exists wget; then
        wget -qO- https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "❌ Neither curl nor wget is available. Please install Node.js manually."
        exit 1
    fi
}

# Function to install Python if not present
install_python() {
    echo "🐍 Checking Python installation..."
    
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
        echo "✅ Python $PYTHON_VERSION is installed"
    else
        echo "📦 Installing Python 3..."
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip
    fi
}

# Function to install system dependencies
install_system_deps() {
    echo "🔧 Installing system dependencies..."
    
    # Update package list
    sudo apt-get update
    
    # Install required packages
    sudo apt-get install -y \
        build-essential \
        git \
        curl \
        wget \
        nmap \
        net-tools \
        iputils-ping \
        dnsutils \
        avahi-utils \
        bluetooth \
        bluez \
        libbluetooth-dev \
        libavahi-compat-libdnssd-dev \
        python3-dev \
        python3-pip
    
    echo "✅ System dependencies installed"
}

# Function to install Python packages
install_python_deps() {
    echo "🐍 Installing Python dependencies..."
    
    pip3 install --user \
        requests \
        rich \
        asyncio \
        websockets \
        aiohttp \
        python-nmap \
        scapy \
        netifaces \
        psutil
    
    echo "✅ Python dependencies installed"
}

# Function to install Node.js dependencies
install_node_deps() {
    echo "📦 Installing Node.js dependencies..."
    
    # Install main dependencies
    npm install
    
    # Install server dependencies
    cd server
    npm install
    cd ..
    
    echo "✅ Node.js dependencies installed"
}

# Function to set up configuration
setup_config() {
    echo "⚙️  Setting up configuration..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "📝 Created .env configuration file"
        echo "You can edit .env to customize settings"
    fi
    
    # Set up database
    echo "🗄️  Setting up database..."
    npm run setup-db
    
    echo "✅ Configuration complete"
}

# Function to test installation
test_installation() {
    echo "🧪 Testing installation..."
    
    # Test Node.js
    if command_exists node; then
        echo "✅ Node.js: $(node --version)"
    else
        echo "❌ Node.js not found"
        return 1
    fi
    
    # Test Python
    if command_exists python3; then
        echo "✅ Python: $(python3 --version)"
    else
        echo "❌ Python not found"
        return 1
    fi
    
    # Test npm packages
    if [ -d node_modules ]; then
        echo "✅ Node.js packages installed"
    else
        echo "❌ Node.js packages not found"
        return 1
    fi
    
    echo "✅ Installation test passed"
}

# Function to display next steps
show_next_steps() {
    echo ""
    echo "🎉 INSTALLATION COMPLETE!"
    echo "========================"
    echo ""
    echo "🚀 To start the Trillion Dollar Controller:"
    echo "   npm run dev"
    echo ""
    echo "🌐 The server will be available at:"
    echo "   http://localhost:3000"
    echo ""
    echo "🎮 To run the interactive demo:"
    echo "   python3 demo/trillion_dollar_demo.py"
    echo ""
    echo "📚 API Documentation:"
    echo "   http://localhost:3000/api/trillion-dollar/status"
    echo ""
    echo "🔧 Configuration file:"
    echo "   .env (edit this file to customize settings)"
    echo ""
    echo "📖 Full documentation:"
    echo "   TRILLION_DOLLAR_CONTROLLER.md"
    echo ""
    echo "⚠️  IMPORTANT SECURITY NOTES:"
    echo "   - This controller has powerful capabilities"
    echo "   - Only use on networks you own or have permission to control"
    echo "   - Review security settings in .env file"
    echo "   - Consider enabling authentication for production use"
    echo ""
    echo "🌟 Welcome to the future of device control!"
    echo "🎯 You can now control EVERY device on your WiFi network!"
}

# Main installation process
main() {
    echo "🚀 Starting installation process..."
    echo ""
    
    # Check operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "🐧 Detected Linux system"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🍎 Detected macOS system"
        echo "⚠️  Some features may require additional setup on macOS"
    else
        echo "⚠️  Unsupported operating system: $OSTYPE"
        echo "This script is designed for Linux systems"
        echo "You may need to install dependencies manually"
    fi
    
    echo ""
    
    # Install system dependencies (Linux only)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        install_system_deps
    fi
    
    # Install Node.js
    install_nodejs
    
    # Install Python
    install_python
    
    # Install Python dependencies
    install_python_deps
    
    # Install Node.js dependencies
    install_node_deps
    
    # Set up configuration
    setup_config
    
    # Test installation
    test_installation
    
    # Show next steps
    show_next_steps
    
    echo ""
    echo "🎊 Installation completed successfully!"
    echo "🌟 JASON's Trillion Dollar Controller is ready to dominate your network!"
}

# Check if user wants to proceed
echo "Do you want to proceed with the installation? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    main
else
    echo "Installation cancelled."
    exit 0
fi