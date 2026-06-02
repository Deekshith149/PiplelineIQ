import os
from src.workflows.log_analysis_graph import run_log_analysis

def get_sample_log(filename: str) -> str:
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "sample_logs", filename)
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def test_github_workflow_execution():
    log_text = get_sample_log("github_error.log")
    
    # Run the full LangGraph pipeline
    final_state = run_log_analysis(log_text, filename="github_error.log")
    
    assert final_state["parsed_log"] is not None
    assert final_state["classification"] is not None
    assert final_state["classification"].failure_type == "Dependency Failure"
    
    report = final_state["final_report"]
    assert report is not None
    assert report.pipeline_platform == "Github"
    assert report.failure_type == "Dependency Failure"
    assert "requirements.txt" in report.root_cause
    assert len(report.recommended_fixes) > 0

def test_jenkins_workflow_execution():
    log_text = get_sample_log("jenkins_error.log")
    
    final_state = run_log_analysis(log_text, filename="jenkins_error.log")
    
    assert final_state["parsed_log"] is not None
    assert final_state["classification"].failure_type == "Compilation Failure"
    
    report = final_state["final_report"]
    assert report.pipeline_platform == "Jenkins"
    assert "Compile" in final_state["parsed_log"].stages

def test_gitlab_workflow_execution():
    log_text = get_sample_log("gitlab_error.log")
    
    final_state = run_log_analysis(log_text, filename="gitlab_error.log")
    
    assert final_state["parsed_log"] is not None
    assert final_state["classification"].failure_type == "Test Failure"
    
    report = final_state["final_report"]
    assert report.pipeline_platform == "Gitlab"
    assert "test_db_connection" in report.root_cause
