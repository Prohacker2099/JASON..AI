import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from PIL import Image

class VLM:
    """Visual Language Model (VLM) for GUI interpretation."""
    def __init__(self, model_name="vikhyatk/moondream2", revision="2024-05-20"):
        self.model_name = model_name
        self.revision = revision
        self.model = None
        self.tokenizer = None

    def _initialize_model(self):
        """Initializes the VLM model and tokenizer."""
        try:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name, 
                trust_remote_code=True, 
                revision=self.revision,
                torch_dtype=dtype,
                device_map="auto" if device == "cuda" else None
            )
            
            if device == "cpu":
                self.model = self.model.to("cpu")
                
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, revision=self.revision)
        except Exception as e:
            print(f"[VLM] Error initializing model: {e}")
            raise

    def analyze_image(self, image_path, prompt):
        """Analyzes an image with a given prompt.

        Args:
            image_path: The path to the image file.
            prompt: The text prompt to guide the analysis.

        Returns:
            The model's response as a string.
        """
        if self.model is None:
            self._initialize_model()

        try:
            image = Image.open(image_path)
            enc_image = self.model.encode_image(image)
            
            response = self.model.answer_question(
                enc_image,
                prompt,
                self.tokenizer
            )
            return response
        except Exception as e:
            print(f"[VLM] Error analyzing image: {e}")
            return f"Error: {str(e)}"
