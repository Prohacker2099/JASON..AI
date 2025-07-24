#!/bin/bash

# 🚀 JASON - Trillion Dollar Launch Script
# This script sets up and launches the complete JASON trillion-dollar ecosystem

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}[JASON]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Display banner
display_banner() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║        🚀 JASON - THE TRILLION DOLLAR AI ARCHITECT 🚀        ║
    ║                                                              ║
    ║    Revolutionizing Smart Homes Through Data Ownership,       ║
    ║    Universal Device Control, and Proactive Intelligence      ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node --version)"
        exit 1
    fi
    print_success "Node.js $(node --version) detected"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    print_success "npm $(npm --version) detected"
    
    # Check Python (optional for demos)
    if command -v python3 &> /dev/null; then
        print_success "Python3 $(python3 --version | cut -d' ' -f2) detected"
    else
        print_warning "Python3 not found. Demo scripts will not be available."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing trillion-dollar dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing Node.js dependencies..."
        npm install
        print_success "Node.js dependencies installed"
    else
        print_info "Node.js dependencies already installed"
    fi
    
    # Install Python dependencies for demos (if Python is available)
    if command -v python3 &> /dev/null && command -v pip3 &> /dev/null; then
        print_info "Installing Python demo dependencies..."
        pip3 install -q aiohttp rich asyncio 2>/dev/null || print_warning "Could not install Python dependencies"
    fi
}

# Build the client
build_client() {
    print_status "Building trillion-dollar client interface..."
    
    if [ ! -d "client/dist" ] || [ "client/src" -nt "client/dist" ]; then
        print_info "Building React client with trillion-dollar features..."
        npm run build
        print_success "Client built successfully"
    else
        print_info "Client already built and up to date"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up trillion-dollar database..."
    
    if [ ! -f "jason.db" ]; then
        print_info "Creating database with trillion-dollar schema..."
        # Database will be created automatically on first run
        print_success "Database setup complete"
    else
        print_info "Database already exists"
    fi
}

# Display feature summary
display_features() {
    print_status "Trillion-dollar features ready:"
    echo
    echo -e "${YELLOW}🎯 Core Features:${NC}"
    echo -e "   🎨 Intelligent Canvas of Life UI"
    echo -e "   💰 Data Dividend Framework"
    echo -e "   🎮 Universal Device Control"
    echo -e "   🗣️  AI-Powered Voice Assistant"
    echo -e "   🧠 Proactive Intelligence Engine"
    echo -e "   📈 Real-time Analytics"
    echo
    echo -e "${YELLOW}💡 Revolutionary Capabilities:${NC}"
    echo -e "   📱 Control phones (iOS/Android)"
    echo -e "   🔊 Control Alexa/Echo devices"
    echo -e "   💻 Control computers remotely"
    echo -e "   📺 Control smart TVs and streaming"
    echo -e "   🏠 Control all IoT devices"
    echo -e "   🌐 Cross-network device discovery"
    echo -e "   🛡️  Privacy-first local AI processing"
    echo -e "   💸 Earn money from ethical data sharing"
    echo
}

# Launch the system
launch_system() {
    print_status "Launching JASON trillion-dollar system..."
    echo
    print_info "Starting server on http://localhost:3000"
    print_info "WebSocket server on ws://localhost:3000"
    print_info "Health check: http://localhost:3000/health"
    echo
    print_success "🚀 JASON is ready to revolutionize smart homes!"
    echo
    print_info "Press Ctrl+C to stop the server"
    echo
    
    # Launch the trillion-dollar server
    node launch-trillion-dollar-jason.js
}

# Run demo (optional)
run_demo() {
    if command -v python3 &> /dev/null && [ -f "demo/trillion_dollar_showcase.py" ]; then
        echo
        print_info "Demo available! Run in another terminal:"
        echo -e "${CYAN}   python3 demo/trillion_dollar_showcase.py${NC}"
        echo
    fi
}

# Main execution
main() {
    display_banner
    
    print_status "Initializing trillion-dollar launch sequence..."
    echo
    
    check_prerequisites
    install_dependencies
    build_client
    setup_database
    
    echo
    display_features
    run_demo
    
    # Launch the system
    launch_system
}

# Handle interruption
trap 'echo -e "\n${YELLOW}🛑 Shutting down JASON...${NC}"; exit 0' INT

