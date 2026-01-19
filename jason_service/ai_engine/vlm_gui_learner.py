import os
import logging
import json
import numpy as np
import torch
import cv2
import pytesseract
from typing import Dict, List, Tuple, Any, Optional, Union
from dataclasses import dataclass
from PIL import Image, ImageGrab
import re
import requests
import base64

@dataclass
class UIElement:
    """Represents a detected UI element with semantic information."""
    element_type: str  # button, text_field, dropdown, etc.
    text: str
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    confidence: float
    semantic_meaning: str
    action_hints: List[str]

@dataclass
class ScreenAnalysis:
    """Complete analysis of a screen with semantic understanding."""
    ui_elements: List[UIElement]
    layout_description: str
    semantic_groups: Dict[str, List[UIElement]]
    navigation_paths: List[List[str]]
    confidence_score: float

class UniversalGUILearner:
    """Universal GUI Learning with VLM for Semantic Bridging.
    
    Implements lightweight local VLM (Moondream2 / LLaVA-Phi-3) for interpreting
    UI layouts and enabling cross-platform application control through semantic understanding.
    """
    
    def __init__(self, model_name="moondream:latest", output_dir="./data/models/vlm"):
        self.model_name = model_name
        self.output_dir = output_dir
        self.ollama_url = "http://localhost:11434"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Semantic mapping for common UI patterns
        self.semantic_patterns = {
            'submit_buttons': ['submit', 'send', 'turn in', 'done', 'finish', 'complete'],
            'navigation': ['back', 'next', 'previous', 'continue', 'cancel'],
            'input_fields': ['text', 'email', 'password', 'search', 'type'],
            'file_operations': ['upload', 'download', 'save', 'export', 'import'],
            'educational': ['assignment', 'homework', 'quiz', 'test', 'lesson', 'course']
        }
        
        # Ensure directories exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize OCR
        try:
            if os.name == 'nt':
                # Common Windows installation paths
                win_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                    os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Tesseract-OCR', 'tesseract.exe')
                ]
                for p in win_paths:
                    if os.path.exists(p):
                        pytesseract.pytesseract.tesseract_cmd = p
                        logging.info(f"Tesseract found at: {p}")
                        break
            else:
                pytesseract.pytesseract.tesseract_cmd = r'/usr/local/bin/tesseract'  # macOS path
        except Exception as e:
            logging.warning(f"Tesseract search failed: {e}")
        
        # Initialize model/processor placeholders for VLM
        self.model = None
        self.processor = None
        self.available = False
        
        logging.info(f"Universal GUI Learner initialized with model: {model_name}")
    
    def _initialize_vlm(self):
        """Check if Ollama is available with the required model."""
        logging.info("Checking Ollama VLM connectivity...")
        try:
            response = requests.get(f"{self.ollama_url}/api/tags")
            if response.status_code == 200:
                models = [m['name'] for m in response.json().get('models', [])]
                if self.model_name in models or any(self.model_name in m for m in models):
                    logging.info(f"Ollama VLM initialized with model: {self.model_name}")
                    self.available = True
                    self.model = self.model_name # Set model name so health check passes
                else:
                    logging.warning(f"Model {self.model_name} not found in Ollama. Will attempt to pull or use fallback.")
            else:
                logging.error("Ollama service not responding correctly.")
        except Exception as e:
            logging.error(f"Failed to connect to Ollama: {e}")
    
    def capture_screen(self, region: Optional[Tuple[int, int, int, int]] = None) -> np.ndarray:
        """Capture screen or specific region for analysis.
        
        Args:
            region: (x1, y1, x2, y2) coordinates for specific region
            
        Returns:
            numpy array of the captured image
        """
        try:
            if region:
                # Capture specific region
                screenshot = ImageGrab.grab(bbox=region)
            else:
                # Capture entire screen
                screenshot = ImageGrab.grab()
            
            # Convert to numpy array
            image = np.array(screenshot)
            
            # Convert RGB to BGR for OpenCV processing
            if len(image.shape) == 3 and image.shape[2] == 3:
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            return image
        except Exception as e:
            logging.error(f"Failed to capture screen: {e}")
            raise
    
    def extract_text_elements(self, image: np.ndarray) -> List[Dict]:
        """Extract text elements from screen using OCR."""
        try:
            # Convert to PIL Image for OCR
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            
            # Extract text with bounding boxes
            data = pytesseract.image_data(pil_image, output_type=pytesseract.Output.DICT)
            
            text_elements = []
            for i in range(len(data['text'])):
                if data['text'][i].strip():
                    element = {
                        'text': data['text'][i].strip(),
                        'bbox': (
                            data['left'][i],
                            data['top'][i],
                            data['left'][i] + data['width'][i],
                            data['top'][i] + data['height'][i]
                        ),
                        'confidence': float(data['conf'][i]) / 100.0
                    }
                    text_elements.append(element)
            
            return text_elements
        except Exception as e:
            logging.warning(f"OCR extraction failed: {e}")
            return []
    
    def detect_ui_elements(self, image: np.ndarray) -> List[UIElement]:
        """Detect and classify UI elements using computer vision."""
        elements = []
        
        # Extract text elements first
        text_elements = self.extract_text_elements(image)
        
        # Classify text elements based on semantic patterns
        for text_elem in text_elements:
            text = text_elem['text'].lower()
            bbox = text_elem['bbox']
            confidence = text_elem['confidence']
            
            # Determine element type and semantic meaning
            element_type, semantic_meaning, action_hints = self._classify_text_element(text)
            
            ui_element = UIElement(
                element_type=element_type,
                text=text_elem['text'],
                bbox=bbox,
                confidence=confidence,
                semantic_meaning=semantic_meaning,
                action_hints=action_hints
            )
            elements.append(ui_element)
        
        # Detect non-text UI elements using contour detection
        non_text_elements = self._detect_graphical_elements(image)
        elements.extend(non_text_elements)
        
        return elements
    
    def _classify_text_element(self, text: str) -> Tuple[str, str, List[str]]:
        """Classify text element based on semantic patterns."""
        text_lower = text.lower()
        
        # Check for button patterns
        for category, keywords in self.semantic_patterns.items():
            if any(keyword in text_lower for keyword in keywords):
                if category == 'submit_buttons':
                    return 'button', 'submit_action', ['click', 'activate']
                elif category == 'navigation':
                    return 'button', 'navigation', ['click', 'navigate']
                elif category == 'input_fields':
                    return 'input_field', 'text_input', ['type', 'enter_text']
                elif category == 'file_operations':
                    return 'button', 'file_action', ['click', 'interact']
                elif category == 'educational':
                    return 'educational_element', 'academic_content', ['read', 'interact']
        
        # Default classification based on text characteristics
        if len(text) < 3:
            return 'label', 'short_label', ['read']
        elif text.endswith('.com') or '@' in text:
            return 'link', 'hyperlink', ['click', 'navigate']
        elif text.isnumeric():
            return 'number', 'numeric_value', ['read']
        else:
            return 'text', 'content', ['read']
    
    def _detect_graphical_elements(self, image: np.ndarray) -> List[UIElement]:
        """Detect graphical UI elements using contour analysis."""
        elements = []
        
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply threshold to get binary image
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            
            # Find contours
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                # Filter small contours
                area = cv2.contourArea(contour)
                if area < 100 or area > 50000:  # Filter too small or too large
                    continue
                
                # Get bounding box
                x, y, w, h = cv2.boundingRect(contour)
                
                # Classify shape
                aspect_ratio = w / h
                if 0.8 <= aspect_ratio <= 1.2:
                    element_type = 'square_button'
                elif aspect_ratio > 2:
                    element_type = 'horizontal_button'
                elif aspect_ratio < 0.5:
                    element_type = 'vertical_button'
                else:
                    element_type = 'rectangular_element'
                
                ui_element = UIElement(
                    element_type=element_type,
                    text='',
                    bbox=(x, y, x + w, y + h),
                    confidence=0.7,
                    semantic_meaning='interactive_element',
                    action_hints=['click']
                )
                elements.append(ui_element)
        
        except Exception as e:
            logging.warning(f"Graphical element detection failed: {e}")
        
        return elements
    
    def analyze_screen_semantics(self, image: np.ndarray) -> ScreenAnalysis:
        """Perform complete semantic analysis of the screen."""
        if self.model is None or self.processor is None:
            # Only attempt initialization if it hasn't been attempted before or we really need it
            # But here we assume jason_engine tried and failed, so we just log and proceed with OCR
            logging.warning("VLM model not online. Proceeding with OCR/Graphical analysis only.")
        
        logging.info("Performing semantic screen analysis...")
        
        # Detect UI elements
        ui_elements = self.detect_ui_elements(image)
        
        # Generate layout description using VLM
        layout_description = self._generate_layout_description(image)
        
        # Group elements semantically
        semantic_groups = self._group_elements_semantically(ui_elements)
        
        # Identify navigation paths
        navigation_paths = self._identify_navigation_paths(ui_elements)
        
        # Calculate overall confidence
        confidence_score = np.mean([elem.confidence for elem in ui_elements]) if ui_elements else 0.0
        
        analysis = ScreenAnalysis(
            ui_elements=ui_elements,
            layout_description=layout_description,
            semantic_groups=semantic_groups,
            navigation_paths=navigation_paths,
            confidence_score=confidence_score
        )
        
        logging.info(f"Screen analysis completed: {len(ui_elements)} elements, confidence: {confidence_score:.2f}")
        return analysis
    
    def _generate_layout_description(self, image: np.ndarray) -> str:
        """Generate natural language description of the layout using Ollama VLM."""
        try:
            # Convert OpenCV image to base64
            _, buffer = cv2.imencode('.jpg', image)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            prompt = "Describe the layout of this user interface, including the main sections, buttons, and interactive elements."
            
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "images": [img_base64],
                "stream": False
            }
            
            response = requests.post(f"{self.ollama_url}/api/generate", json=payload, timeout=60)
            if response.status_code == 200:
                return response.json().get("response", "").strip()
            else:
                logging.warning(f"Ollama vision request failed: {response.text}")
                return "Ollama vision analysis failed."
                
        except Exception as e:
            logging.warning(f"Ollama layout description failed: {e}")
            return "Unable to generate layout description"
    
    def _group_elements_semantically(self, elements: List[UIElement]) -> Dict[str, List[UIElement]]:
        """Group UI elements by semantic meaning."""
        groups = {
            'navigation': [],
            'input': [],
            'actions': [],
            'content': [],
            'educational': []
        }
        
        for element in elements:
            if element.semantic_meaning == 'navigation':
                groups['navigation'].append(element)
            elif element.semantic_meaning == 'text_input':
                groups['input'].append(element)
            elif element.semantic_meaning in ['submit_action', 'file_action']:
                groups['actions'].append(element)
            elif element.semantic_meaning == 'academic_content':
                groups['educational'].append(element)
            else:
                groups['content'].append(element)
        
        return groups
    
    def _identify_navigation_paths(self, elements: List[UIElement]) -> List[List[str]]:
        """Identify potential navigation paths through the interface."""
        paths = []
        
        # Find submit/turn-in paths (important for homework submission)
        submit_elements = [e for e in elements if 'turn in' in e.text.lower() or 'submit' in e.text.lower()]
        if submit_elements:
            paths.append(['navigate_to_form', 'fill_fields', 'click_submit'])
        
        # Find navigation flows
        nav_elements = [e for e in elements if e.semantic_meaning == 'navigation']
        if len(nav_elements) >= 2:
            paths.append(['click_back', 'navigate_forward'])
        
        return paths
    
    def find_element_by_semantic(self, analysis: ScreenAnalysis, semantic_query: str) -> Optional[UIElement]:
        """Find UI element by semantic meaning."""
        query_lower = semantic_query.lower()
        
        for element in analysis.ui_elements:
            # Check text match
            if query_lower in element.text.lower():
                return element
            
            # Check semantic meaning
            if query_lower in element.semantic_meaning.lower():
                return element
            
            # Check action hints
            if any(query_lower in hint.lower() for hint in element.action_hints):
                return element
        
        return None
    
    def get_element_coordinates(self, element: UIElement) -> Tuple[int, int]:
        """Get click coordinates for UI element."""
        x1, y1, x2, y2 = element.bbox
        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2
        return (center_x, center_y)
    
    def save_analysis(self, analysis: ScreenAnalysis, filepath: str):
        """Save screen analysis to file."""
        data = {
            'layout_description': analysis.layout_description,
            'confidence_score': analysis.confidence_score,
            'ui_elements': [
                {
                    'element_type': elem.element_type,
                    'text': elem.text,
                    'bbox': elem.bbox,
                    'confidence': elem.confidence,
                    'semantic_meaning': elem.semantic_meaning,
                    'action_hints': elem.action_hints
                }
                for elem in analysis.ui_elements
            ],
            'semantic_groups': {
                group: [
                    {
                        'element_type': elem.element_type,
                        'text': elem.text,
                        'bbox': elem.bbox
                    }
                    for elem in elements
                ]
                for group, elements in analysis.semantic_groups.items()
            },
            'navigation_paths': analysis.navigation_paths
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        logging.info(f"Screen analysis saved to {filepath}")
    
    def load_analysis(self, filepath: str) -> Optional[ScreenAnalysis]:
        """Load screen analysis from file."""
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            # Reconstruct UI elements
            ui_elements = []
            for elem_data in data['ui_elements']:
                element = UIElement(
                    element_type=elem_data['element_type'],
                    text=elem_data['text'],
                    bbox=tuple(elem_data['bbox']),
                    confidence=elem_data['confidence'],
                    semantic_meaning=elem_data['semantic_meaning'],
                    action_hints=elem_data['action_hints']
                )
                ui_elements.append(element)
            
            # Reconstruct semantic groups
            semantic_groups = {}
            for group_name, elements_data in data['semantic_groups'].items():
                elements = []
                for elem_data in elements_data:
                    element = UIElement(
                        element_type=elem_data['element_type'],
                        text=elem_data['text'],
                        bbox=tuple(elem_data['bbox']),
                        confidence=1.0,
                        semantic_meaning='',
                        action_hints=[]
                    )
                    elements.append(element)
                semantic_groups[group_name] = elements
            
            analysis = ScreenAnalysis(
                ui_elements=ui_elements,
                layout_description=data['layout_description'],
                semantic_groups=semantic_groups,
                navigation_paths=data['navigation_paths'],
                confidence_score=data['confidence_score']
            )
            
            return analysis
        except Exception as e:
            logging.error(f"Failed to load analysis: {e}")
            return None
