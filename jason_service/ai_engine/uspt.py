import os
import json
import logging
import re
import numpy as np
import torch
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, PeftModel
from datasets import Dataset
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.sentiment import SentimentIntensityAnalyzer

@dataclass
class StyleProfile:
    """User writing style profile with lexical and syntactic features."""
    lexical_density: float  # Ratio of content words to total words
    avg_sentence_length: float
    formality_score: float  # 0 = very casual, 1 = very formal
    slang_usage: List[str]  # Common slang/phrases used
    emoji_usage: Dict[str, int]  # Emoji frequency
    punctuation_patterns: Dict[str, float]  # Punctuation preferences
    sentiment_bias: float  # General sentiment tendency

class USPT:
    """Production-ready User Style & Preference Trainer with 4-bit quantized LoRA fine-tuning.
    
    This class implements local-only AI processing to learn user writing style from
    IMAP/chat history based on Lexical Density, Syntactic Structure, and Slang vectors.
    """
    
    def __init__(self, model_name="mistralai/Mistral-7B-Instruct-v0.2", output_dir="./data/models/uspt"):
        self.model_name = model_name
        self.output_dir = output_dir
        self.model = None
        self.tokenizer = None
        self.style_profile = None
        
        # Ensure directories exist
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(os.path.dirname(output_dir), exist_ok=True)
        
        # Download NLTK data if needed
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        try:
            nltk.data.find('sentiment/vader_lexicon.zip')
        except LookupError:
            nltk.download('vader_lexicon')
        
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
        
        logging.info(f"USPT initialized with model: {model_name}")
    
    def _initialize_model_and_tokenizer(self):
        """Initializes the model and tokenizer with 4-bit quantization for local processing."""
        logging.info("Initializing 4-bit quantized model...")
        
        # Configure 4-bit quantization
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16
        )

        # Load base model
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            quantization_config=bnb_config,
            device_map="auto",
            torch_dtype=torch.bfloat16,
            trust_remote_code=True
        )

        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        logging.info("Model and tokenizer initialized successfully")
    
    def analyze_user_style(self, text_samples: List[str]) -> StyleProfile:
        """Analyze user writing style from text samples.
        
        Args:
            text_samples: List of user's text messages/emails
            
        Returns:
            StyleProfile with extracted features
        """
        logging.info(f"Analyzing user style from {len(text_samples)} samples")
        
        all_text = " ".join(text_samples)
        words = word_tokenize(all_text.lower())
        sentences = sent_tokenize(all_text)
        
        # Lexical density calculation
        content_words = [w for w in words if w.isalpha() and len(w) > 3]  # Simple heuristic
        lexical_density = len(content_words) / len(words) if words else 0
        
        # Average sentence length
        avg_sentence_length = np.mean([len(word_tokenize(s)) for s in sentences]) if sentences else 0
        
        # Formality score (based on formal/informal word usage)
        formal_words = ['therefore', 'furthermore', 'consequently', 'however', 'nevertheless']
        informal_words = ['lol', 'btw', 'omg', 'idk', 'tbh', 'fr', 'ngl']
        
        formal_count = sum(1 for w in words if w in formal_words)
        informal_count = sum(1 for w in words if w in informal_words)
        formality_score = formal_count / (formal_count + informal_count + 1)
        
        # Slang usage detection
        slang_patterns = [
            r'\b(lol|lmao|rofl)\b', r'\b(btwn|bc|bcoz)\b', r'\b(omg|omfg)\b',
            r'\b(idk|idc)\b', r'\b(tbh|tbf)\b', r'\b(fr|frfr|ngl)\b',
            r'\b(gtg|brb|afk)\b', r'\b(sth|smth)\b'
        ]
        slang_usage = []
        for pattern in slang_patterns:
            matches = re.findall(pattern, all_text, re.IGNORECASE)
            slang_usage.extend(matches)
        
        # Emoji usage
        emoji_pattern = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]')
        emojis = emoji_pattern.findall(all_text)
        emoji_counts = {}
        for emoji in emojis:
            emoji_counts[emoji] = emoji_counts.get(emoji, 0) + 1
        
        # Punctuation patterns
        punctuation_patterns = {
            'exclamation_ratio': all_text.count('!') / len(sentences) if sentences else 0,
            'question_ratio': all_text.count('?') / len(sentences) if sentences else 0,
            'comma_ratio': all_text.count(',') / len(words) if words else 0
        }
        
        # Sentiment bias
        sentiments = [self.sentiment_analyzer.polarity_scores(text)['compound'] for text in text_samples]
        sentiment_bias = np.mean(sentiments) if sentiments else 0
        
        self.style_profile = StyleProfile(
            lexical_density=lexical_density,
            avg_sentence_length=avg_sentence_length,
            formality_score=formality_score,
            slang_usage=list(set(slang_usage)),
            emoji_usage=emoji_counts,
            punctuation_patterns=punctuation_patterns,
            sentiment_bias=sentiment_bias
        )
        
        logging.info(f"Style profile created: lexical_density={lexical_density:.2f}, "
                    f"formality={formality_score:.2f}, sentiment_bias={sentiment_bias:.2f}")
        
        return self.style_profile

    def prepare_training_data(self, text_samples: List[str]) -> Dataset:
        """Prepare training data for LoRA fine-tuning with style-aware formatting."""
        logging.info("Preparing training data for LoRA fine-tuning...")
        
        training_examples = []
        
        for text in text_samples:
            if len(text.strip()) < 10:  # Skip very short texts
                continue
                
            # Create instruction-response pairs based on user style
            instruction = "Generate a response in the user's writing style:"
            
            # Format for Mistral instruction format
            formatted_text = f"<s>[INST] {instruction}\n\nContext: {text[:200]}... [/INST] {text} </s>"
            
            training_examples.append({"text": formatted_text})
        
        # Create dataset
        dataset = Dataset.from_list(training_examples)
        
        logging.info(f"Prepared {len(training_examples)} training examples")
        return dataset
    
    def train(self, text_samples: List[str], epochs: int = 3, batch_size: int = 4):
        """Fine-tunes the model on user's text data with LoRA.
        
        Args:
            text_samples: List of user's text messages/emails
            epochs: Number of training epochs
            batch_size: Training batch size
        """
        logging.info(f"Starting LoRA fine-tuning on {len(text_samples)} samples...")
        
        # Analyze user style first
        self.analyze_user_style(text_samples)
        
        # Initialize model if needed
        if self.model is None or self.tokenizer is None:
            self._initialize_model_and_tokenizer()
        
        # Prepare training data
        dataset = self.prepare_training_data(text_samples)
        
        # Configure LoRA for efficient fine-tuning
        lora_config = LoraConfig(
            r=16,  # Rank
            lora_alpha=32,
            target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=0.1,
            bias="none",
            task_type="CAUSAL_LM",
            inference_mode=False
        )
        
        # Apply LoRA
        self.model = get_peft_model(self.model, lora_config)
        self.model.print_trainable_parameters()
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=epochs,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=1,
            warmup_steps=100,
            logging_steps=10,
            save_steps=500,
            eval_steps=500,
            learning_rate=2e-4,
            fp16=True,  # Use mixed precision
            logging_dir=f"{self.output_dir}/logs",
            report_to=None,  # Disable wandb/etc for privacy
            dataloader_pin_memory=False,
            remove_unused_columns=False,
        )
        
        # Create trainer
        trainer = Trainer(
            model=self.model,
            train_dataset=dataset,
            args=training_args,
            data_collator=lambda data: {
                'input_ids': self.tokenizer(
                    [d['text'] for d in data], 
                    padding=True, 
                    truncation=True, 
                    max_length=512, 
                    return_tensors='pt'
                )['input_ids'],
                'attention_mask': self.tokenizer(
                    [d['text'] for d in data], 
                    padding=True, 
                    truncation=True, 
                    max_length=512, 
                    return_tensors='pt'
                )['attention_mask'],
                'labels': self.tokenizer(
                    [d['text'] for d in data], 
                    padding=True, 
                    truncation=True, 
                    max_length=512, 
                    return_tensors='pt'
                )['input_ids']
            }
        )
        
        # Train the model
        trainer.train()
        
        # Save the fine-tuned model
        trainer.save_model()
        self.tokenizer.save_pretrained(self.output_dir)
        
        # Save style profile
        profile_path = os.path.join(self.output_dir, "style_profile.json")
        with open(profile_path, 'w') as f:
            json.dump(self.style_profile.__dict__, f, indent=2)
        
        logging.info(f"LoRA fine-tuning completed. Model saved to {self.output_dir}")
    
    def load_finetuned_model(self):
        """Load the fine-tuned LoRA model."""
        if os.path.exists(os.path.join(self.output_dir, "adapter_config.json")):
            logging.info("Loading fine-tuned LoRA model...")
            
            # Load base model
            self._initialize_model_and_tokenizer()
            
            # Load LoRA adapter
            self.model = PeftModel.from_pretrained(self.model, self.output_dir)
            
            # Load style profile
            profile_path = os.path.join(self.output_dir, "style_profile.json")
            if os.path.exists(profile_path):
                with open(profile_path, 'r') as f:
                    profile_data = json.load(f)
                self.style_profile = StyleProfile(**profile_data)
                logging.info("Style profile loaded successfully")
            
            logging.info("Fine-tuned model loaded successfully")
        else:
            logging.warning("No fine-tuned model found. Using base model.")
    
    def generate_text(self, prompt: str, max_length: int = 200, style_guidance: bool = True) -> str:
        """Generate text using the fine-tuned model with user style.
        
        Args:
            prompt: Input prompt for text generation
            max_length: Maximum length of generated text
            style_guidance: Whether to apply user style guidance
            
        Returns:
            Generated text in user's style
        """
        if self.model is None or self.tokenizer is None:
            self.load_finetuned_model()
            if self.model is None:
                self._initialize_model_and_tokenizer()
        
        # Add style guidance if available
        if style_guidance and self.style_profile:
            style_prompt = self._create_style_prompt()
            full_prompt = f"<s>[INST] {style_prompt}\n\n{prompt} [/INST]"
        else:
            full_prompt = f"<s>[INST] {prompt} [/INST]"
        
        # Tokenize input
        inputs = self.tokenizer(full_prompt, return_tensors="pt", truncation=True, max_length=512)
        
        # Generate with parameters for user-style consistency
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                temperature=0.7 if self.style_profile and self.style_profile.formality_score < 0.5 else 0.8,
                do_sample=True,
                top_p=0.9,
                top_k=50,
                repetition_penalty=1.1,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id
            )
        
        # Decode and clean output
        generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the response part (remove instruction)
        if "[/INST]" in generated_text:
            generated_text = generated_text.split("[/INST]")[1].strip()
        
        # Apply post-processing for style consistency
        if style_guidance and self.style_profile:
            generated_text = self._apply_style_postprocessing(generated_text)
        
        return generated_text
    
    def _create_style_prompt(self) -> str:
        """Create style guidance prompt based on user profile."""
        if not self.style_profile:
            return ""
        
        style_elements = []
        
        if self.style_profile.formality_score > 0.7:
            style_elements.append("Write in a formal, professional tone")
        elif self.style_profile.formality_score < 0.3:
            style_elements.append("Write in a casual, conversational tone")
        
        if self.style_profile.slang_usage:
            style_elements.append(f"Feel free to use slang like: {', '.join(self.style_profile.slang_usage[:3])}")
        
        if self.style_profile.avg_sentence_length < 10:
            style_elements.append("Keep sentences relatively short and concise")
        elif self.style_profile.avg_sentence_length > 20:
            style_elements.append("Use longer, more complex sentences")
        
        return "Style requirements: " + "; ".join(style_elements) + "."
    
    def _apply_style_postprocessing(self, text: str) -> str:
        """Apply post-processing to match user style patterns."""
        if not self.style_profile:
            return text
        
        # Adjust punctuation based on user patterns
        if self.style_profile.punctuation_patterns.get('exclamation_ratio', 0) > 0.3:
            # Add more exclamation marks for enthusiastic users
            text = re.sub(r'([.!?])\s*$', lambda m: '!' if m.group(1) in '.!' else m.group(1), text)
        
        # Add emojis if user uses them frequently
        if len(self.style_profile.emoji_usage) > 0:
            # Simple emoji insertion logic
            if np.random.random() < 0.2:  # 20% chance to add emoji
                common_emoji = list(self.style_profile.emoji_usage.keys())[0]
                text += f" {common_emoji}"
        
        return text
    
    def get_style_summary(self) -> Dict[str, Any]:
        """Get a summary of the learned user style."""
        if not self.style_profile:
            return {"error": "No style profile available"}
        
        return {
            "lexical_density": round(self.style_profile.lexical_density, 3),
            "avg_sentence_length": round(self.style_profile.avg_sentence_length, 1),
            "formality_score": round(self.style_profile.formality_score, 2),
            "common_slang": self.style_profile.slang_usage[:5],
            "favorite_emojis": list(self.style_profile.emoji_usage.keys())[:3],
            "sentiment_tendency": "positive" if self.style_profile.sentiment_bias > 0.1 else "negative" if self.style_profile.sentiment_bias < -0.1 else "neutral",
            "model_trained": os.path.exists(os.path.join(self.output_dir, "adapter_config.json"))
        }
