import pytest
from fastapi.testclient import TestClient
from src.main import app, init_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()

client = TestClient(app)

def test_github_user_endpoint():
    # Test using the standard developer mock_token
    response = client.get("/api/v1/github/user", params={"token": "mock_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["login"] == "octocat-dev"
    assert data["name"] == "Octocat Developer"
    assert "avatar_url" in data

def test_github_repos_endpoint():
    response = client.get("/api/v1/github/repos", params={"token": "mock_token"})
    assert response.status_code == 200
    data = response.json()
    assert "repositories" in data
    repos = data["repositories"]
    assert len(repos) == 3
    assert repos[0]["name"] == "production-web-app"
    assert repos[0]["owner"]["login"] == "octocat-dev"

def test_github_runs_endpoint():
    response = client.get("/api/v1/github/repos/octocat-dev/production-web-app/runs", params={"token": "mock_token"})
    assert response.status_code == 200
    data = response.json()
    assert "runs" in data
    runs = data["runs"]
    assert len(runs) == 4
    # Verify mock failure runs are present
    failure_runs = [r for r in runs if r["conclusion"] == "failure"]
    assert len(failure_runs) == 2
    assert failure_runs[0]["id"] == 1002

def test_github_run_analyze_endpoint():
    # Trigger full analysis of mock run 1002 (Unit test failure)
    response = client.post(
        "/api/v1/github/repos/octocat-dev/production-web-app/runs/1002/analyze",
        params={"token": "mock_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "report" in data
    
    report = data["report"]
    assert report["pipeline_platform"] == "Github"
    assert report["failure_type"] == "Test Failure"
    assert "failure" in report["root_cause"].lower() or "failed" in report["root_cause"].lower()
    assert len(report["evidence"]) > 0
    assert len(report["recommended_fixes"]) > 0
    
    assert "report_id" in data
    assert data["report_id"] is not None
