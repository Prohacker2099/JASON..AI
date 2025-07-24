#!/usr/bin/env python3
"""
Model Runner Script
Executes AI models for the JASON system's local AI integration
"""

import argparse
import json
import sys
import os
import numpy as np
import tensorflow as tf
import torch
from transformers import pipeline

def load_model(model_path):
    """Load an AI model based on its file type"""
    if model_path.endswith('.pt'):
        # PyTorch model
        return torch.load(model_path)
    elif model_path.endswith('.h5'):
        # TensorFlow model
        return tf.keras.models.load_model(model_path)
    else:
        raise ValueError(f'Unsupported model format: {model_path}')

def preprocess_input(input_data):
    """Preprocess input data for model inference"""
    if isinstance(input_data, list):
        return np.array(input_data)
    elif isinstance(input_data, dict):
        # Handle structured input
        return {k: np.array(v) if isinstance(v, list) else v 
                for k, v in input_data.items()}
    else:
        return input_data

def run_inference(model, input_data):
    """Run model inference"""
    try:
        if isinstance(model, torch.nn.Module):
            # PyTorch model
            model.eval()
            with torch.no_grad():
                output = model(torch.tensor(input_data))
                return output.numpy()
        else:
            # TensorFlow model
            output = model.predict(input_data)
            return output
    except Exception as e:
        print(f'Error during inference: {str(e)}', file=sys.stderr)
        sys.exit(1)

def calculate_confidence(output):
    """Calculate confidence score for model output"""
    if isinstance(output, np.ndarray):
        if output.size == 0:
            return 0.0
        if len(output.shape) == 1:
            # For classification output
            return float(np.max(output))
        else:
            # For other types of output
            return float(np.mean(np.abs(output)))
    else:
        return 0.5  # Default confidence

def main():
    parser = argparse.ArgumentParser(description='Run AI model inference')
    parser.add_argument('--model', required=True, help='Path to model file')
    parser.add_argument('--input', required=True, help='Input data as JSON string')
    
    args = parser.parse_args()
    
    try:
        # Load model
        model = load_model(args.model)
        
        # Parse and preprocess input
        input_data = json.loads(args.input)
        processed_input = preprocess_input(input_data)
        
        # Run inference
        output = run_inference(model, processed_input)
        
        # Calculate confidence
        confidence = calculate_confidence(output)
        
        # Prepare result
        result = {
            'output': output.tolist() if isinstance(output, np.ndarray) else output,
            'confidence': confidence
        }
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(f'Error: {str(e)}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
