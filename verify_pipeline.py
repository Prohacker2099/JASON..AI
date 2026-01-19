import logging
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from jason_service.ai_engine.local_llm import LocalLLM
from jason_service.content_generation.presentation_generator import PresentationGenerator

# Setup logging
logging.basicConfig(level=logging.INFO)

def test_pipeline():
    print("Testing JASON Content Generation Pipeline...")
    
    # 1. Initialize LLM (will likely fallback to mock in this env)
    llm = LocalLLM(model="mistral")
    
    if llm.available:
        print("✅ Local LLM is ONLINE")
    else:
        print("⚠️ Local LLM is OFFLINE (using fallback/mock)")
        
    # 2. Initialize Generator
    generator = PresentationGenerator(local_llm=llm, output_dir="./test_output")
    
    # 3. Generate
    prompt = "The Future of AI Agents"
    try:
        path = generator.create_presentation(prompt, target_slides=3)
        print(f"✅ Presentation generated successfully at: {path}")
        
        # Verify file exists
        if os.path.exists(path):
            print("✅ File verified on disk")
        else:
            print("❌ File NOT found on disk")
            
    except Exception as e:
        print(f"❌ Generation failed: {e}")

if __name__ == "__main__":
    test_pipeline()
