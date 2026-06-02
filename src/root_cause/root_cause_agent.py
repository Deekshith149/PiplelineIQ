import logging
from typing import Dict, Any
from src.models.state import AnalysisState, RootCauseResult
from src.services.gemini_service import GeminiService

logger = logging.getLogger("ci_cd_analyzer.root_cause_agent")

class RootCauseAgent:
    """LangGraph node agent responsible for identifying pipeline failure root causes via Gemini."""

    def __init__(self):
        self.gemini_service = GeminiService()

    def __call__(self, state: AnalysisState) -> Dict[str, Any]:
        """LangGraph node execution function."""
        logger.info("Executing Gemini Root Cause Agent Node")
        
        parsed_log = state.get("parsed_log")
        classification = state.get("classification")
        
        if not parsed_log:
            error_msg = "Root Cause Agent Node failed: 'parsed_log' is missing in state."
            logger.error(error_msg)
            existing_errors = state.get("errors", [])
            return {
                "root_cause": RootCauseResult(root_cause=error_msg, evidence=[], confidence=0.0),
                "errors": existing_errors + [error_msg]
            }

        # Extract values
        errors = parsed_log.errors or []
        warnings = parsed_log.warnings or []
        stack_traces = parsed_log.stack_traces or []
        stages = parsed_log.stages or []
        failure_type = classification.failure_type if classification else "Unknown Failure"

        try:
            result = self.gemini_service.analyze_root_cause(
                errors=errors,
                warnings=warnings,
                stack_traces=stack_traces,
                stages=stages,
                failure_type=failure_type
            )
            
            root_cause_result = RootCauseResult(
                root_cause=result["root_cause"],
                evidence=result["evidence"],
                confidence=result["confidence"]
            )
            
            logger.info("Gemini Root Cause Agent successfully analyzed root cause.")
            return {
                "root_cause": root_cause_result
            }
        except Exception as e:
            error_msg = f"Root Cause Agent Node exception: {str(e)}"
            logger.exception(error_msg)
            existing_errors = state.get("errors", [])
            return {
                "root_cause": RootCauseResult(root_cause=f"Analysis failed: {str(e)}", evidence=[], confidence=0.0),
                "errors": existing_errors + [error_msg]
            }
