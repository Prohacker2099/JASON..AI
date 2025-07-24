#!/usr/bin/env python3
"""
Advanced Automatic Speech Recognition Engine for JASON
Supports multiple ASR backends with context and intent recognition
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

class AdvancedASR:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.models = {}
        self.intent_classifier = None
        self.load_models()
    
    def load_models(self):
        """Load ASR models"""
        try:
            # Try to load Whisper
            try:
                import whisper
                self.models['whisper'] = whisper.load_model("base")
                logger.info("Loaded Whisper ASR model")
            except ImportError:
                logger.warning("Whisper not available")
            
            # Try to load Wav2Vec2
            try:
                from transformers import Wav2Vec2ForCTC, Wav2Vec2Tokenizer
                self.models['wav2vec2_tokenizer'] = Wav2Vec2Tokenizer.from_pretrained("facebook/wav2vec2-base-960h")
                self.models['wav2vec2'] = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
                logger.info("Loaded Wav2Vec2 ASR model")
            except ImportError:
                logger.warning("Wav2Vec2 not available")
            
            # Try to load SpeechRecognition
            try:
                import speech_recognition as sr
                self.models['speech_recognition'] = sr.Recognizer()
                logger.info("Loaded SpeechRecognition library")
            except ImportError:
                logger.warning("SpeechRecognition not available")
            
            # Load intent classification model
            try:
                from transformers import pipeline
                self.intent_classifier = pipeline("text-classification", 
                                                model="microsoft/DialoGPT-medium")
                logger.info("Loaded intent classification model")
            except ImportError:
                logger.warning("Intent classification not available")
                
        except Exception as e:
            logger.error(f"Error loading ASR models: {e}")
    
    def recognize(self, audio_path, language='en-US', context=None):
        """Recognize speech from audio file"""
        
        try:
            # Choose best available model
            if 'whisper' in self.models:
                return self._recognize_whisper(audio_path, language, context)
            elif 'wav2vec2' in self.models:
                return self._recognize_wav2vec2(audio_path, language, context)
            elif 'speech_recognition' in self.models:
                return self._recognize_speech_recognition(audio_path, language, context)
            else:
                raise Exception("No ASR engine available")
                
        except Exception as e:
            logger.error(f"ASR recognition failed: {e}")
            # Fallback to simple recognition
            return self._recognize_fallback(audio_path, language, context)
    
    def _recognize_whisper(self, audio_path, language, context):
        """Recognize using Whisper"""
        try:
            model = self.models['whisper']
            
            # Load and preprocess audio
            audio = whisper.load_audio(audio_path)
            audio = whisper.pad_or_trim(audio)
            
            # Make log-Mel spectrogram
            mel = whisper.log_mel_spectrogram(audio).to(model.device)
            
            # Detect language if not specified
            if language == 'auto':
                _, probs = model.detect_language(mel)
                language = max(probs, key=probs.get)
            
            # Decode the audio
            options = whisper.DecodingOptions(language=language[:2] if language != 'auto' else None)
            result = whisper.decode(model, mel, options)
            
            # Extract text and confidence
            text = result.text.strip()
            confidence = 1.0 - result.avg_logprob  # Rough confidence estimate
            
            # Generate alternatives (simplified)
            alternatives = [
                {"text": text, "confidence": confidence},
                {"text": text.lower(), "confidence": confidence * 0.9},
                {"text": text.upper(), "confidence": confidence * 0.8}
            ]
            
            # Perform intent recognition
            intent, entities = self._extract_intent_entities(text, context)
            
            return {
                "text": text,
                "confidence": confidence,
                "alternatives": alternatives,
                "intent": intent,
                "entities": entities,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Whisper ASR failed: {e}")
            raise
    
    def _recognize_wav2vec2(self, audio_path, language, context):
        """Recognize using Wav2Vec2"""
        try:
            tokenizer = self.models['wav2vec2_tokenizer']
            model = self.models['wav2vec2']
            
            # Load audio
            waveform, sample_rate = torchaudio.load(audio_path)
            
            # Resample to 16kHz if needed
            if sample_rate != 16000:
                resampler = torchaudio.transforms.Resample(sample_rate, 16000)
                waveform = resampler(waveform)
            
            # Ensure mono
            if waveform.shape[0] > 1:
                waveform = torch.mean(waveform, dim=0, keepdim=True)
            
            # Tokenize
            input_values = tokenizer(waveform.squeeze().numpy(), 
                                   return_tensors="pt", 
                                   sampling_rate=16000).input_values
            
            # Get logits
            with torch.no_grad():
                logits = model(input_values).logits
            
            # Decode
            predicted_ids = torch.argmax(logits, dim=-1)
            transcription = tokenizer.decode(predicted_ids[0])
            
            # Clean up transcription
            text = transcription.strip()
            confidence = 0.8  # Rough estimate
            
            # Generate alternatives
            alternatives = [
                {"text": text, "confidence": confidence},
                {"text": text.lower(), "confidence": confidence * 0.9}
            ]
            
            # Perform intent recognition
            intent, entities = self._extract_intent_entities(text, context)
            
            return {
                "text": text,
                "confidence": confidence,
                "alternatives": alternatives,
                "intent": intent,
                "entities": entities,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Wav2Vec2 ASR failed: {e}")
            raise
    
    def _recognize_speech_recognition(self, audio_path, language, context):
        """Recognize using SpeechRecognition library"""
        try:
            import speech_recognition as sr
            
            recognizer = self.models['speech_recognition']
            
            # Load audio file
            with sr.AudioFile(audio_path) as source:
                audio = recognizer.record(source)
            
            # Try multiple recognition engines
            results = []
            
            # Google Speech Recognition
            try:
                text = recognizer.recognize_google(audio, language=language)
                results.append({"text": text, "confidence": 0.9, "engine": "google"})
            except sr.UnknownValueError:
                pass
            except sr.RequestError:
                pass
            
            # Sphinx (offline)
            try:
                text = recognizer.recognize_sphinx(audio)
                results.append({"text": text, "confidence": 0.7, "engine": "sphinx"})
            except sr.UnknownValueError:
                pass
            except sr.RequestError:
                pass
            
            if not results:
                raise Exception("No recognition results")
            
            # Use best result
            best_result = max(results, key=lambda x: x["confidence"])
            text = best_result["text"]
            confidence = best_result["confidence"]
            
            # Generate alternatives from all results
            alternatives = [{"text": r["text"], "confidence": r["confidence"]} for r in results]
            
            # Perform intent recognition
            intent, entities = self._extract_intent_entities(text, context)
            
            return {
                "text": text,
                "confidence": confidence,
                "alternatives": alternatives,
                "intent": intent,
                "entities": entities,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"SpeechRecognition ASR failed: {e}")
            raise
    
    def _recognize_fallback(self, audio_path, language, context):
        """Fallback recognition"""
        try:
            # Try using system speech recognition tools
            import subprocess
            
            # Try using macOS speech recognition
            try:
                # This is a simplified approach - real implementation would be more complex
                result = subprocess.run(['say', '--file-format=WAVE', '--data-format=LEI16@22050', 
                                       '--channels=1', audio_path], 
                                      capture_output=True, text=True)
                
                if result.returncode == 0:
                    # This is a placeholder - actual speech recognition would be needed
                    text = "Speech recognition not available"
                    confidence = 0.1
                else:
                    raise Exception("System speech recognition failed")
                    
            except FileNotFoundError:
                # No system tools available
                text = "Speech recognition not available"
                confidence = 0.1
            
            return {
                "text": text,
                "confidence": confidence,
                "alternatives": [{"text": text, "confidence": confidence}],
                "intent": None,
                "entities": {},
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Fallback ASR failed: {e}")
            raise
    
    def _extract_intent_entities(self, text, context):
        """Extract intent and entities from text"""
        try:
            # Simple rule-based intent detection
            text_lower = text.lower()
            intent = None
            entities = {}
            
            # Intent detection patterns
            if any(word in text_lower for word in ['show', 'display', 'camera', 'security']):
                intent = 'show_cameras'
            elif any(word in text_lower for word in ['light', 'lamp', 'brightness']):
                intent = 'control_lights'
                # Extract room entity
                for word in ['living room', 'bedroom', 'kitchen', 'bathroom']:
                    if word in text_lower:
                        entities['room'] = word
                        break
            elif any(word in text_lower for word in ['play', 'music', 'song']):
                intent = 'play_music'
                # Extract song/artist entity
                if 'play ' in text_lower:
                    song_part = text_lower.split('play ')[1]
                    entities['song'] = song_part.strip()
            elif any(word in text_lower for word in ['weather', 'temperature', 'forecast']):
                intent = 'weather'
                # Extract location entity
                for word in ['in', 'at', 'for']:
                    if word in text_lower:
                        location_part = text_lower.split(word)[1].strip()
                        entities['location'] = location_part
                        break
            elif any(word in text_lower for word in ['status', 'devices', 'system']):
                intent = 'device_status'
            elif any(word in text_lower for word in ['continue', 'switch', 'move', 'handoff']):
                intent = 'handoff'
                # Extract target device
                if 'to ' in text_lower:
                    device_part = text_lower.split('to ')[1].strip()
                    entities['target_device'] = device_part
            
            # Use context to improve intent detection
            if context and not intent:
                for ctx in context:
                    if ctx.lower() in text_lower:
                        intent = f"context_{ctx.lower()}"
                        break
            
            # Use ML-based intent classification if available
            if self.intent_classifier and intent is None:
                try:
                    result = self.intent_classifier(text)
                    if result and len(result) > 0:
                        intent = result[0]['label']
                except Exception as e:
                    logger.warning(f"Intent classification failed: {e}")
            
            return intent, entities
            
        except Exception as e:
            logger.error(f"Intent/entity extraction failed: {e}")
            return None, {}

def main():
    parser = argparse.ArgumentParser(description='Advanced ASR Engine for JASON')
    parser.add_argument('--input', required=True, help='Input audio file path')
    parser.add_argument('--language', default='en-US', help='Language code')
    parser.add_argument('--context', help='Context keywords (JSON array)')
    
    args = parser.parse_args()
    
    try:
        # Parse context
        context = None
        if args.context:
            context = json.loads(args.context)
        
        asr = AdvancedASR()
        result = asr.recognize(
            audio_path=args.input,
            language=args.language,
            context=context
        )
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        logger.error(f"ASR failed: {e}")
        error_result = {
            "text": "",
            "confidence": 0.0,
            "alternatives": [],
            "intent": None,
            "entities": {},
            "error": str(e)
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()#!/usr/bin/env python3
"""
Advanced Automatic Speech Recognition Engine for JASON
Supports multiple ASR backends with context and intent recognition
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

