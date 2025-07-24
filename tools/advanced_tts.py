#!/usr/bin/env python3
"""
Advanced Text-to-Speech Engine for JASON
Supports multiple TTS backends with emotion and voice cloning
"""

import argparse
import json
import sys
import os
import numpy as np
import torch
import torchaudio
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedTTS:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.models = {}
        self.voice_profiles = {}
        self.load_models()
    
    def load_models(self):
        """Load TTS models"""
        try:
            # Try to load Coqui TTS
            try:
                from TTS.api import TTS
                self.models['coqui'] = TTS("tts_models/en/ljspeech/tacotron2-DDC", gpu=torch.cuda.is_available())
                logger.info("Loaded Coqui TTS model")
            except ImportError:
                logger.warning("Coqui TTS not available")
            
            # Try to load Tortoise TTS for voice cloning
            try:
                from tortoise.api import TextToSpeech
                self.models['tortoise'] = TextToSpeech()
                logger.info("Loaded Tortoise TTS model")
            except ImportError:
                logger.warning("Tortoise TTS not available")
            
            # Fallback to pyttsx3
            try:
                import pyttsx3
                self.models['pyttsx3'] = pyttsx3.init()
                logger.info("Loaded pyttsx3 TTS engine")
            except ImportError:
                logger.warning("pyttsx3 not available")
            
            # Try to load espeak-ng
            try:
                import subprocess
                result = subprocess.run(['espeak', '--version'], capture_output=True, text=True)
                if result.returncode == 0:
                    self.models['espeak'] = True
                    logger.info("Found espeak TTS engine")
            except FileNotFoundError:
                logger.warning("espeak not available")
                
        except Exception as e:
            logger.error(f"Error loading TTS models: {e}")
    
    def synthesize(self, text, voice_id='jason-default', language='en-US', 
                  speed=1.0, pitch=1.0, volume=0.8, emotion='neutral',
                  output_path=None, output_format='wav'):
        """Synthesize speech from text"""
        
        try:
            # Choose best available model
            if 'coqui' in self.models:
                return self._synthesize_coqui(text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format)
            elif 'tortoise' in self.models:
                return self._synthesize_tortoise(text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format)
            elif 'pyttsx3' in self.models:
                return self._synthesize_pyttsx3(text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format)
            elif 'espeak' in self.models:
                return self._synthesize_espeak(text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format)
            else:
                raise Exception("No TTS engine available")
                
        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            # Fallback to simple synthesis
            return self._synthesize_fallback(text, output_path, output_format)
    
    def _synthesize_coqui(self, text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format):
        """Synthesize using Coqui TTS"""
        try:
            model = self.models['coqui']
            
            # Generate audio
            wav = model.tts(text)
            
            # Apply speed and pitch modifications
            wav_tensor = torch.tensor(wav).unsqueeze(0)
            
            # Speed modification
            if speed != 1.0:
                wav_tensor = torchaudio.functional.speed(wav_tensor, 22050, speed)
            
            # Pitch modification
            if pitch != 1.0:
                wav_tensor = torchaudio.functional.pitch_shift(wav_tensor, 22050, int(pitch * 12))
            
            # Volume modification
            wav_tensor = wav_tensor * volume
            
            # Save to file
            if output_path:
                torchaudio.save(output_path, wav_tensor, 22050)
                return output_path
            else:
                return wav_tensor.numpy()
                
        except Exception as e:
            logger.error(f"Coqui TTS failed: {e}")
            raise
    
    def _synthesize_tortoise(self, text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format):
        """Synthesize using Tortoise TTS"""
        try:
            model = self.models['tortoise']
            
            # Use custom voice if available
            voice_samples = None
            if voice_id.startswith('custom-'):
                voice_path = f"models/voices/{voice_id}"
                if os.path.exists(voice_path):
                    voice_samples = [f"{voice_path}/sample_{i}.wav" for i in range(3)]
            
            # Generate audio
            gen = model.tts_with_preset(text, voice_samples=voice_samples, preset='fast')
            
            # Convert to numpy array
            audio = gen.squeeze().cpu().numpy()
            
            # Apply modifications
            if speed != 1.0:
                # Simple speed change by resampling
                import scipy.signal
                audio = scipy.signal.resample(audio, int(len(audio) / speed))
            
            # Volume modification
            audio = audio * volume
            
            # Save to file
            if output_path:
                torchaudio.save(output_path, torch.tensor(audio).unsqueeze(0), 24000)
                return output_path
            else:
                return audio
                
        except Exception as e:
            logger.error(f"Tortoise TTS failed: {e}")
            raise
    
    def _synthesize_pyttsx3(self, text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format):
        """Synthesize using pyttsx3"""
        try:
            engine = self.models['pyttsx3']
            
            # Set properties
            engine.setProperty('rate', int(200 * speed))
            engine.setProperty('volume', volume)
            
            # Set voice based on voice_id
            voices = engine.getProperty('voices')
            if voices:
                if 'female' in voice_id.lower():
                    for voice in voices:
                        if 'female' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
                elif 'male' in voice_id.lower():
                    for voice in voices:
                        if 'male' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
            
            # Save to file
            if output_path:
                engine.save_to_file(text, output_path)
                engine.runAndWait()
                return output_path
            else:
                # For in-memory, we need to use a temporary file
                import tempfile
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                    engine.save_to_file(text, tmp.name)
                    engine.runAndWait()
                    
                    # Read the file back
                    with open(tmp.name, 'rb') as f:
                        audio_data = f.read()
                    
                    os.unlink(tmp.name)
                    return audio_data
                    
        except Exception as e:
            logger.error(f"pyttsx3 TTS failed: {e}")
            raise
    
    def _synthesize_espeak(self, text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format):
        """Synthesize using espeak"""
        try:
            import subprocess
            
            # Build espeak command
            cmd = ['espeak']
            
            # Set language
            if language.startswith('en'):
                cmd.extend(['-v', 'en'])
            else:
                cmd.extend(['-v', language[:2]])
            
            # Set speed (words per minute)
            cmd.extend(['-s', str(int(175 * speed))])
            
            # Set pitch (0-99)
            cmd.extend(['-p', str(int(50 * pitch))])
            
            # Set amplitude (volume)
            cmd.extend(['-a', str(int(100 * volume))])
            
            # Output format
            if output_path:
                cmd.extend(['-w', output_path])
            else:
                cmd.extend(['--stdout'])
            
            # Add text
            cmd.append(text)
            
            # Run espeak
            result = subprocess.run(cmd, capture_output=True)
            
            if result.returncode == 0:
                if output_path:
                    return output_path
                else:
                    return result.stdout
            else:
                raise Exception(f"espeak failed: {result.stderr.decode()}")
                
        except Exception as e:
            logger.error(f"espeak TTS failed: {e}")
            raise
    
    def _synthesize_fallback(self, text, output_path, output_format):
        """Fallback synthesis using system say command or festival"""
        try:
            import subprocess
            
            # Try macOS 'say' command
            try:
                cmd = ['say', '-o', output_path or '/tmp/tts_output.wav', text]
                result = subprocess.run(cmd, capture_output=True)
                if result.returncode == 0:
                    if output_path:
                        return output_path
                    else:
                        with open('/tmp/tts_output.wav', 'rb') as f:
                            return f.read()
            except FileNotFoundError:
                pass
            
            # Try festival
            try:
                cmd = ['festival', '--tts']
                process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                stdout, stderr = process.communicate(input=text.encode())
                
                if process.returncode == 0:
                    # Festival doesn't directly output audio files, so this is a simplified approach
                    logger.warning("Festival TTS used - limited functionality")
                    return b''  # Empty audio data
            except FileNotFoundError:
                pass
            
            # If all else fails, create a simple beep
            logger.warning("No TTS engine available, creating silence")
            duration = len(text) * 0.1  # Rough estimate
            sample_rate = 22050
            samples = int(duration * sample_rate)
            audio = np.zeros(samples, dtype=np.float32)
            
            if output_path:
                torchaudio.save(output_path, torch.tensor(audio).unsqueeze(0), sample_rate)
                return output_path
            else:
                return audio.tobytes()
                
        except Exception as e:
            logger.error(f"Fallback TTS failed: {e}")
            raise

