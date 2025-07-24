#!/usr/bin/env python3
"""
JASON Smart Home System Setup Script

This script sets up the complete JASON smart home system with:
- Universal Device Discovery & Seamless Control
- Voice AI with local and cloud integration
- Real device protocol support
- Security and encryption
"""

import os
import sys
import subprocess
import platform
import json
import asyncio
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("JasonSetup")

class JasonSetup:
    """JASON Smart Home System Setup"""
    
    def __init__(self):
        self.system = platform.system().lower()
        self.project_root = Path(__file__).parent
        self.config_dir = self.project_root / "config"
        self.logs_dir = self.project_root / "logs"
        self.temp_dir = self.project_root / "temp"
        
    def run_setup(self):
        """Run the complete setup process"""
        logger.info("🏠 Starting JASON Smart Home System Setup")
        logger.info("=" * 60)
        
        try:
            # Step 1: System requirements check
            self.check_system_requirements()
            
            # Step 2: Create directories
            self.create_directories()
            
            # Step 3: Install Python dependencies
            self.install_python_dependencies()
            
            # Step 4: Install Node.js dependencies
            self.install_nodejs_dependencies()
            
            # Step 5: Setup voice AI components
            self.setup_voice_ai()
            
            # Step 6: Setup device discovery
            self.setup_device_discovery()
            
            # Step 7: Generate configuration files
            self.generate_config_files()
            
            # Step 8: Setup security
            self.setup_security()
            
            # Step 9: Test installation
            self.test_installation()
            
            logger.info("\n🎉 JASON Smart Home System setup completed successfully!")
            logger.info("=" * 60)
            self.print_next_steps()
            
        except Exception as e:
            logger.error(f"Setup failed: {str(e)}")
            sys.exit(1)
            
    def check_system_requirements(self):
        """Check system requirements"""
        logger.info("📋 Checking system requirements...")
        
        # Check Python version
        python_version = sys.version_info
        if python_version < (3, 8):
            raise Exception("Python 3.8 or higher is required")
        logger.info(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        # Check Node.js
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                node_version = result.stdout.strip()
                logger.info(f"✅ Node.js {node_version}")
            else:
                raise Exception("Node.js is not installed")
        except FileNotFoundError:
            raise Exception("Node.js is not installed")
            
        # Check npm
        try:
            result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                npm_version = result.stdout.strip()
                logger.info(f"✅ npm {npm_version}")
            else:
                raise Exception("npm is not installed")
        except FileNotFoundError:
            raise Exception("npm is not installed")
            
        # Check system-specific requirements
        if self.system == "linux":
            self.check_linux_requirements()
        elif self.system == "darwin":
            self.check_macos_requirements()
        elif self.system == "windows":
            self.check_windows_requirements()
            
    def check_linux_requirements(self):
        """Check Linux-specific requirements"""
        logger.info("🐧 Checking Linux requirements...")
        
        # Check for audio libraries
        required_packages = [
            "portaudio19-dev",
            "python3-pyaudio",
            "espeak",
            "espeak-data",
            "libespeak1",
            "libespeak-dev",
            "ffmpeg"
        ]
        
        missing_packages = []
        for package in required_packages:
            result = subprocess.run(['dpkg', '-l', package], capture_output=True, text=True)
            if result.returncode != 0:
                missing_packages.append(package)
                
        if missing_packages:
            logger.warning(f"⚠️  Missing packages: {', '.join(missing_packages)}")
            logger.info("Installing missing packages...")
            try:
                subprocess.run(['sudo', 'apt-get', 'update'], check=True)
                subprocess.run(['sudo', 'apt-get', 'install', '-y'] + missing_packages, check=True)
                logger.info("✅ System packages installed")
            except subprocess.CalledProcessError:
                logger.warning("Could not install system packages automatically. Please install manually.")
                
    def check_macos_requirements(self):
        """Check macOS-specific requirements"""
        logger.info("🍎 Checking macOS requirements...")
        
        # Check for Homebrew
        try:
            subprocess.run(['brew', '--version'], capture_output=True, check=True)
            logger.info("✅ Homebrew installed")
        except (FileNotFoundError, subprocess.CalledProcessError):
            logger.warning("⚠️  Homebrew not found. Installing...")
            install_cmd = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
            subprocess.run(install_cmd, shell=True, check=True)
            
        # Install required packages
        required_packages = ["portaudio", "espeak", "ffmpeg"]
        for package in required_packages:
            try:
                subprocess.run(['brew', 'install', package], capture_output=True, check=True)
                logger.info(f"✅ {package} installed")
            except subprocess.CalledProcessError:
                logger.warning(f"Could not install {package}")
                
    def check_windows_requirements(self):
        """Check Windows-specific requirements"""
        logger.info("🪟 Checking Windows requirements...")
        logger.warning("Windows support is experimental. Some features may not work.")
        
    def create_directories(self):
        """Create necessary directories"""
        logger.info("📁 Creating directories...")
        
        directories = [
            self.config_dir,
            self.logs_dir,
            self.temp_dir,
            self.temp_dir / "audio",
            self.project_root / "data",
            self.project_root / "data" / "devices",
            self.project_root / "data" / "scenes",
            self.project_root / "data" / "automations"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.info(f"✅ Created {directory}")
            
    def install_python_dependencies(self):
        """Install Python dependencies"""
        logger.info("🐍 Installing Python dependencies...")
        
        try:
            # Upgrade pip first
            subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'], check=True)
            
            # Install requirements
            requirements_file = self.project_root / "requirements.txt"
            if requirements_file.exists():
                subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)], check=True)
                logger.info("✅ Python dependencies installed")
            else:
                logger.warning("requirements.txt not found")
                
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install Python dependencies: {e}")
            # Try installing core dependencies individually
            core_deps = [
                "aiohttp>=3.9.3",
                "pydantic>=2.6.1",
                "SpeechRecognition>=3.10.0",
                "pyttsx3>=2.90",
                "zeroconf>=0.112.0",
                "requests>=2.31.0",
                "websockets>=11.0.2",
                "cryptography>=41.0.0"
            ]
            
            for dep in core_deps:
                try:
                    subprocess.run([sys.executable, '-m', 'pip', 'install', dep], check=True)
                    logger.info(f"✅ Installed {dep}")
                except subprocess.CalledProcessError:
                    logger.warning(f"⚠️  Could not install {dep}")
                    
    def install_nodejs_dependencies(self):
        """Install Node.js dependencies"""
        logger.info("📦 Installing Node.js dependencies...")
        
        try:
            package_json = self.project_root / "package.json"
            if package_json.exists():
                subprocess.run(['npm', 'install'], cwd=self.project_root, check=True)
                logger.info("✅ Node.js dependencies installed")
            else:
                logger.warning("package.json not found")
                
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install Node.js dependencies: {e}")
            
    def setup_voice_ai(self):
        """Setup voice AI components"""
        logger.info("🎤 Setting up voice AI components...")
        
        try:
            # Test speech recognition
            import speech_recognition as sr
            recognizer = sr.Recognizer()
            logger.info("✅ Speech recognition available")
            
            # Test text-to-speech
            import pyttsx3
            engine = pyttsx3.init()
            logger.info("✅ Text-to-speech available")
            
            # Test microphone
            try:
                with sr.Microphone() as source:
                    recognizer.adjust_for_ambient_noise(source, duration=1)
                logger.info("✅ Microphone access available")
            except Exception as e:
                logger.warning(f"⚠️  Microphone access issue: {e}")
                
        except ImportError as e:
            logger.warning(f"⚠️  Voice AI component missing: {e}")
            
    def setup_device_discovery(self):
        """Setup device discovery components"""
        logger.info("🔍 Setting up device discovery...")
        
        try:
            # Test network discovery
            import zeroconf
            logger.info("✅ mDNS/Zeroconf discovery available")
            
            # Test HTTP client
            import aiohttp
            logger.info("✅ HTTP client available")
            
            # Test device protocol libraries
            optional_libs = [
                ("phue", "Philips Hue"),
                ("pywemo", "WeMo"),
                ("lifxlan", "LIFX"),
                ("zigpy", "Zigbee"),
                ("HAP-python", "HomeKit")
            ]
            
            for lib, name in optional_libs:
                try:
                    __import__(lib.replace("-", "_"))
                    logger.info(f"✅ {name} support available")
                except ImportError:
                    logger.warning(f"⚠️  {name} support not available (optional)")
                    
        except ImportError as e:
            logger.warning(f"⚠️  Device discovery component missing: {e}")
            
    def generate_config_files(self):
        """Generate configuration files"""
        logger.info("⚙️  Generating configuration files...")
        
        # Main configuration
        main_config = {
            "system": {
                "name": "JASON Smart Home",
                "version": "1.0.0",
                "debug": False,
                "log_level": "INFO"
            },
            "server": {
                "host": "0.0.0.0",
                "port": 3000,
                "ssl": False
            },
            "voice": {
                "enabled": True,
                "wake_words": ["jason", "hey jason", "ok jason"],
                "local_processing": True,
                "cloud_fallback": True,
                "providers": {
                    "openai": {
                        "enabled": False,
                        "api_key": ""
                    },
                    "google": {
                        "enabled": False,
                        "credentials_path": ""
                    },
                    "azure": {
                        "enabled": False,
                        "api_key": "",
                        "region": ""
                    }
                }
            },
            "discovery": {
                "protocols": {
                    "mdns": True,
                    "ssdp": True,
                    "hue_api": True,
                    "wemo_api": True,
                    "lifx_api": True,
                    "zigbee": False,
                    "zwave": False,
                    "matter": False,
                    "homekit": True
                },
                "scan_interval": 300,
                "timeout": 30
            },
            "security": {
                "encryption_enabled": True,
                "api_key_required": True,
                "rate_limiting": True
            }
        }
        
        config_file = self.config_dir / "jason.json"
        with open(config_file, 'w') as f:
            json.dump(main_config, f, indent=2)
        logger.info(f"✅ Main configuration: {config_file}")
        
        # Environment file
        env_file = self.project_root / ".env"
        if not env_file.exists():
            env_content = """# JASON Smart Home System Environment Variables

# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database (if using)
# DATABASE_URL=sqlite:///data/jason.db

# Voice AI API Keys (optional)
# OPENAI_API_KEY=your_openai_api_key_here
# GOOGLE_APPLICATION_CREDENTIALS=path/to/google/credentials.json
# AZURE_SPEECH_KEY=your_azure_speech_key_here
# AZURE_SPEECH_REGION=your_azure_region_here

# Device API Keys (optional)
# HUE_BRIDGE_IP=192.168.1.100
# HUE_API_KEY=your_hue_api_key_here

# Security
ENCRYPTION_KEY=generate_a_secure_key_here
JWT_SECRET=generate_a_jwt_secret_here

# Alexa Skill (optional)
# ALEXA_SKILL_ID=amzn1.ask.skill.your-skill-id
# ALEXA_CLIENT_ID=your_alexa_client_id
# ALEXA_CLIENT_SECRET=your_alexa_client_secret

# Google Assistant Action (optional)
# GOOGLE_PROJECT_ID=your_google_project_id
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
"""
            with open(env_file, 'w') as f:
                f.write(env_content)
            logger.info(f"✅ Environment file: {env_file}")
            
    def setup_security(self):
        """Setup security components"""
        logger.info("🔒 Setting up security...")
        
        try:
            import cryptography
            from cryptography.fernet import Fernet
            
            # Generate encryption key
            key = Fernet.generate_key()
            key_file = self.config_dir / "encryption.key"
            with open(key_file, 'wb') as f:
                f.write(key)
            logger.info(f"✅ Encryption key generated: {key_file}")
            
            # Set file permissions (Unix-like systems)
            if self.system in ['linux', 'darwin']:
                os.chmod(key_file, 0o600)
                
        except ImportError:
            logger.warning("⚠️  Cryptography library not available")
            
    def test_installation(self):
        """Test the installation"""
        logger.info("🧪 Testing installation...")
        
        try:
            # Test Python imports
            test_imports = [
                "server.services.deviceDiscovery",
                "server.services.voiceAI.voiceOrchestrator",
                "server.services.unifiedDeviceAbstraction"
            ]
            
            for module in test_imports:
                try:
                    __import__(module)
                    logger.info(f"✅ {module}")
                except ImportError as e:
                    logger.warning(f"⚠️  {module}: {e}")
                    
            # Test basic functionality
            logger.info("Running basic functionality tests...")
            
            # Test device discovery
            from server.services.deviceDiscovery import DeviceDiscovery
            discovery = DeviceDiscovery()
            logger.info("✅ Device discovery initialized")
            
            # Test voice orchestrator
            from server.services.voiceAI.voiceOrchestrator import voice_orchestrator
            status = voice_orchestrator.get_voice_status()
            logger.info("✅ Voice orchestrator initialized")
            
        except Exception as e:
            logger.warning(f"⚠️  Test failed: {e}")
            
    def print_next_steps(self):
        """Print next steps for the user"""
        print("\n" + "=" * 60)
        print("🎉 JASON Smart Home System is ready!")
        print("=" * 60)
        print("\n📋 Next Steps:")
        print("\n1. 🔧 Configure your settings:")
        print(f"   Edit: {self.config_dir}/jason.json")
        print(f"   Edit: {self.project_root}/.env")
        
        print("\n2. 🎤 Setup Voice AI (optional):")
        print("   - Add OpenAI API key for advanced AI features")
        print("   - Add Google Cloud credentials for cloud speech")
        print("   - Add Azure Speech credentials for cloud speech")
        
        print("\n3. 🏠 Setup Device Integrations:")
        print("   - Configure Philips Hue bridge IP and API key")
        print("   - Connect Zigbee/Z-Wave coordinators (if available)")
        print("   - Setup Alexa Skill and Google Assistant Action")
        
        print("\n4. 🚀 Start JASON:")
        print("   npm start")
        print("   # or")
        print("   python3 -m server.main")
        
        print("\n5. 🌐 Access the dashboard:")
        print("   http://localhost:3000")
        
        print("\n6. 🎙️  Try voice commands:")
        print('   Say: "Hey JASON, turn on the lights"')
        print('   Say: "JASON, what\'s the temperature?"')
        
        print("\n📚 Documentation:")
        print("   README.md - Getting started guide")
        print("   docs/ - Detailed documentation")
        
        print("\n🆘 Need help?")
        print("   Check logs in: logs/")
        print("   Run tests: python3 -m pytest")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    setup = JasonSetup()
    setup.run_setup()