class AdvancedASR:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.models = {}
        self.intent_classifier = None
        self.load_models()
    
    def load_models(self):
        """Load ASR models"""
        try:
            # Try to load Whisper
            try:
                import whisper
                self.models['whisper'] = whisper.load_model("base")
                logger.info("Loaded Whisper ASR model")
            except ImportError:
                logger.warning("Whisper not available")
            
            # Try to load Wav2Vec2
            try:
                from transformers import Wav2Vec2ForCTC, Wav2Vec2Tokenizer
                self.models['wav2vec2_tokenizer'] = Wav2Vec2Tokenizer.from_pretrained("facebook/wav2vec2-base-960h")
                self.models['wav2vec2'] = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
                logger.info("Loaded Wav2Vec2 ASR model")
            except ImportError:
                logger.warning("Wav2Vec2 not available")
            
            # Try to load SpeechRecognition
            try:
                import speech_recognition as sr
                self.models['speech_recognition'] = sr.Recognizer()
                logger.info("Loaded SpeechRecognition library")
            except ImportError:
                logger.warning("SpeechRecognition not available")
            
            # Load intent classification model
            try:
                from transformers import pipeline
                self.intent_classifier = pipeline("text-classification", 
                                                model="microsoft/DialoGPT-medium")
                logger.info("Loaded intent classification model")
            except ImportError:
                logger.warning("Intent classification not available")
                
        except Exception as e:
            logger.error(f"Error loading ASR models: {e}")
    
    def recognize(self, audio_path, language='en-US', context=None):
        """Recognize speech from audio file"""
        
        try:
            # Choose best available model
            if 'whisper' in self.models:
                return self._recognize_whisper(audio_path, language, context)
            elif 'wav2vec2' in self.models:
                return self._recognize_wav2vec2(audio_path, language, context)
            elif 'speech_recognition' in self.models:
                return self._recognize_speech_recognition(audio_path, language, context)
            else:
                raise Exception("No ASR engine available")
                
        except Exception as e:
            logger.error(f"ASR recognition failed: {e}")
            # Fallback to simple recognition
            return self._recognize_fallback(audio_path, language, context)
    
    def _recognize_whisper(self, audio_path, language, context):
        """Recognize using Whisper"""
        try:
            model = self.models['whisper']
            
            # Load and preprocess audio
            audio = whisper.load_audio(audio_path)
            audio = whisper.pad_or_trim(audio)
            
            # Make log-Mel spectrogram
            mel = whisper.log_mel_spectrogram(audio).to(model.device)
            
            # Detect language if not specified
            if language == 'auto':
                _, probs = model.detect_language(mel)
                language = max(probs, key=probs.get)
            
            # Decode the audio
            options = whisper.DecodingOptions(language=language[:2] if language != 'auto' else None)
            result = whisper.decode(model, mel, options)
            
            # Extract text and confidence
            text = result.text.strip()
            confidence = 1.0 - result.avg_logprob  # Rough confidence estimate
            
            # Generate alternatives (simplified)
            alternatives = [
                {"text": text, "confidence": confidence},
                {"text": text.lower(), "confidence": confidence * 0.9},
                {"text": text.upper(), "confidence": confidence * 0.8}
            ]
            
            # Perform intent recognition
            intent, entities = self._extract_intent_entities(text, context)
            
            return {
                "text": text,
                "confidence": confidence,
                "alternatives": alternatives,
                "intent": intent,
                "entities": entities,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Whisper ASR failed: {e}")
            raise
    
    def _recognize_wav2vec2(self, audio_path, language, context):
        """Recognize using Wav2Vec2"""
        try:
            tokenizer = self.models['wav2vec2_tokenizer']
            model = self.models['wav2vec2']
            
            # Load audio
            waveform, sample_rate = torchaudio.load(audio_path)
            
            # Resample to 16kHz if needed
            if sample_rate != 16000:
                resampler = torchaudio.transforms.Resample(sample_rate, 16000)
                waveform = resampler(waveform)
            
            # Ensure mono
            if waveform.shape[0] > 1:
                waveform = torch.mean(waveform, dim=0, keepdim=True)
            
            # Tokenize
            input_values = tokenizer(waveform.squeeze().numpy(), 
                                   return_tensors="pt", 
                                   sampling_rate=16000).input_values
            
            # Get logits
            with torch.no_grad():
                logits = model(input_values).logits
            
            # Decode
            predicted_ids = torch.argmax(logits, dim=-1)
            transcription = tokenizer.decode(predicted_ids[0])
            
            # Clean up transcription
            text = transcription.strip()
            confidence = 0.8  # Rough estimate
            
            # Generate alternatives
            alternatives = [
                {"text": text, "confidence": confidence},
                {"text": text.lower(), "confidence": confidence * 0.9}
            ]
            
            # Perform intent recognition
            intent, entities = self._extract_intent_entities(text, context)
            
            return {
                "text": text,
                "confidence": confidence,
                "alternatives": alternatives,
                "intent": intent,
                "entities": entities,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Wav2Vec2 ASR failed: {e}")
            raise
    
    def _recognize_speech_recognition(self, audio_path, language, context):
        """Recognize using SpeechRecognition library"""
        try:
            import speech_recognition as sr
            
            recognizer = self.models['speech_recognition']
            
            # Load audio file
            with sr.AudioFile(audio_path) as source:
                audio = recognizer.record(source)
            
            # Try multiple recognition engines
            results = []
            
            # Google Speech Recognition
            try:
                text = recognizer.recognize_google(audio, language=language)
                results.append({"text": text, "confidence": 0.9, "engine": "google"})
            except sr.UnknownValueError:
                pass
            except sr.RequestError:
                pass
            
            # Sphinx (offline)
            try:
                text = recognizer.recognize_sphinx(audio)
                results.append({"text": text, "confidence": 0.7, "engine": "sphinx"})
            except sr.UnknownValueError:
                pass
            except sr.RequestError:
                pass
            
            if not results:
                raise Exception("No recognition results")
            
            # Use best result
            best_result = max(results, key=lambda x: x["confidence"])
            text = best_result["text"]
            confidence = best_result["confidence"]
            
            # Generate alternatives from all results
            alternatives = [{"text": r["text"], "confidence": r["confidence"]} for r in results]
            
            # Perform intent recognition
            intent, entities = self._extract_intent_entities(text, context)
            
            return {
                "text": text,
                "confidence": confidence,
                "alternatives": alternatives,
                "intent": intent,
                "entities": entities,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"SpeechRecognition ASR failed: {e}")
            raise
    
    def _recognize_fallback(self, audio_path, language, context):
        """Fallback recognition"""
        try:
            # Try using system speech recognition tools
            import subprocess
            
            # Try using macOS speech recognition
            try:
                # This is a simplified approach - real implementation would be more complex
                result = subprocess.run(['say', '--file-format=WAVE', '--data-format=LEI16@22050', 
                                       '--channels=1', audio_path], 
                                      capture_output=True, text=True)
                
                if result.returncode == 0:
                    # This is a placeholder - actual speech recognition would be needed
                    text = "Speech recognition not available"
                    confidence = 0.1
                else:
                    raise Exception("System speech recognition failed")
                    
            except FileNotFoundError:
                # No system tools available
                text = "Speech recognition not available"
                confidence = 0.1
            
            return {
                "text": text,
                "confidence": confidence,
                "alternatives": [{"text": text, "confidence": confidence}],
                "intent": None,
                "entities": {},
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Fallback ASR failed: {e}")
            raise
    
    def _extract_intent_entities(self, text, context):
        """Extract intent and entities from text"""
        try:
            # Simple rule-based intent detection
            text_lower = text.lower()
            intent = None
            entities = {}
            
            # Intent detection patterns
            if any(word in text_lower for word in ['show', 'display', 'camera', 'security']):
                intent = 'show_cameras'
            elif any(word in text_lower for word in ['light', 'lamp', 'brightness']):
                intent = 'control_lights'
                # Extract room entity
                for word in ['living room', 'bedroom', 'kitchen', 'bathroom']:
                    if word in text_lower:
                        entities['room'] = word
                        break
            elif any(word in text_lower for word in ['play', 'music', 'song']):
                intent = 'play_music'
                # Extract song/artist entity
                if 'play ' in text_lower:
                    song_part = text_lower.split('play ')[1]
                    entities['song'] = song_part.strip()
            elif any(word in text_lower for word in ['weather', 'temperature', 'forecast']):
                intent = 'weather'
                # Extract location entity
                for word in ['in', 'at', 'for']:
                    if word in text_lower:
                        location_part = text_lower.split(word)[1].strip()
                        entities['location'] = location_part
                        break
            elif any(word in text_lower for word in ['status', 'devices', 'system']):
                intent = 'device_status'
            elif any(word in text_lower for word in ['continue', 'switch', 'move', 'handoff']):
                intent = 'handoff'
                # Extract target device
                if 'to ' in text_lower:
                    device_part = text_lower.split('to ')[1].strip()
                    entities['target_device'] = device_part
            
            # Use context to improve intent detection
            if context and not intent:
                for ctx in context:
                    if ctx.lower() in text_lower:
                        intent = f"context_{ctx.lower()}"
                        break
            
            # Use ML-based intent classification if available
            if self.intent_classifier and intent is None:
                try:
                    result = self.intent_classifier(text)
                    if result and len(result) > 0:
                        intent = result[0]['label']
                except Exception as e:
                    logger.warning(f"Intent classification failed: {e}")
            
            return intent, entities
            
        except Exception as e:
            logger.error(f"Intent/entity extraction failed: {e}")
            return None, {}

def main():
    parser = argparse.ArgumentParser(description='Advanced ASR Engine for JASON')
    parser.add_argument('--input', required=True, help='Input audio file path')
    parser.add_argument('--language', default='en-US', help='Language code')
    parser.add_argument('--context', help='Context keywords (JSON array)')
    
    args = parser.parse_args()
    
    try:
        # Parse context
        context = None
        if args.context:
            context = json.loads(args.context)
        
        asr = AdvancedASR()
        result = asr.recognize(
            audio_path=args.input,
            language=args.language,
            context=context
        )
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        logger.error(f"ASR failed: {e}")
        error_result = {
            "text": "",
            "confidence": 0.0,
            "alternatives": [],
            "intent": None,
            "entities": {},
            "error": str(e)
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()