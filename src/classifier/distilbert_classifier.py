import os
import re
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("ci_cd_analyzer.distilbert_classifier")

# Constant failure classes
FAILURE_CLASSES = [
    "Build Failure",
    "Compilation Failure",
    "Dependency Failure",
    "Test Failure",
    "Docker Failure",
    "Kubernetes Failure",
    "Infrastructure Failure",
    "Environment Failure",
    "Deployment Failure",
    "Security Failure",
    "Unknown Failure"
]

class DistilBertClassifier:
    """Production-ready classifier wrapping a PyTorch sequence classification model

    and supporting custom checkpoints, training preparation, and high-quality zero-shot fallbacks.
    """

    def __init__(self, model_path_or_name: str = "distilbert-base-uncased", load_now: bool = False):
        self.model_path_or_name = model_path_or_name
        try:
            import torch
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            self.device = "cpu"
        self.tokenizer = None
        self.model = None
        self._is_fine_tuned = False

        # Only load now if explicitly requested or if a local custom path exists
        # This prevents blocking on remote Hugging Face model downloads in local tests/runs
        is_local_path = os.path.exists(self.model_path_or_name)
        if load_now or is_local_path:
            self.load_model()

    def load_model(self) -> None:
        """Loads the tokenizer and model from model_path_or_name."""
        logger.info(f"Loading tokenizer and model from: {self.model_path_or_name}")
        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path_or_name)
            
            # Check if this looks like a fine-tuned model with our specific labels
            # In a real setup, a config file will show num_labels
            num_labels = len(FAILURE_CLASSES)
            
            # If the path exists locally, try loading the custom sequence classifier
            if os.path.exists(self.model_path_or_name):
                self.model = AutoModelForSequenceClassification.from_pretrained(
                    self.model_path_or_name,
                    num_labels=num_labels
                )
                self._is_fine_tuned = True
                logger.info("Custom fine-tuned DistilBERT classification model loaded successfully.")
            else:
                # Vanilla model. If vanilla model is loaded, we can initialize it, 
                # but we note it is not fine-tuned yet.
                self.model = AutoModelForSequenceClassification.from_pretrained(
                    self.model_path_or_name,
                    num_labels=num_labels
                )
                logger.warning(
                    f"Loaded vanilla '{self.model_path_or_name}' model. "
                    "Classification head has random weights and requires training/fine-tuning. "
                    "Rule-based/Heuristic classification will be used as a smart fallback until fine-tuned."
                )
            
            self.model.to(self.device)
            self.model.eval()
            
        except Exception as e:
            logger.error(f"Error loading DistilBERT model: {str(e)}")
            # Tokenizer/model might fail to download or be missing. We allow soft failures.
            self.tokenizer = None
            self.model = None

    def classify_heuristically(self, error_text: str, parsed_stages: List[str] = None) -> Dict[str, Any]:
        """A robust, deterministic rule-based classifier that acts as an optimal fallback

        when a fine-tuned sequence classification model is not yet trained.
        """
        text = error_text.lower()
        stages = [s.lower() for s in (parsed_stages or [])]

        # 1. Security Failure
        if any(w in text for w in ["security", "vulnerability", "audit", "trivy", "snyk", "leak", "unauthorized", "api key", "token"]):
            return {"failure_type": "Security Failure", "confidence": 0.95}

        # 2. Docker Failure
        if any(w in text for w in ["docker", "container", "dockerfile", "daemon", "docker-compose", "image build", "push image"]):
            return {"failure_type": "Docker Failure", "confidence": 0.90}

        # 3. Kubernetes Failure
        if any(w in text for w in ["kubernetes", "kubectl", "kube", "helm", "pod ", "deployment.apps", "ingress", "namespace"]):
            return {"failure_type": "Kubernetes Failure", "confidence": 0.92}

        # 4. Dependency Failure
        if any(w in text for w in ["pip install", "npm install", "yarn install", "composer install", "requirements.txt", "package.json", "maven", "gradle", "unresolved dependency", "could not resolve", "nuget"]):
            return {"failure_type": "Dependency Failure", "confidence": 0.95}

        # 5. Compilation Failure
        if any(w in text for w in ["compilation failed", "syntaxerror", "compile", "gcc", "clang", "tsc ", "type error", "compile error", "build error in syntax", "undefined variable", "cannot find symbol", "cannot be resolved", "compilation error"]):
            return {"failure_type": "Compilation Failure", "confidence": 0.92}

        # 6. Test Failure
        if any(w in text for w in ["test failed", "pytest", "junit", "mocha", "jest", "assertionerror", "failures:", "tests failed", "spec failed"]):
            return {"failure_type": "Test Failure", "confidence": 0.96}

        # 7. Deployment Failure
        if any(w in text for w in ["deploy", "publish", "aws s3", "serverless", "vercel", "heroku", "artifact upload", "cloudformation", "terraform apply"]):
            return {"failure_type": "Deployment Failure", "confidence": 0.88}

        # 8. Infrastructure Failure
        if any(w in text for w in ["runner connection", "lost connection", "runner went offline", "agent lost", "cannot connect to docker daemon", "disk full", "out of memory", "oom-killer", "network timeout"]):
            return {"failure_type": "Infrastructure Failure", "confidence": 0.85}

        # 9. Environment Failure
        if any(w in text for w in ["python not found", "node not found", "command not found", "env: ", "missing environment variable", "java_home", "invalid credentials", "permission denied", "auth failed"]):
            return {"failure_type": "Environment Failure", "confidence": 0.89}

        # 10. Build Failure (Generic)
        if any(w in text for w in ["build failed", "exit code 1", "exit status 1", "task failed", "make: ***"]):
            return {"failure_type": "Build Failure", "confidence": 0.70}

        # Stage context fallbacks
        if any("test" in s for s in stages):
            return {"failure_type": "Test Failure", "confidence": 0.65}
        if any("build" in s or "compile" in s for s in stages):
            return {"failure_type": "Build Failure", "confidence": 0.60}
        if any("deploy" in s or "release" in s for s in stages):
            return {"failure_type": "Deployment Failure", "confidence": 0.65}

        return {"failure_type": "Unknown Failure", "confidence": 0.50}

    def predict(self, text: str, parsed_stages: List[str] = None) -> Dict[str, Any]:
        """Performs classification on the cleaned log/error text.

        If a fine-tuned model is loaded, it executes forward pass.
        Otherwise, it falls back to high-quality heuristics.
        """
        # Always clean text
        cleaned_text = self.clean_text(text)
        if not cleaned_text:
            return {"failure_type": "Unknown Failure", "confidence": 0.50}

        if self._is_fine_tuned and self.model and self.tokenizer:
            try:
                import torch
                inputs = self.tokenizer(
                    cleaned_text,
                    return_tensors="pt",
                    truncation=True,
                    max_length=512,
                    padding=True
                )
                # Send to GPU/CPU
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    logits = outputs.logits
                    probabilities = torch.softmax(logits, dim=1)
                    confidence, class_idx = torch.max(probabilities, dim=1)
                    
                    label = FAILURE_CLASSES[class_idx.item()]
                    return {
                        "failure_type": label,
                        "confidence": float(confidence.item())
                    }
            except Exception as e:
                logger.error(f"DistilBERT inference error: {str(e)}. Falling back to heuristics.")

        # Mode B: Fallback to heuristics (always active if vanilla or on error)
        return self.classify_heuristically(cleaned_text, parsed_stages)

    @staticmethod
    def clean_text(text: str) -> str:
        """Removes excessive whitespace and limits length for classification."""
        if not text:
            return ""
        # Collapse multiple spaces/newlines
        text = re.sub(r"\s+", " ", text)
        return text.strip()[:1000]  # First 1000 characters are more than enough for classification
