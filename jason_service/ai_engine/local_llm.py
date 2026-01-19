import requests
import logging
import json

class LocalLLM:
    """
    Interface for Local Large Language Models (LLMs) via Ollama.
    "Maximum" capability requires a real local LLM.
    """
    def __init__(self, model=None, base_url="http://localhost:11434"):
        import os
        self.model = model or os.getenv("OLLAMA_MODEL", "moondream")
        self.base_url = base_url
        self.available = self._check_availability()
        
        if self.available:
            logging.info(f"Local LLM connected: {model} at {base_url}")
        else:
            logging.warning(f"Local LLM not found at {base_url}. 'Super-Creator' capabilities will be limited.")

    def _check_availability(self):
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except:
            return False

    def generate(self, prompt, system_prompt="You are JASON, an advanced AI architect."):
        """
        Generates text using the local LLM.
        """
        if not self.available:
            logging.warning("Local LLM not available. Returning mock response.")
            return f"[Simulated Content]: {prompt[:50]}..."

        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False
        }
        
        try:
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            return response.json().get("response", "")
        except Exception as e:
            logging.error(f"LLM generation failed: {e}")
            return f"[Error Generating Content]: {e}"

    def generate_json(self, prompt, schema_description):
        """
        Generates structured JSON content.
        """
        system_prompt = f"You are a JSON generator. Output ONLY valid JSON based on this schema: {schema_description}"
        response = self.generate(prompt, system_prompt)
        
        # Simple cleanup to find JSON in response
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != -1:
                return json.loads(response[start:end])
            return json.loads(response) # Try parsing raw
        except:
            logging.error("Failed to parse JSON from LLM response")
            return None
