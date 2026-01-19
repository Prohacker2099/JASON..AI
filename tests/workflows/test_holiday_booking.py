import requests
import time
import json
import logging
import os

# Configure test logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("HolidayBookingTest")

ENGINE_URL = "http://localhost:8000"

def test_engine_health():
    """Verify JASON Engine is running"""
    try:
        resp = requests.get(f"{ENGINE_URL}/health", timeout=5)
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"Engine Health: {data}")
        return data.get("status") == "online"
    except Exception as e:
        logger.error(f"Engine health check failed: {e}")
        return False

def test_transcription_simulation():
    """Simulate sending a voice command 'Book a holiday to Tokyo'"""
    # Create a dummy wav file
    dummy_wav = "test_command.wav"
    with open(dummy_wav, "wb") as f:
        # Write 1KB of silence/junk just to test the endpoint parsing
        f.write(os.urandom(1024))
        
    try:
        # Send raw file
        with open(dummy_wav, "rb") as f:
            files = {'file': (dummy_wav, f, 'audio/wav')}
            resp = requests.post(
                f"{ENGINE_URL}/transcribe", 
                files=files,
                data={'language': 'en'}
            )
        
        # We expect a success response even if transcription is garbage (since it's random noise)
        # In a real test we'd use a real recording.
        logger.info(f"Transcription Response: {resp.status_code} - {resp.text}")
        if resp.status_code == 200:
            return True
            
    except Exception as e:
        logger.error(f"Transcription test failed: {e}")
        pass
    finally:
        if os.path.exists(dummy_wav):
            os.remove(dummy_wav)
            
    return False

def test_ui_action_simulation():
    """Simulate a UI click action via the engine"""
    try:
        payload = {
            "action_type": "click",
            "parameters": {
                "x": 100, 
                "y": 100,
                "clicks": 1
            }
        }
        resp = requests.post(f"{ENGINE_URL}/execute_ui_action", json=payload)
        logger.info(f"UI Action Response: {resp.status_code} - {resp.text}")
        return resp.status_code == 200
    except Exception as e:
        logger.error(f"UI Action test failed: {e}")
        return False

def main():
    logger.info("Starting Holiday Booking Integration Verification...")
    
    if not test_engine_health():
        logger.error("❌ CRTICAL: JASON Engine is not running or accessible.")
        return

    logger.info("✅ Engine is Online.")
    
    if test_transcription_simulation():
        logger.info("✅ Transcription Endpoint Verified.")
    else:
        logger.warning("⚠️ Transcription Endpoint Verification Failed.")

    if test_ui_action_simulation():
        logger.info("✅ UI Action Endpoint Verified.")
    else:
        logger.warning("⚠️ UI Action Endpoint Verification Failed.")

    logger.info("Verification Complete.")

if __name__ == "__main__":
    main()
