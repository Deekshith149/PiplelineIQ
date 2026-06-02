import logging
from typing import Dict, Any
from src.models.state import AnalysisState
from src.parser.regex_parser import RegexParser

logger = logging.getLogger("ci_cd_analyzer.parser_agent")

class ParserAgent:
    """LangGraph node agent wrapping the RegexParser."""

    def __init__(self):
        self.parser = RegexParser()

    def __call__(self, state: AnalysisState) -> Dict[str, Any]:
        """LangGraph node execution function."""
        logger.info("Executing Regex Parser Agent Node")
        
        raw_log = state.get("raw_log")
        if not raw_log:
            error_msg = "Regex Parser Node failed: 'raw_log' is missing in state."
            logger.error(error_msg)
            existing_errors = state.get("errors", [])
            return {"errors": existing_errors + [error_msg]}

        metadata = state.get("metadata", {})
        platform_hint = metadata.get("platform")

        try:
            parsed_log = self.parser.parse(raw_log, platform_hint=platform_hint)
            
            # Enrich metadata with detected platform
            updated_metadata = dict(metadata)
            if parsed_log.job_names:
                updated_metadata["platform"] = parsed_log.job_names[0]

            logger.info("Regex Parser Agent successfully updated state.")
            return {
                "parsed_log": parsed_log,
                "metadata": updated_metadata
            }
        except Exception as e:
            error_msg = f"Regex Parser Node exception: {str(e)}"
            logger.exception(error_msg)
            existing_errors = state.get("errors", [])
            return {"errors": existing_errors + [error_msg]}
