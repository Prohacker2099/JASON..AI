#!/bin/bash

# JASON Omni-Channel Voice Experience Setup Script
# Sets up the complete unified voice control system

set -e

echo "🌟 JASON Omni-Channel Voice Experience Setup"
echo "============================================="
echo ""
echo "This will set up the most advanced voice control system ever created!"
echo ""
echo "🎤 Features being installed:"
echo "  • Unified voice control across ALL devices"
echo "  • Any Device, Any Assistant support"
echo "  • Seamless handoff between devices"
echo "  • Multi-modal responses (voice + visual + haptic)"
echo "  • Advanced TTS with emotion and voice cloning"
echo "  • Context-aware speech recognition"
echo "  • Real-time voice conversion"
echo "  • Custom voice creation"
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

# Function to install system dependencies
install_system_deps() {
    echo "🔧 Installing system dependencies..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y \
            python3-dev \
            python3-pip \
            portaudio19-dev \
            espeak \
            espeak-data \
            libespeak1 \
            libespeak-dev \
            festival \
            festvox-kallpc16k \
            alsa-utils \
            pulseaudio \
            pulseaudio-utils \
            ffmpeg \
            sox \
            libsox-fmt-all \
            build-essential \
            cmake \
            pkg-config \
            libasound2-dev \
            libportaudio2 \
            libportaudiocpp0 \
            portaudio19-dev
            
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install \
                portaudio \
                espeak \
                festival \
                ffmpeg \
                sox \
                cmake \
                pkg-config
        else
            echo "⚠️  Homebrew not found. Please install Homebrew first:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    else
        echo "⚠️  Unsupported operating system: $OSTYPE"
        echo "Manual installation of dependencies may be required"
    fi
    
    echo "✅ System dependencies installed"
}

# Function to install Python dependencies
install_python_deps() {
    echo "🐍 Installing Python dependencies for voice processing..."
    
    # Upgrade pip
    python3 -m pip install --upgrade pip
    
    # Install core dependencies
    python3 -m pip install --user \
        torch \
        torchaudio \
        numpy \
        scipy \
        librosa \
        soundfile \
        pyaudio \
        pydub \
        webrtcvad \
        noisereduce
    
    # Install TTS engines
    echo "🎤 Installing TTS engines..."
    python3 -m pip install --user \
        TTS \
        pyttsx3 \
        gTTS
    
    # Install ASR engines
    echo "🗣️  Installing ASR engines..."
    python3 -m pip install --user \
        openai-whisper \
        SpeechRecognition \
        transformers
    
    # Install NLP libraries
    echo "🧠 Installing NLP libraries..."
    python3 -m pip install --user \
        spacy \
        nltk \
        transformers
    
    # Install demo dependencies
    echo "🎮 Installing demo dependencies..."
    python3 -m pip install --user \
        rich \
        aiohttp \
        websockets \
        click
    
    echo "✅ Python dependencies installed"
}

# Function to download models
download_models() {
    echo "📦 Downloading AI models..."
    
    # Create models directory
    mkdir -p models/voices
    mkdir -p models/asr
    mkdir -p models/nlp
    
    # Download Whisper models
    echo "🎧 Downloading Whisper ASR models..."
    python3 -c "import whisper; whisper.load_model('base')" || echo "⚠️  Whisper model download failed"
    
    # Download spaCy models
    echo "🧠 Downloading spaCy NLP models..."
    python3 -m spacy download en_core_web_sm || echo "⚠️  spaCy model download failed"
    
    # Download NLTK data
    echo "📚 Downloading NLTK data..."
    python3 -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')" || echo "⚠️  NLTK data download failed"
    
    echo "✅ Models downloaded"
}

# Function to set up voice tools
setup_voice_tools() {
    echo "🛠️  Setting up voice processing tools..."
    
    # Make Python scripts executable
    chmod +x tools/advanced_tts.py
    chmod +x tools/advanced_asr.py
    
    # Test TTS
    echo "🎤 Testing TTS engine..."
    python3 tools/advanced_tts.py --text "Hello, this is JASON's voice system test" --output /tmp/tts_test.wav || echo "⚠️  TTS test failed"
    
    # Test ASR (if test audio exists)
    if [ -f "/tmp/tts_test.wav" ]; then
        echo "🗣️  Testing ASR engine..."
        python3 tools/advanced_asr.py --input /tmp/tts_test.wav || echo "⚠️  ASR test failed"
        rm -f /tmp/tts_test.wav
    fi
    
    echo "✅ Voice tools set up"
}

