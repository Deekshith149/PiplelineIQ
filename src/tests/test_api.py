import io
import pytest
from fastapi.testclient import TestClient
from src.main import app, init_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()

client = TestClient(app)

def test_root_welcome_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    # Can return HTML or welcome JSON depending on static folder state
    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        assert "Welcome to the AI-Powered CI/CD Log Analyzer" in response.json()["message"]
    else:
        assert "<!DOCTYPE html>" in response.text
        assert "CI/CD Log" in response.text

def test_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "torch_available" in data
    assert "transformers_available" in data
    assert "gemini_configured" in data

def test_analyze_text_endpoint():
    payload = {
        "log_text": "2026-06-02T10:00:00Z ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'\nProcess finished with exit code 1",
        "platform": "github"
    }
    response = client.post("/api/v1/analyze-text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["report"]["pipeline_platform"] == "Github"
    assert data["report"]["failure_type"] == "Dependency Failure"
    assert "requirements.txt" in data["report"]["root_cause"]
    assert "report_id" in data
    assert data["report_id"] is not None

def test_analyze_file_endpoint():
    log_content = "ERROR: Failed executing compiler check\nexit status 2"
    file_payload = {"file": ("test_run.log", io.BytesIO(log_content.encode("utf-8")), "text/plain")}
    
    response = client.post("/api/v1/analyze", files=file_payload, params={"platform": "circleci"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["report"]["pipeline_platform"] == "Circleci"
    assert data["report"]["failure_type"] == "Compilation Failure"
    assert "report_id" in data
    assert data["report_id"] is not None

def test_reports_history_endpoints():
    # 1. Trigger text analysis to save a report to the DB
    payload = {
        "log_text": "ERROR: test failed: jest suite error\nexit status 1",
        "platform": "gitlab"
    }
    analyze_res = client.post("/api/v1/analyze-text", json=payload)
    assert analyze_res.status_code == 200
    report_id = analyze_res.json()["report_id"]
    assert report_id is not None

    # 2. Get history list and verify item is present
    history_res = client.get("/api/v1/reports")
    assert history_res.status_code == 200
    history_data = history_res.json()
    assert "reports" in history_data
    reports = history_data["reports"]
    assert len(reports) > 0
    
    # Verify our item is in the history list (most recent first)
    most_recent = reports[0]
    assert most_recent["id"] == report_id
    assert most_recent["platform"] == "Gitlab"
    assert most_recent["failure_type"] == "Test Failure"

    # 3. Get full details of this report
    detail_res = client.get(f"/api/v1/reports/{report_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == report_id
    assert detail["pipeline_platform"] == "Gitlab"
    assert detail["failure_type"] == "Test Failure"
    assert len(detail["evidence"]) > 0
    assert len(detail["recommended_fixes"]) > 0

    # 4. Try getting a non-existent report details
    non_existent_res = client.get("/api/v1/reports/999999")
    assert non_existent_res.status_code == 404

    # 5. Delete this report and verify removal
    delete_res = client.delete(f"/api/v1/reports/{report_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["success"] is True

    # 6. Verify deletion by trying to retrieve it
    retrieved_res = client.get(f"/api/v1/reports/{report_id}")
    assert retrieved_res.status_code == 404
