import logging
import sys
import os

sys.path.append(os.getcwd())

logging.basicConfig(level=logging.INFO)

def test_ghost_hand():
    print("Testing Windows Ghost Hand Instantiation...")
    if sys.platform != "win32":
        print("Skipping Windows test on non-Windows OS")
        return

    try:
        from jason_service.ghost_hand.windows_control import WindowsGhostHand
        gh = WindowsGhostHand()
        print("✅ WindowsGhostHand instantiated successfully")
        
        info = gh.get_system_info()
        print(f"System Info: {info}")
        
    except Exception as e:
        print(f"❌ Failed to instantiate WindowsGhostHand: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ghost_hand()