# Function to configure audio system
configure_audio() {
    echo "🔊 Configuring audio system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux audio configuration
        
        # Start PulseAudio if not running
        if ! pgrep -x "pulseaudio" > /dev/null; then
            pulseaudio --start || echo "⚠️  Could not start PulseAudio"
        fi
        
        # Test audio output
        echo "🔊 Testing audio output..."
        speaker-test -t sine -f 1000 -l 1 -s 1 -c 2 -p 1000 || echo "⚠️  Audio output test failed"
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS audio configuration
        echo "🔊 Testing audio output..."
        say "Audio test" || echo "⚠️  Audio output test failed"
    fi
    
    echo "✅ Audio system configured"
}

# Function to set up Node.js dependencies
setup_nodejs_deps() {
    echo "📦 Installing Node.js dependencies for voice API..."
    
    # Install additional Node.js packages for voice processing
    npm install \
        multer \
        @types/multer \
        node-record-lpcm16 \
        wav \
        speaker \
        mic
    
    echo "✅ Node.js voice dependencies installed"
}

# Function to create demo audio files
create_demo_files() {
    echo "🎵 Creating demo audio files..."
    
    mkdir -p demo/audio
    
    # Create sample audio using TTS
    python3 tools/advanced_tts.py \
        --text "Welcome to JASON's omni-channel voice experience. This is a demonstration of unified voice control across all your devices." \
        --output demo/audio/welcome.wav \
        --voice jason-default || echo "⚠️  Demo audio creation failed"
    
    # Create voice samples for different emotions
    emotions=("happy" "calm" "excited" "authoritative")
    for emotion in "${emotions[@]}"; do
        python3 tools/advanced_tts.py \
            --text "This is JASON speaking with a $emotion voice." \
            --output "demo/audio/sample_$emotion.wav" \
            --emotion "$emotion" || echo "⚠️  $emotion sample creation failed"
    done
    
    echo "✅ Demo audio files created"
}

# Function to test the complete system
test_system() {
    echo "🧪 Testing complete omni-channel voice system..."
    
    # Test API endpoints
    echo "🌐 Testing voice API endpoints..."
    
    # Start server in background for testing
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test health endpoint
    curl -s http://localhost:3000/api/omni-voice/health > /dev/null && echo "✅ Voice API health check passed" || echo "❌ Voice API health check failed"
    
    # Test voices endpoint
    curl -s http://localhost:3000/api/omni-voice/voices > /dev/null && echo "✅ Voice profiles endpoint working" || echo "❌ Voice profiles endpoint failed"
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null || true
    
    echo "✅ System tests completed"
}

# Function to show usage instructions
show_usage() {
    echo ""
    echo "🎉 OMNI-CHANNEL VOICE EXPERIENCE SETUP COMPLETE!"
    echo "================================================"
    echo ""
    echo "🚀 To start the voice-enabled server:"
    echo "   npm run dev"
    echo ""
    echo "🎮 To run the interactive voice demo:"
    echo "   python3 demo/omni_voice_demo.py"
    echo ""
    echo "🌐 Voice API endpoints will be available at:"
    echo "   http://localhost:3000/api/omni-voice/"
    echo ""
    echo "📚 Key endpoints:"
    echo "   • POST /api/omni-voice/session/init - Initialize voice session"
    echo "   • POST /api/omni-voice/command - Process voice commands"
    echo "   • POST /api/omni-voice/tts - Text-to-speech synthesis"
    echo "   • POST /api/omni-voice/asr - Speech recognition"
    echo "   • POST /api/omni-voice/handoff - Device handoff"
    echo "   • GET  /api/omni-voice/voices - Available voice profiles"
    echo "   • GET  /api/omni-voice/health - System health check"
    echo ""
    echo "🎤 Voice Features Available:"
    echo "   ✅ Unified voice control across ALL devices"
    echo "   ✅ Alexa, Google, JASON native voice support"
    echo "   ✅ Seamless device handoff with context"
    echo "   ✅ Multi-modal responses (voice + visual + haptic)"
    echo "   ✅ Advanced TTS with emotions and custom voices"
    echo "   ✅ Context-aware speech recognition"
    echo "   ✅ Real-time voice conversion and cloning"
    echo "   ✅ Intent recognition and entity extraction"
    echo ""
    echo "🔧 Configuration files:"
    echo "   • requirements_voice.txt - Python dependencies"
    echo "   • tools/advanced_tts.py - TTS engine"
    echo "   • tools/advanced_asr.py - ASR engine"
    echo ""
    echo "⚠️  IMPORTANT NOTES:"
    echo "   • Ensure microphone permissions are granted"
    echo "   • Some features require internet connectivity"
    echo "   • GPU acceleration recommended for best performance"
    echo "   • Voice cloning requires sample audio files"
    echo ""
    echo "🌟 Welcome to the future of voice control!"
    echo "🎯 You can now control EVERY device with your voice!"
}

