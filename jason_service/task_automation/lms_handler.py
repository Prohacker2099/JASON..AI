import logging
import json
import os
from selenium import webdriver

class LMSHandler:
    """Handles task submission on web platforms using VLM and Ghost Hand."""

    def __init__(self, vlm, ghost_hand):
        self.vlm = vlm
        self.ghost_hand = ghost_hand
        self.driver = None

    def start_session(self, browser='chrome'):
        """Starts a new browser session and returns its PID."""
        if browser == 'chrome':
            self.driver = webdriver.Chrome()
            return self.driver.service.process.pid
        else:
            raise NotImplementedError(f"Browser '{browser}' is not supported.")

    def navigate_to(self, url):
        """Navigates to a given URL."""
        if self.driver:
            self.driver.get(url)

    def find_and_click_button(self, button_text, window_id):
        """Uses VLM to find a button and Ghost Hand to click it non-interruptively."""
        screenshot_path = "./screenshot.png"
        self.driver.save_screenshot(screenshot_path)

        prompt = f'Find the center coordinates of the button with text "{button_text}". Respond in JSON format: {{"x": value, "y": value}}.'
        
        try:
            response = self.vlm.analyze_image(screenshot_path, prompt)
            # Clean and parse the JSON response from the VLM
            json_response = response[response.find('{'):response.rfind('}')+1]
            coords = json.loads(json_response)
            x, y = int(coords['x']), int(coords['y'])

            logging.info(f"VLM identified '{button_text}' at coordinates ({x}, {y}).")
            self.ghost_hand.send_mouse_click(x, y, window_id)
            os.remove(screenshot_path) # Clean up screenshot
            return True
        except (json.JSONDecodeError, KeyError, FileNotFoundError) as e:
            logging.error(f"Failed to find and click button '{button_text}': {e}")
            if os.path.exists(screenshot_path):
                os.remove(screenshot_path)
            return False

    def close_session(self):
        """Closes the browser session."""
        if self.driver:
            self.driver.quit()

# Example usage:
if __name__ == '__main__':
    # This is a conceptual example. It requires the VLM and GhostHand to be instantiated.
    # from jason_service.ai_engine.vlm import VLM
    # from jason_service.ghost_hand.macos_control import MacOSGhostHand
    # vlm = VLM()
    # ghost_hand = MacOSGhostHand()
    # handler = LMSHandler(vlm, ghost_hand)
    # handler.start_session()
    # handler.navigate_to("https://classroom.google.com")
    # handler.find_and_click_button("Turn In")
    # handler.close_session()
    print("LMS Handler conceptual example run complete.")
