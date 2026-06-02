import logging
from typing import Dict, Any, List
from langgraph.graph import StateGraph, START, END
from src.models.state import AnalysisState, FinalReport

# Import Agents
from src.ingestion.ingestion_agent import LogIngestionAgent
from src.parser.parser_agent import ParserAgent
from src.classifier.classification_agent import ClassificationAgent
from src.root_cause.root_cause_agent import RootCauseAgent
from src.remediation.remediation_agent import RemediationAgent
from src.reporting.reporting_agent import ReportingAgent

logger = logging.getLogger("ci_cd_analyzer.workflows")

# Initialize agent singletons/instances
ingestion_agent = LogIngestionAgent()
parser_agent = ParserAgent()
classification_agent = ClassificationAgent()
root_cause_agent = RootCauseAgent()
remediation_agent = RemediationAgent()
reporting_agent = ReportingAgent()

# Define Node wrapper functions for complete resilience and logging
def ingest_node(state: AnalysisState) -> Dict[str, Any]:
    logger.info("--- STARTING WORKFLOW: LOG INGESTION ---")
    raw_log = state.get("raw_log", "")
    metadata = state.get("metadata", {})
    filename = metadata.get("source", "raw_text_input")
    
    try:
        result = ingestion_agent.ingest(raw_log, filename=filename)
        # Update metadata while keeping any existing values (like platform hint)
        updated_metadata = {**metadata, **result["metadata"]}
        return {
            "raw_log": result["raw_log"],
            "metadata": updated_metadata,
            "errors": state.get("errors", [])
        }
    except Exception as e:
        error_msg = f"Log Ingestion step failed: {str(e)}"
        logger.error(error_msg)
        existing_errors = state.get("errors", [])
        return {
            "errors": existing_errors + [error_msg]
        }

def parse_node(state: AnalysisState) -> Dict[str, Any]:
    logger.info("--- RUNNING: REGEX PARSER AGENT ---")
    return parser_agent(state)

def classify_node(state: AnalysisState) -> Dict[str, Any]:
    logger.info("--- RUNNING: DISTILBERT CLASSIFIER AGENT ---")
    return classification_agent(state)

def root_cause_node(state: AnalysisState) -> Dict[str, Any]:
    logger.info("--- RUNNING: GEMINI ROOT CAUSE AGENT ---")
    return root_cause_agent(state)

def remediate_node(state: AnalysisState) -> Dict[str, Any]:
    logger.info("--- RUNNING: GEMINI REMEDIATION AGENT ---")
    return remediation_agent(state)

def report_node(state: AnalysisState) -> Dict[str, Any]:
    logger.info("--- COMPILING WORKFLOW: FINAL REPORTING ---")
    return reporting_agent(state)

# Construct State Graph
workflow = StateGraph(AnalysisState)

# 1. Add all nodes
workflow.add_node("ingest", ingest_node)
workflow.add_node("parse", parse_node)
workflow.add_node("classify", classify_node)
workflow.add_node("root_cause", root_cause_node)
workflow.add_node("remediate", remediate_node)
workflow.add_node("report", report_node)

# 2. Add edges to enforce strictly sequential pipeline flow
workflow.add_edge(START, "ingest")
workflow.add_edge("ingest", "parse")
workflow.add_edge("parse", "classify")
workflow.add_edge("classify", "root_cause")
workflow.add_edge("root_cause", "remediate")
workflow.add_edge("remediate", "report")
workflow.add_edge("report", END)

# 3. Compile the graph
logger.info("Compiling LangGraph Workflow State Graph...")
log_analysis_graph = workflow.compile()
logger.info("LangGraph Workflow State Graph compiled successfully.")

def run_log_analysis(raw_log: str, filename: str = "input_log.log", platform_hint: str = None) -> AnalysisState:
    """Executes the full CI/CD log analysis graph synchronously."""
    initial_state: AnalysisState = {
        "raw_log": raw_log,
        "metadata": {
            "source": filename,
            "platform": platform_hint
        },
        "errors": []
    }
    
    logger.info(f"Starting pipeline execution for: {filename}")
    final_state = log_analysis_graph.invoke(initial_state)
    logger.info("Pipeline execution finished successfully.")
    return final_state