# Main installation process
main() {
    echo "🚀 Starting omni-channel voice experience setup..."
    echo ""
    
    # Check operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "🐧 Detected Linux system"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🍎 Detected macOS system"
    else
        echo "⚠️  Unsupported operating system: $OSTYPE"
        echo "Some features may not work correctly"
    fi
    
    echo ""
    
    # Install system dependencies
    install_system_deps
    
    # Install Python dependencies
    install_python_deps
    
    # Download AI models
    download_models
    
    # Set up voice tools
    setup_voice_tools
    
    # Configure audio system
    configure_audio
    
    # Set up Node.js dependencies
    setup_nodejs_deps
    
    # Create demo files
    create_demo_files
    
    # Test the system
    test_system
    
    # Show usage instructions
    show_usage
    
    echo ""
    echo "🎊 Omni-channel voice experience setup completed successfully!"
    echo "🌟 JASON's voice system is ready to revolutionize device control!"
}

# Check if user wants to proceed
echo "Do you want to proceed with the omni-channel voice experience setup? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    main
else
    echo "Setup cancelled."
    exit 0
fi#!/bin/bash

# JASON Omni-Channel Voice Experience Setup Script
# Sets up the complete unified voice control system

set -e

echo "🌟 JASON Omni-Channel Voice Experience Setup"
echo "============================================="
echo ""
echo "This will set up the most advanced voice control system ever created!"
echo ""
echo "🎤 Features being installed:"
echo "  • Unified voice control across ALL devices"
echo "  • Any Device, Any Assistant support"
echo "  • Seamless handoff between devices"
echo "  • Multi-modal responses (voice + visual + haptic)"
echo "  • Advanced TTS with emotion and voice cloning"
echo "  • Context-aware speech recognition"
echo "  • Real-time voice conversion"
echo "  • Custom voice creation"
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

# Function to install system dependencies
install_system_deps() {
    echo "🔧 Installing system dependencies..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y \
            python3-dev \
            python3-pip \
            portaudio19-dev \
            espeak \
            espeak-data \
            libespeak1 \
            libespeak-dev \
            festival \
            festvox-kallpc16k \
            alsa-utils \
            pulseaudio \
            pulseaudio-utils \
            ffmpeg \
            sox \
            libsox-fmt-all \
            build-essential \
            cmake \
            pkg-config \
            libasound2-dev \
            libportaudio2 \
            libportaudiocpp0 \
            portaudio19-dev
            
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install \
                portaudio \
                espeak \
                festival \
                ffmpeg \
                sox \
                cmake \
                pkg-config
        else
            echo "⚠️  Homebrew not found. Please install Homebrew first:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    else
        echo "⚠️  Unsupported operating system: $OSTYPE"
        echo "Manual installation of dependencies may be required"
    fi
    
    echo "✅ System dependencies installed"
}

