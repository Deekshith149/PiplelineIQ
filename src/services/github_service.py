import io
import json
import logging
import urllib.request
import urllib.error
import zipfile
from typing import Dict, Any, List, Optional

logger = logging.getLogger("ci_cd_analyzer.github_service")

class GitHubService:
    """Service to handle GitHub API requests, including profile loading, 
    repo listing, action runs browsing, and log ZIP downloading and extraction.
    
    Includes a built-in mock mode when token is 'mock_token' for offline development.
    """

    def __init__(self):
        self.api_url = "https://api.github.com"

    def _make_request(self, path: str, token: str, method: str = "GET", data: bytes = None) -> Any:
        """Helper to make HTTP request to GitHub API using standard urllib."""
        url = f"{self.api_url}{path}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "CI-CD-Log-Analyzer"
        }
        
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                content = response.read()
                # If downloading a zip log
                if response.info().get_content_type() == "application/zip" or "zip" in path:
                    return content
                return json.loads(content.decode("utf-8"))
        except urllib.error.HTTPError as e:
            # If redirected to download zip logs
            if e.code in [302, 307]:
                redirect_url = e.headers.get("Location")
                if redirect_url:
                    # Fetch from redirect location without authorization header
                    redirect_req = urllib.request.Request(redirect_url)
                    try:
                        with urllib.request.urlopen(redirect_req, timeout=15) as res:
                            return res.read()
                    except Exception as err:
                        logger.error(f"Failed to follow GitHub redirect log download: {str(err)}")
                        raise err
            
            error_body = ""
            try:
                error_body = e.read().decode("utf-8")
            except Exception:
                pass
            logger.error(f"GitHub API Error {e.code}: {e.reason} - Body: {error_body}")
            raise Exception(f"GitHub API returned status {e.code}: {e.reason}")
        except Exception as e:
            logger.error(f"GitHub Request Error to {url}: {str(e)}")
            raise e

    def get_user_profile(self, token: str) -> Dict[str, Any]:
        """Fetch current authenticated user profile."""
        if token == "mock_token":
            return {
                "login": "octocat-dev",
                "name": "Octocat Developer",
                "avatar_url": "https://avatars.githubusercontent.com/u/5832347?v=4"
            }
        
        try:
            return self._make_request("/user", token)
        except Exception as e:
            logger.error(f"Error fetching GitHub user profile: {str(e)}")
            raise Exception(f"Failed to fetch GitHub profile: {str(e)}")

    def list_repositories(self, token: str) -> List[Dict[str, Any]]:
        """List user's accessible repositories, sorted by last updated."""
        if token == "mock_token":
            return [
                {
                    "full_name": "octocat-dev/production-web-app",
                    "name": "production-web-app",
                    "owner": {"login": "octocat-dev"},
                    "description": "Premium customer-facing dashboard SPA backend"
                },
                {
                    "full_name": "octocat-dev/ci-cd-pipelines",
                    "name": "ci-cd-pipelines",
                    "owner": {"login": "octocat-dev"},
                    "description": "Shared pipeline configurations and security templates"
                },
                {
                    "full_name": "octocat-dev/microservice-api",
                    "name": "microservice-api",
                    "owner": {"login": "octocat-dev"},
                    "description": "High throughput microservice cluster backend"
                }
            ]

        try:
            repos = self._make_request("/user/repos?sort=updated&per_page=100", token)
            # Standardize output format
            formatted_repos = []
            for r in repos:
                formatted_repos.append({
                    "full_name": r.get("full_name"),
                    "name": r.get("name"),
                    "owner": {"login": r.get("owner", {}).get("login")},
                    "description": r.get("description", "")
                })
            return formatted_repos
        except Exception as e:
            logger.error(f"Error listing repositories: {str(e)}")
            raise Exception(f"Failed to fetch repositories: {str(e)}")

    def list_workflow_runs(self, token: str, owner: str, repo: str) -> List[Dict[str, Any]]:
        """List recent actions workflow runs for a repository."""
        if token == "mock_token":
            return [
                {
                    "id": 1001,
                    "name": "Build and Deploy",
                    "head_branch": "main",
                    "head_commit": {"message": "fix: resolve python requirements file missing"},
                    "status": "completed",
                    "conclusion": "success",
                    "html_url": f"https://github.com/{owner}/{repo}/actions/runs/1001",
                    "created_at": "2026-06-02T18:45:00Z"
                },
                {
                    "id": 1002,
                    "name": "Unit Testing Suite",
                    "head_branch": "feature/payment-gateway",
                    "head_commit": {"message": "feat: integrate stripe payment hooks"},
                    "status": "completed",
                    "conclusion": "failure",
                    "html_url": f"https://github.com/{owner}/{repo}/actions/runs/1002",
                    "created_at": "2026-06-02T18:30:00Z"
                },
                {
                    "id": 1003,
                    "name": "Docker Container Packaging",
                    "head_branch": "main",
                    "head_commit": {"message": "chore: bump alpine node base image version"},
                    "status": "completed",
                    "conclusion": "failure",
                    "html_url": f"https://github.com/{owner}/{repo}/actions/runs/1003",
                    "created_at": "2026-06-02T18:15:00Z"
                },
                {
                    "id": 1004,
                    "name": "Integration E2E Checks",
                    "head_branch": "main",
                    "head_commit": {"message": "test: add end-to-end user checkout pipeline tests"},
                    "status": "in_progress",
                    "conclusion": None,
                    "html_url": f"https://github.com/{owner}/{repo}/actions/runs/1004",
                    "created_at": "2026-06-02T19:00:00Z"
                }
            ]

        try:
            path = f"/repos/{owner}/{repo}/actions/runs?per_page=20"
            data = self._make_request(path, token)
            runs = data.get("workflow_runs", [])
            
            formatted_runs = []
            for run in runs:
                formatted_runs.append({
                    "id": run.get("id"),
                    "name": run.get("name", "Workflow Run"),
                    "head_branch": run.get("head_branch"),
                    "head_commit": {"message": run.get("head_commit", {}).get("message", "Triggered pipeline")},
                    "status": run.get("status"),
                    "conclusion": run.get("conclusion"),
                    "html_url": run.get("html_url"),
                    "created_at": run.get("created_at")
                })
            return formatted_runs
        except Exception as e:
            logger.error(f"Error fetching workflow runs for {owner}/{repo}: {str(e)}")
            raise Exception(f"Failed to fetch workflow runs: {str(e)}")

    def download_and_merge_logs(self, token: str, owner: str, repo: str, run_id: int) -> str:
        """Download workflow logs zip, extract step logs, and merge them sequentially."""
        if token == "mock_token":
            # High-fidelity mock logs based on which mock run was requested
            if run_id == 1002:
                # Mock a python pytest / unit test failure
                return """
--- File: 1_Set up job.txt ---
Runner setting up environments... Done.
--- File: 2_Checkout.txt ---
Cloning repository branch feature/payment-gateway... Success.
--- File: 3_Run pytest.txt ---
ERROR: pytest unit test failed
Running tests with pytest...
============================= test session starts ==============================
platform linux -- Python 3.10.12, pytest-7.4.3, pluggy-1.3.0
rootdir: /home/runner/work/production-web-app
collected 14 items

tests/test_auth.py ....                                                   [ 28%]
tests/test_payments.py F.F..                                              [ 64%]
tests/test_api.py ....                                                    [100%]

=================================== FAILURES ===================================
___________________________ test_stripe_webhook_auth ___________________________

    def test_stripe_webhook_auth():
        client = APIClient()
>       response = client.post("/api/v1/payments/stripe-webhook", headers={"Stripe-Signature": "invalid_sig"})
E       AssertionError: assert 500 == 401
E        +  where 500 = <Response [500]>.status_code

tests/test_payments.py:18: AssertionError

__________________________ test_payment_intent_amount __________________________

    def test_payment_intent_amount():
        client = APIClient()
>       response = client.post("/api/v1/payments/intent", json={"amount": -100})
E       AssertionError: assert response.status_code == 400
E       assert 500 == 400
E        +  where 500 = <Response [500]>.status_code

tests/test_payments.py:42: AssertionError
=========================== 2 failed, 12 passed in 1.48s ===========================
Error: Process completed with exit code 1.
"""
            elif run_id == 1003:
                # Mock a Docker Packaging build failure
                return """
--- File: 1_Set up job.txt ---
Runner initialized.
--- File: 2_Docker login.txt ---
Logging in to GitHub Container Registry... Done.
--- File: 3_Build docker image.txt ---
docker build -t ghcr.io/octocat-dev/production-web-app:latest .
Sending build context to Docker daemon  2.34MB
Step 1/8 : FROM node:20-alpine
 ---> b17d12f36f3c
Step 2/8 : WORKDIR /app
 ---> Running in a47f8b919d7b
 ---> Removed intermediate container a47f8b919d7b
 ---> d5b6e7f8a9c0
Step 3/8 : COPY package*.json ./
 ---> 4c3d2e1f0a9b
Step 4/8 : RUN npm ci
 ---> Running in f7e6d5c4b3a2
npm ERR! code EUSAGE
npm ERR! Refusing to install package with name "production-web-app" under a dependency of itself "production-web-app"
npm ERR! 
npm ERR! A complete log of this run can be found in: /root/.npm/_logs/2026-06-02T18_15_23_345Z-debug-0.log
The command '/bin/sh -c npm ci' returned a non-zero code: 1
Error: Process completed with exit code 1.
"""
            else:
                return """
--- File: 1_Set up job.txt ---
Pipeline initialized.
--- File: 2_Compile.txt ---
Compiling source code...
2026-06-02T18:45:10Z ERROR: Syntax error in app/utils.py line 45
    return data.get("key", )
                           ^
SyntaxError: invalid syntax
Error: Process completed with exit code 1.
"""

        try:
            path = f"/repos/{owner}/{repo}/actions/runs/{run_id}/logs"
            logger.info(f"Downloading actions logs zip from {owner}/{repo} (Run {run_id})...")
            zip_bytes = self._make_request(path, token)
            
            # Read ZIP archive in memory
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
                # Find all text files in the ZIP archive
                txt_files = [name for name in z.namelist() if name.endswith(".txt")]
                
                # Sort alphabetically to keep jobs/steps sequential
                txt_files.sort()
                
                if not txt_files:
                    return "No log files found in the download ZIP archive."
                
                merged_logs = []
                for file_name in txt_files:
                    try:
                        content = z.read(file_name).decode("utf-8", errors="ignore")
                        # Append marker for clarity between logs
                        merged_logs.append(f"--- File: {file_name} ---")
                        merged_logs.append(content)
                    except Exception as fe:
                        logger.error(f"Failed to read file {file_name} from ZIP: {str(fe)}")
                        
                return "\n".join(merged_logs)
        except Exception as e:
            logger.error(f"Failed to download and extract logs for {owner}/{repo}/runs/{run_id}: {str(e)}")
            raise Exception(f"Failed to download actions logs: {str(e)}")