def main():
    parser = argparse.ArgumentParser(description='Advanced TTS Engine for JASON')
    parser.add_argument('--text', required=True, help='Text to synthesize')
    parser.add_argument('--voice', default='jason-default', help='Voice profile ID')
    parser.add_argument('--language', default='en-US', help='Language code')
    parser.add_argument('--speed', type=float, default=1.0, help='Speech speed')
    parser.add_argument('--pitch', type=float, default=1.0, help='Speech pitch')
    parser.add_argument('--volume', type=float, default=0.8, help='Speech volume')
    parser.add_argument('--emotion', default='neutral', help='Speech emotion')
    parser.add_argument('--output', help='Output file path')
    parser.add_argument('--format', default='wav', help='Output format')
    
    args = parser.parse_args()
    
    try:
        tts = AdvancedTTS()
        result = tts.synthesize(
            text=args.text,
            voice_id=args.voice,
            language=args.language,
            speed=args.speed,
            pitch=args.pitch,
            volume=args.volume,
            emotion=args.emotion,
            output_path=args.output,
            output_format=args.format
        )
        
        if args.output:
            logger.info(f"Audio saved to: {result}")
        else:
            # Output binary data to stdout
            sys.stdout.buffer.write(result)
            
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()#!/usr/bin/env python3
"""
Advanced Text-to-Speech Engine for JASON
Supports multiple TTS backends with emotion and voice cloning
"""