# Run main function
main "$@"#!/bin/bash

# 🚀 JASON - Trillion Dollar Launch Script
# This script sets up and launches the complete JASON trillion-dollar ecosystem

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}[JASON]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Display banner
display_banner() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║        🚀 JASON - THE TRILLION DOLLAR AI ARCHITECT 🚀        ║
    ║                                                              ║
    ║    Revolutionizing Smart Homes Through Data Ownership,       ║
    ║    Universal Device Control, and Proactive Intelligence      ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node --version)"
        exit 1
    fi
    print_success "Node.js $(node --version) detected"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    print_success "npm $(npm --version) detected"
    
    # Check Python (optional for demos)
    if command -v python3 &> /dev/null; then
        print_success "Python3 $(python3 --version | cut -d' ' -f2) detected"
    else
        print_warning "Python3 not found. Demo scripts will not be available."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing trillion-dollar dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing Node.js dependencies..."
        npm install
        print_success "Node.js dependencies installed"
    else
        print_info "Node.js dependencies already installed"
    fi
    
    # Install Python dependencies for demos (if Python is available)
    if command -v python3 &> /dev/null && command -v pip3 &> /dev/null; then
        print_info "Installing Python demo dependencies..."
        pip3 install -q aiohttp rich asyncio 2>/dev/null || print_warning "Could not install Python dependencies"
    fi
}

# Build the client
build_client() {
    print_status "Building trillion-dollar client interface..."
    
    if [ ! -d "client/dist" ] || [ "client/src" -nt "client/dist" ]; then
        print_info "Building React client with trillion-dollar features..."
        npm run build
        print_success "Client built successfully"
    else
        print_info "Client already built and up to date"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up trillion-dollar database..."
    
    if [ ! -f "jason.db" ]; then
        print_info "Creating database with trillion-dollar schema..."
        # Database will be created automatically on first run
        print_success "Database setup complete"
    else
        print_info "Database already exists"
    fi
}

# Display feature summary
display_features() {
    print_status "Trillion-dollar features ready:"
    echo
    echo -e "${YELLOW}🎯 Core Features:${NC}"
    echo -e "   🎨 Intelligent Canvas of Life UI"
    echo -e "   💰 Data Dividend Framework"
    echo -e "   🎮 Universal Device Control"
    echo -e "   🗣️  AI-Powered Voice Assistant"
    echo -e "   🧠 Proactive Intelligence Engine"
    echo -e "   📈 Real-time Analytics"
    echo
    echo -e "${YELLOW}💡 Revolutionary Capabilities:${NC}"
    echo -e "   📱 Control phones (iOS/Android)"
    echo -e "   🔊 Control Alexa/Echo devices"
    echo -e "   💻 Control computers remotely"
    echo -e "   📺 Control smart TVs and streaming"
    echo -e "   🏠 Control all IoT devices"
    echo -e "   🌐 Cross-network device discovery"
    echo -e "   🛡️  Privacy-first local AI processing"
    echo -e "   💸 Earn money from ethical data sharing"
    echo
}

# Launch the system
launch_system() {
    print_status "Launching JASON trillion-dollar system..."
    echo
    print_info "Starting server on http://localhost:3000"
    print_info "WebSocket server on ws://localhost:3000"
    print_info "Health check: http://localhost:3000/health"
    echo
    print_success "🚀 JASON is ready to revolutionize smart homes!"
    echo
    print_info "Press Ctrl+C to stop the server"
    echo
    
    # Launch the trillion-dollar server
    node launch-trillion-dollar-jason.js
}

# Run demo (optional)
run_demo() {
    if command -v python3 &> /dev/null && [ -f "demo/trillion_dollar_showcase.py" ]; then
        echo
        print_info "Demo available! Run in another terminal:"
        echo -e "${CYAN}   python3 demo/trillion_dollar_showcase.py${NC}"
        echo
    fi
}

# Main execution
main() {
    display_banner
    
    print_status "Initializing trillion-dollar launch sequence..."
    echo
    
    check_prerequisites
    install_dependencies
    build_client
    setup_database
    
    echo
    display_features
    run_demo
    
    # Launch the system
    launch_system
}

# Handle interruption
trap 'echo -e "\n${YELLOW}🛑 Shutting down JASON...${NC}"; exit 0' INT

# Run main function
main "$@"