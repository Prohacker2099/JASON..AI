#!/bin/bash

# Script to download AI models for JASON

# Create models directory if it doesn't exist
mkdir -p models

# Download GPT4All-J model
if [ ! -f "models/ggml-gpt4all-j.bin" ]; then
    echo "Downloading GPT4All-J model..."
    curl -L -o models/ggml-gpt4all-j.bin https://gpt4all.io/models/ggml-gpt4all-j.bin
    echo "GPT4All-J model downloaded successfully."
else
    echo "GPT4All-J model already exists."
fi

# Download additional models as needed
# For example, a smaller model for faster responses
if [ ! -f "models/ggml-gpt4all-j-mini.bin" ]; then
    echo "Downloading GPT4All-J mini model..."
    curl -L -o models/ggml-gpt4all-j-mini.bin https://huggingface.co/TheBloke/ggml-gpt4all-j-mini/resolve/main/ggml-gpt4all-j-mini-f16.bin
    echo "GPT4All-J mini model downloaded successfully."
else
    echo "GPT4All-J mini model already exists."
fi

# Download Whisper model for voice recognition
if [ ! -f "models/ggml-whisper-base.bin" ]; then
    echo "Downloading Whisper base model..."
    curl -L -o models/ggml-whisper-base.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
    echo "Whisper base model downloaded successfully."
else
    echo "Whisper base model already exists."
fi

echo "All models downloaded successfully."