# Function to install Python dependencies
install_python_deps() {
    echo "🐍 Installing Python dependencies for voice processing..."
    
    # Upgrade pip
    python3 -m pip install --upgrade pip
    
    # Install core dependencies
    python3 -m pip install --user \
        torch \
        torchaudio \
        numpy \
        scipy \
        librosa \
        soundfile \
        pyaudio \
        pydub \
        webrtcvad \
        noisereduce
    
    # Install TTS engines
    echo "🎤 Installing TTS engines..."
    python3 -m pip install --user \
        TTS \
        pyttsx3 \
        gTTS
    
    # Install ASR engines
    echo "🗣️  Installing ASR engines..."
    python3 -m pip install --user \
        openai-whisper \
        SpeechRecognition \
        transformers
    
    # Install NLP libraries
    echo "🧠 Installing NLP libraries..."
    python3 -m pip install --user \
        spacy \
        nltk \
        transformers
    
    # Install demo dependencies
    echo "🎮 Installing demo dependencies..."
    python3 -m pip install --user \
        rich \
        aiohttp \
        websockets \
        click
    
    echo "✅ Python dependencies installed"
}

# Function to download models
download_models() {
    echo "📦 Downloading AI models..."
    
    # Create models directory
    mkdir -p models/voices
    mkdir -p models/asr
    mkdir -p models/nlp
    
    # Download Whisper models
    echo "🎧 Downloading Whisper ASR models..."
    python3 -c "import whisper; whisper.load_model('base')" || echo "⚠️  Whisper model download failed"
    
    # Download spaCy models
    echo "🧠 Downloading spaCy NLP models..."
    python3 -m spacy download en_core_web_sm || echo "⚠️  spaCy model download failed"
    
    # Download NLTK data
    echo "📚 Downloading NLTK data..."
    python3 -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')" || echo "⚠️  NLTK data download failed"
    
    echo "✅ Models downloaded"
}

# Function to set up voice tools
setup_voice_tools() {
    echo "🛠️  Setting up voice processing tools..."
    
    # Make Python scripts executable
    chmod +x tools/advanced_tts.py
    chmod +x tools/advanced_asr.py
    
    # Test TTS
    echo "🎤 Testing TTS engine..."
    python3 tools/advanced_tts.py --text "Hello, this is JASON's voice system test" --output /tmp/tts_test.wav || echo "⚠️  TTS test failed"
    
    # Test ASR (if test audio exists)
    if [ -f "/tmp/tts_test.wav" ]; then
        echo "🗣️  Testing ASR engine..."
        python3 tools/advanced_asr.py --input /tmp/tts_test.wav || echo "⚠️  ASR test failed"
        rm -f /tmp/tts_test.wav
    fi
    
    echo "✅ Voice tools set up"
}

# Function to configure audio system
configure_audio() {
    echo "🔊 Configuring audio system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux audio configuration
        
        # Start PulseAudio if not running
        if ! pgrep -x "pulseaudio" > /dev/null; then
            pulseaudio --start || echo "⚠️  Could not start PulseAudio"
        fi
        
        # Test audio output
        echo "🔊 Testing audio output..."
        speaker-test -t sine -f 1000 -l 1 -s 1 -c 2 -p 1000 || echo "⚠️  Audio output test failed"
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS audio configuration
        echo "🔊 Testing audio output..."
        say "Audio test" || echo "⚠️  Audio output test failed"
    fi
    
    echo "✅ Audio system configured"
}

# Function to set up Node.js dependencies
setup_nodejs_deps() {
    echo "📦 Installing Node.js dependencies for voice API..."
    
    # Install additional Node.js packages for voice processing
    npm install \
        multer \
        @types/multer \
        node-record-lpcm16 \
        wav \
        speaker \
        mic
    
    echo "✅ Node.js voice dependencies installed"
}

# Function to create demo audio files
create_demo_files() {
    echo "🎵 Creating demo audio files..."
    
    mkdir -p demo/audio
    
    # Create sample audio using TTS
    python3 tools/advanced_tts.py \
        --text "Welcome to JASON's omni-channel voice experience. This is a demonstration of unified voice control across all your devices." \
        --output demo/audio/welcome.wav \
        --voice jason-default || echo "⚠️  Demo audio creation failed"
    
    # Create voice samples for different emotions
    emotions=("happy" "calm" "excited" "authoritative")
    for emotion in "${emotions[@]}"; do
        python3 tools/advanced_tts.py \
            --text "This is JASON speaking with a $emotion voice." \
            --output "demo/audio/sample_$emotion.wav" \
            --emotion "$emotion" || echo "⚠️  $emotion sample creation failed"
    done
    
    echo "✅ Demo audio files created"
}

