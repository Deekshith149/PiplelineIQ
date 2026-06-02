import logging
from typing import Dict, Any, List
from src.models.state import AnalysisState, RemediationResult, RecommendedFix
from src.services.gemini_service import GeminiService

logger = logging.getLogger("ci_cd_analyzer.remediation_agent")

class RemediationAgent:
    """LangGraph node agent responsible for generating actionable fixes and remediations via Gemini."""

    def __init__(self):
        self.gemini_service = GeminiService()

    def __call__(self, state: AnalysisState) -> Dict[str, Any]:
        """LangGraph node execution function."""
        logger.info("Executing Gemini Remediation Agent Node")
        
        root_cause_res = state.get("root_cause")
        parsed_log = state.get("parsed_log")
        classification = state.get("classification")
        
        if not root_cause_res or not root_cause_res.root_cause:
            error_msg = "Remediation Agent Node failed: 'root_cause' analysis is missing in state."
            logger.error(error_msg)
            existing_errors = state.get("errors", [])
            return {
                "remediation": RemediationResult(recommended_fixes=[], priority="medium"),
                "errors": existing_errors + [error_msg]
            }

        # Extract values
        root_cause = root_cause_res.root_cause
        errors = parsed_log.errors if parsed_log else []
        failure_type = classification.failure_type if classification else "Unknown Failure"

        try:
            result = self.gemini_service.analyze_remediation(
                root_cause=root_cause,
                errors=errors,
                failure_type=failure_type
            )
            
            # Map recommended fixes to Pydantic objects
            fixes: List[RecommendedFix] = []
            for item in result.get("recommended_fixes", []):
                fixes.append(RecommendedFix(
                    fix=item.get("fix", "No fix described."),
                    priority=item.get("priority", "medium"),
                    explanation=item.get("explanation", "")
                ))
                
            remediation_result = RemediationResult(
                recommended_fixes=fixes,
                priority=result.get("priority", "medium")
            )
            
            logger.info("Gemini Remediation Agent successfully generated suggestions.")
            return {
                "remediation": remediation_result,
                "reremediation": remediation_result  # Robust mapping
            }
        except Exception as e:
            error_msg = f"Remediation Agent Node exception: {str(e)}"
            logger.exception(error_msg)
            existing_errors = state.get("errors", [])
            return {
                "remediation": RemediationResult(recommended_fixes=[], priority="medium"),
                "errors": existing_errors + [error_msg]
            }
