#!/usr/bin/env python3
"""
Initialize and test AI components of JASON system
"""
import os
import sys
import json
import argparse
import tensorflow as tf
import torch
import numpy as np
from pathlib import Path

def create_sample_model():
    """Create a sample PyTorch model for testing"""
    try:
        # Simple feed-forward network for intent classification
        model = torch.nn.Sequential(
            torch.nn.Linear(128, 64),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.2),
            torch.nn.Linear(64, 32),
            torch.nn.ReLU(),
            torch.nn.Linear(32, 10),
            torch.nn.Softmax(dim=1)
        )
        
        # Save model
        models_dir = Path('models')
        models_dir.mkdir(exist_ok=True)
        
        torch.save(model.state_dict(), models_dir / 'device-intent.pt')
        print("Created sample device intent model")
        
        # Create pattern predictor model
        pattern_model = torch.nn.Sequential(
            torch.nn.LSTM(10, 20, num_layers=2, batch_first=True),
            torch.nn.Linear(20, 10)
        )
        
        torch.save(pattern_model.state_dict(), models_dir / 'pattern-predictor.pt')
        print("Created sample pattern predictor model")
        
        return True
    except Exception as e:
        print(f"Error creating sample models: {str(e)}")
        return False

def test_model_inference():
    """Test model inference with sample data"""
    try:
        sample_input = {
            "command": {
                "type": "setState",
                "params": {"power": True}
            },
            "currentState": {"power": False},
            "deviceType": "light"
        }
        
        # Run inference script
        script_path = Path('scripts') / 'run_model.py'
        model_path = Path('models') / 'device-intent.pt'
        
        cmd = f'python3 {script_path} --model {model_path} --input \'{json.dumps(sample_input)}\''
        
        result = os.system(cmd)
        if result == 0:
            print("Model inference test passed")
            return True
        else:
            print("Model inference test failed")
            return False
    except Exception as e:
        print(f"Error testing model inference: {str(e)}")
        return False

def create_test_data():
    """Create test data for models"""
    try:
        data_dir = Path('data')
        data_dir.mkdir(exist_ok=True)
        
        # Create sample device patterns
        patterns = {
            "device-1": {
                "type": "light",
                "patterns": [
                    {
                        "time": "08:00",
                        "state": {"power": True, "brightness": 80},
                        "confidence": 0.9
                    },
                    {
                        "time": "23:00",
                        "state": {"power": False},
                        "confidence": 0.95
                    }
                ]
            }
        }
        
        with open(data_dir / 'sample_patterns.json', 'w') as f:
            json.dump(patterns, f, indent=2)
            
        print("Created sample test data")
        return True
    except Exception as e:
        print(f"Error creating test data: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Initialize JASON AI components')
    parser.add_argument('--create-models', action='store_true', help='Create sample AI models')
    parser.add_argument('--test-inference', action='store_true', help='Test model inference')
    parser.add_argument('--create-data', action='store_true', help='Create sample test data')
    
    args = parser.parse_args()
    success = True
    
    if args.create_models:
        success &= create_sample_model()
    
    if args.create_data:
        success &= create_test_data()
    
    if args.test_inference:
        success &= test_model_inference()
    
    if not any(vars(args).values()):
        # If no arguments provided, run all
        success &= create_sample_model()
        success &= create_test_data()
        success &= test_model_inference()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