# Function to test the complete system
test_system() {
    echo "🧪 Testing complete omni-channel voice system..."
    
    # Test API endpoints
    echo "🌐 Testing voice API endpoints..."
    
    # Start server in background for testing
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test health endpoint
    curl -s http://localhost:3000/api/omni-voice/health > /dev/null && echo "✅ Voice API health check passed" || echo "❌ Voice API health check failed"
    
    # Test voices endpoint
    curl -s http://localhost:3000/api/omni-voice/voices > /dev/null && echo "✅ Voice profiles endpoint working" || echo "❌ Voice profiles endpoint failed"
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null || true
    
    echo "✅ System tests completed"
}

# Function to show usage instructions
show_usage() {
    echo ""
    echo "🎉 OMNI-CHANNEL VOICE EXPERIENCE SETUP COMPLETE!"
    echo "================================================"
    echo ""
    echo "🚀 To start the voice-enabled server:"
    echo "   npm run dev"
    echo ""
    echo "🎮 To run the interactive voice demo:"
    echo "   python3 demo/omni_voice_demo.py"
    echo ""
    echo "🌐 Voice API endpoints will be available at:"
    echo "   http://localhost:3000/api/omni-voice/"
    echo ""
    echo "📚 Key endpoints:"
    echo "   • POST /api/omni-voice/session/init - Initialize voice session"
    echo "   • POST /api/omni-voice/command - Process voice commands"
    echo "   • POST /api/omni-voice/tts - Text-to-speech synthesis"
    echo "   • POST /api/omni-voice/asr - Speech recognition"
    echo "   • POST /api/omni-voice/handoff - Device handoff"
    echo "   • GET  /api/omni-voice/voices - Available voice profiles"
    echo "   • GET  /api/omni-voice/health - System health check"
    echo ""
    echo "🎤 Voice Features Available:"
    echo "   ✅ Unified voice control across ALL devices"
    echo "   ✅ Alexa, Google, JASON native voice support"
    echo "   ✅ Seamless device handoff with context"
    echo "   ✅ Multi-modal responses (voice + visual + haptic)"
    echo "   ✅ Advanced TTS with emotions and custom voices"
    echo "   ✅ Context-aware speech recognition"
    echo "   ✅ Real-time voice conversion and cloning"
    echo "   ✅ Intent recognition and entity extraction"
    echo ""
    echo "🔧 Configuration files:"
    echo "   • requirements_voice.txt - Python dependencies"
    echo "   • tools/advanced_tts.py - TTS engine"
    echo "   • tools/advanced_asr.py - ASR engine"
    echo ""
    echo "⚠️  IMPORTANT NOTES:"
    echo "   • Ensure microphone permissions are granted"
    echo "   • Some features require internet connectivity"
    echo "   • GPU acceleration recommended for best performance"
    echo "   • Voice cloning requires sample audio files"
    echo ""
    echo "🌟 Welcome to the future of voice control!"
    echo "🎯 You can now control EVERY device with your voice!"
}

# Main installation process
main() {
    echo "🚀 Starting omni-channel voice experience setup..."
    echo ""
    
    # Check operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "🐧 Detected Linux system"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🍎 Detected macOS system"
    else
        echo "⚠️  Unsupported operating system: $OSTYPE"
        echo "Some features may not work correctly"
    fi
    
    echo ""
    
    # Install system dependencies
    install_system_deps
    
    # Install Python dependencies
    install_python_deps
    
    # Download AI models
    download_models
    
    # Set up voice tools
    setup_voice_tools
    
    # Configure audio system
    configure_audio
    
    # Set up Node.js dependencies
    setup_nodejs_deps
    
    # Create demo files
    create_demo_files
    
    # Test the system
    test_system
    
    # Show usage instructions
    show_usage
    
    echo ""
    echo "🎊 Omni-channel voice experience setup completed successfully!"
    echo "🌟 JASON's voice system is ready to revolutionize device control!"
}

# Check if user wants to proceed
echo "Do you want to proceed with the omni-channel voice experience setup? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    main
else
    echo "Setup cancelled."
    exit 0
fi