import argparse
import json
import sys
import os
import numpy as np
import torch
import torchaudio
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedTTS:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.models = {}
        self.voice_profiles = {}
        self.load_models()
    
    def load_models(self):
        """Load TTS models"""
        try:
            # Try to load Coqui TTS
            try:
                from TTS.api import TTS
                self.models['coqui'] = TTS("tts_models/en/ljspeech/tacotron2-DDC", gpu=torch.cuda.is_available())
                logger.info("Loaded Coqui TTS model")
            except ImportError:
                logger.warning("Coqui TTS not available")
            
            # Try to load Tortoise TTS for voice cloning
            try:
                from tortoise.api import TextToSpeech
                self.models['tortoise'] = TextToSpeech()
                logger.info("Loaded Tortoise TTS model")
            except ImportError:
                logger.warning("Tortoise TTS not available")
            
            # Fallback to pyttsx3
            try:
                import pyttsx3
                self.models['pyttsx3'] = pyttsx3.init()
                logger.info("Loaded pyttsx3 TTS engine")
            except ImportError:
                logger.warning("pyttsx3 not available")
            
            # Try to load espeak-ng
            try:
                import subprocess
                result = subprocess.run(['espeak', '--version'], capture_output=True, text=True)
                if result.returncode == 0:
                    self.models['espeak'] = True
                    logger.info("Found espeak TTS engine")
            except FileNotFoundError:
                logger.warning("espeak not available")
                
        except Exception as e:
            logger.error(f"Error loading TTS models: {e}")
    
    def synthesize(self, text, voice_id='jason-default', language='en-US', 
                  speed=1.0, pitch=1.0, volume=0.8, emotion='neutral',
                  output_path=None, output_format='wav'):
        """Synthesize speech from text"""
        
        try:
            # Choose best available model
            if 'coqui' in self.models:
                return self._synthesize_coqui(text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format)
            elif 'tortoise' in self.models:
                return self._synthesize_tortoise(text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format)
            elif 'pyttsx3' in self.models:
                return self._synthesize_pyttsx3(text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format)
            elif 'espeak' in self.models:
                return self._synthesize_espeak(text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format)
            else:
                raise Exception("No TTS engine available")
                
        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            # Fallback to simple synthesis
            return self._synthesize_fallback(text, output_path, output_format)
    
    def _synthesize_coqui(self, text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format):
        """Synthesize using Coqui TTS"""
        try:
            model = self.models['coqui']
            
            # Generate audio
            wav = model.tts(text)
            
            # Apply speed and pitch modifications
            wav_tensor = torch.tensor(wav).unsqueeze(0)
            
            # Speed modification
            if speed != 1.0:
                wav_tensor = torchaudio.functional.speed(wav_tensor, 22050, speed)
            
            # Pitch modification
            if pitch != 1.0:
                wav_tensor = torchaudio.functional.pitch_shift(wav_tensor, 22050, int(pitch * 12))
            
            # Volume modification
            wav_tensor = wav_tensor * volume
            
            # Save to file
            if output_path:
                torchaudio.save(output_path, wav_tensor, 22050)
                return output_path
            else:
                return wav_tensor.numpy()
                
        except Exception as e:
            logger.error(f"Coqui TTS failed: {e}")
            raise
    
    def _synthesize_tortoise(self, text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format):
        """Synthesize using Tortoise TTS"""
        try:
            model = self.models['tortoise']
            
            # Use custom voice if available
            voice_samples = None
            if voice_id.startswith('custom-'):
                voice_path = f"models/voices/{voice_id}"
                if os.path.exists(voice_path):
                    voice_samples = [f"{voice_path}/sample_{i}.wav" for i in range(3)]
            
            # Generate audio
            gen = model.tts_with_preset(text, voice_samples=voice_samples, preset='fast')
            
            # Convert to numpy array
            audio = gen.squeeze().cpu().numpy()
            
            # Apply modifications
            if speed != 1.0:
                # Simple speed change by resampling
                import scipy.signal
                audio = scipy.signal.resample(audio, int(len(audio) / speed))
            
            # Volume modification
            audio = audio * volume
            
            # Save to file
            if output_path:
                torchaudio.save(output_path, torch.tensor(audio).unsqueeze(0), 24000)
                return output_path
            else:
                return audio
                
        except Exception as e:
            logger.error(f"Tortoise TTS failed: {e}")
            raise
    
    def _synthesize_pyttsx3(self, text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format):
        """Synthesize using pyttsx3"""
        try:
            engine = self.models['pyttsx3']
            
            # Set properties
            engine.setProperty('rate', int(200 * speed))
            engine.setProperty('volume', volume)
            
            # Set voice based on voice_id
            voices = engine.getProperty('voices')
            if voices:
                if 'female' in voice_id.lower():
                    for voice in voices:
                        if 'female' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
                elif 'male' in voice_id.lower():
                    for voice in voices:
                        if 'male' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
            
            # Save to file
            if output_path:
                engine.save_to_file(text, output_path)
                engine.runAndWait()
                return output_path
            else:
                # For in-memory, we need to use a temporary file
                import tempfile
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                    engine.save_to_file(text, tmp.name)
                    engine.runAndWait()
                    
                    # Read the file back
                    with open(tmp.name, 'rb') as f:
                        audio_data = f.read()
                    
                    os.unlink(tmp.name)
                    return audio_data
                    
        except Exception as e:
            logger.error(f"pyttsx3 TTS failed: {e}")
            raise
    
    def _synthesize_espeak(self, text, voice_id, language, speed, pitch, volume, emotion, output_path, output_format):
        """Synthesize using espeak"""
        try:
            import subprocess
            
            # Build espeak command
            cmd = ['espeak']
            
            # Set language
            if language.startswith('en'):
                cmd.extend(['-v', 'en'])
            else:
                cmd.extend(['-v', language[:2]])
            
            # Set speed (words per minute)
            cmd.extend(['-s', str(int(175 * speed))])
            
            # Set pitch (0-99)
            cmd.extend(['-p', str(int(50 * pitch))])
            
            # Set amplitude (volume)
            cmd.extend(['-a', str(int(100 * volume))])
            
            # Output format
            if output_path:
                cmd.extend(['-w', output_path])
            else:
                cmd.extend(['--stdout'])
            
            # Add text
            cmd.append(text)
            
            # Run espeak
            result = subprocess.run(cmd, capture_output=True)
            
            if result.returncode == 0:
                if output_path:
                    return output_path
                else:
                    return result.stdout
            else:
                raise Exception(f"espeak failed: {result.stderr.decode()}")
                
        except Exception as e:
            logger.error(f"espeak TTS failed: {e}")
            raise
    
    def _synthesize_fallback(self, text, output_path, output_format):
        """Fallback synthesis using system say command or festival"""
        try:
            import subprocess
            
            # Try macOS 'say' command
            try:
                cmd = ['say', '-o', output_path or '/tmp/tts_output.wav', text]
                result = subprocess.run(cmd, capture_output=True)
                if result.returncode == 0:
                    if output_path:
                        return output_path
                    else:
                        with open('/tmp/tts_output.wav', 'rb') as f:
                            return f.read()
            except FileNotFoundError:
                pass
            
            # Try festival
            try:
                cmd = ['festival', '--tts']
                process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                stdout, stderr = process.communicate(input=text.encode())
                
                if process.returncode == 0:
                    # Festival doesn't directly output audio files, so this is a simplified approach
                    logger.warning("Festival TTS used - limited functionality")
                    return b''  # Empty audio data
            except FileNotFoundError:
                pass
            
            # If all else fails, create a simple beep
            logger.warning("No TTS engine available, creating silence")
            duration = len(text) * 0.1  # Rough estimate
            sample_rate = 22050
            samples = int(duration * sample_rate)
            audio = np.zeros(samples, dtype=np.float32)
            
            if output_path:
                torchaudio.save(output_path, torch.tensor(audio).unsqueeze(0), sample_rate)
                return output_path
            else:
                return audio.tobytes()
                
        except Exception as e:
            logger.error(f"Fallback TTS failed: {e}")
            raise

def main():
    parser = argparse.ArgumentParser(description='Advanced TTS Engine for JASON')
    parser.add_argument('--text', required=True, help='Text to synthesize')
    parser.add_argument('--voice', default='jason-default', help='Voice profile ID')
    parser.add_argument('--language', default='en-US', help='Language code')
    parser.add_argument('--speed', type=float, default=1.0, help='Speech speed')
    parser.add_argument('--pitch', type=float, default=1.0, help='Speech pitch')
    parser.add_argument('--volume', type=float, default=0.8, help='Speech volume')
    parser.add_argument('--emotion', default='neutral', help='Speech emotion')
    parser.add_argument('--output', help='Output file path')
    parser.add_argument('--format', default='wav', help='Output format')
    
    args = parser.parse_args()
    
    try:
        tts = AdvancedTTS()
        result = tts.synthesize(
            text=args.text,
            voice_id=args.voice,
            language=args.language,
            speed=args.speed,
            pitch=args.pitch,
            volume=args.volume,
            emotion=args.emotion,
            output_path=args.output,
            output_format=args.format
        )
        
        if args.output:
            logger.info(f"Audio saved to: {result}")
        else:
            # Output binary data to stdout
            sys.stdout.buffer.write(result)
            
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()