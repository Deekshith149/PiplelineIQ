import logging
from datetime import datetime
from typing import Dict, Any
from src.models.state import AnalysisState, FinalReport

logger = logging.getLogger("ci_cd_analyzer.reporting_agent")

class ReportingAgent:
    """LangGraph node agent responsible for compiling all intermediate agent results

    into a clean, structured FinalReport JSON schema.
    """

    def __call__(self, state: AnalysisState) -> Dict[str, Any]:
        """LangGraph node execution function."""
        logger.info("Executing Reporting Agent Node")
        
        metadata = state.get("metadata", {})
        classification = state.get("classification")
        root_cause_res = state.get("root_cause")
        remediation_res = state.get("remediation") or state.get("reremediation")

        # 1. Platform name
        pipeline_platform = metadata.get("platform", "Unknown").capitalize()

        # 2. Failure Details
        failure_type = "Unknown Failure"
        class_conf = 0.0
        if classification:
            failure_type = classification.failure_type
            class_conf = classification.confidence

        # 3. Root Cause Details
        root_cause = "No root cause identified."
        rc_conf = 0.0
        evidence = []
        if root_cause_res:
            root_cause = root_cause_res.root_cause
            rc_conf = root_cause_res.confidence
            evidence = root_cause_res.evidence

        # 4. Remediation Details
        recommended_fixes = []
        if remediation_res:
            recommended_fixes = remediation_res.recommended_fixes

        # 5. Build Executive Summary
        summary = (
            f"The {pipeline_platform} pipeline failed due to a '{failure_type}' "
            f"(confidence: {class_conf:.0%}). "
        )
        if root_cause_res and root_cause_res.root_cause:
            summary += f"The identified root cause is: {root_cause} "
        else:
            summary += "No clear root cause could be established from the logs. "
            
        if recommended_fixes:
            summary += f"We have generated {len(recommended_fixes)} actionable remediation fix(es) to resolve this."
        else:
            summary += "Please review the raw execution logs for further details."

        try:
            final_report = FinalReport(
                pipeline_platform=pipeline_platform,
                failure_type=failure_type,
                classification_confidence=class_conf,
                root_cause=root_cause,
                root_cause_confidence=rc_conf,
                evidence=evidence,
                recommended_fixes=recommended_fixes,
                summary=summary,
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info("Reporting Agent successfully compiled final report.")
            return {
                "final_report": final_report
            }
        except Exception as e:
            error_msg = f"Reporting Agent Node exception: {str(e)}"
            logger.exception(error_msg)
            existing_errors = state.get("errors", [])
            return {
                "final_report": FinalReport(
                    pipeline_platform=pipeline_platform,
                    summary=f"Failed to generate full report: {str(e)}"
                ),
                "errors": existing_errors + [error_msg]
            }
