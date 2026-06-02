import logging
from typing import Dict, Any
from src.config import settings
from src.models.state import AnalysisState, ClassificationResult
from src.classifier.distilbert_classifier import DistilBertClassifier

logger = logging.getLogger("ci_cd_analyzer.classification_agent")

class ClassificationAgent:
    """LangGraph workflow agent node wrapping the DistilBERT model classifier."""

    def __init__(self):
        # Initialise classifier singleton
        self.classifier = DistilBertClassifier(settings.distilbert_model_path)

    def __call__(self, state: AnalysisState) -> Dict[str, Any]:
        """LangGraph node execution function."""
        logger.info("Executing DistilBERT Failure Classification Agent Node")
        
        parsed_log = state.get("parsed_log")
        if not parsed_log:
            error_msg = "Classification Agent Node failed: 'parsed_log' is missing in state."
            logger.error(error_msg)
            existing_errors = state.get("errors", [])
            return {
                "classification": ClassificationResult(failure_type="Unknown Failure", confidence=0.0),
                "errors": existing_errors + [error_msg]
            }

        # Combine top error lines and stages to provide context to the classifier
        error_context = ""
        if parsed_log.errors:
            error_context += " ".join(parsed_log.errors[:3])
        if parsed_log.stack_traces:
            error_context += " " + " ".join(parsed_log.stack_traces[:1])
            
        # Fallback if no error lines were captured but we have warnings or text
        if not error_context.strip():
            error_context = " ".join(parsed_log.warnings[:3]) or "Unknown Build Failure"

        stages = parsed_log.stages or []

        try:
            prediction = self.classifier.predict(error_context, parsed_stages=stages)
            
            classification_result = ClassificationResult(
                failure_type=prediction["failure_type"],
                confidence=prediction["confidence"]
            )
            
            logger.info(
                f"DistilBERT Classification Agent successfully predicted category: "
                f"'{classification_result.failure_type}' with confidence {classification_result.confidence:.2f}."
            )
            return {
                "classification": classification_result
            }
        except Exception as e:
            error_msg = f"Classification Agent Node exception: {str(e)}"
            logger.exception(error_msg)
            existing_errors = state.get("errors", [])
            return {
                "classification": ClassificationResult(failure_type="Unknown Failure", confidence=0.0),
                "errors": existing_errors + [error_msg]
            }
