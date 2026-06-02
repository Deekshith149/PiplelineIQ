import os
import logging
import sqlite3
import json
from typing import Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from src.config import settings
from src.models.requests import TextAnalysisRequest
from src.models.responses import AnalysisResponse, HealthStatusResponse
from src.workflows.log_analysis_graph import run_log_analysis
from src.models.state import FinalReport
from src.services.github_service import GitHubService

logger = logging.getLogger("ci_cd_analyzer.api")
router = APIRouter()
github_service = GitHubService()

def save_report_to_db(filename: str, report: FinalReport) -> Optional[int]:
    """Helper to persist a FinalReport to the SQLite database."""
    logger.info(f"Saving report for {filename} to database...")
    conn = None
    try:
        conn = sqlite3.connect(settings.sqlite_db_path)
        cursor = conn.cursor()
        
        # Serialize list structures to JSON strings safely
        evidence_json = json.dumps(report.evidence)
        fixes_dict_list = [
            {
                "fix": fix.fix,
                "priority": fix.priority,
                "explanation": fix.explanation
            }
            for fix in report.recommended_fixes
        ]
        fixes_json = json.dumps(fixes_dict_list)
        
        cursor.execute(
            """
            INSERT INTO analysis_reports (
                filename, platform, failure_type, root_cause, summary, timestamp, evidence, recommended_fixes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                filename,
                report.pipeline_platform,
                report.failure_type,
                report.root_cause,
                report.summary,
                report.timestamp,
                evidence_json,
                fixes_json
            )
        )
        conn.commit()
        generated_id = cursor.lastrowid
        logger.info(f"Successfully saved report to database with ID: {generated_id}")
        return generated_id
    except Exception as e:
        logger.error(f"Failed to save report to database: {str(e)}")
        return None
    finally:
        if conn:
            conn.close()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_file(
    file: UploadFile = File(...),
    platform: Optional[str] = Query(None, description="Optional platform hint")
):
    """Endpoint to analyze a uploaded CI/CD log file."""
    logger.info(f"API request: POST /analyze for file: {file.filename}")
    
    try:
        content_bytes = await file.read()
        # Decode bytes safely
        # We let the Ingestion agent handle actual encoding normalization, 
        # but we pass the bytes or string. Let's pass the bytes.
        result_state = run_log_analysis(
            raw_log=content_bytes,
            filename=file.filename or "uploaded_file.log",
            platform_hint=platform
        )
        
        final_report = result_state.get("final_report")
        errors = result_state.get("errors", [])
        
        if not final_report:
            raise HTTPException(
                status_code=500,
                detail=f"Log analysis execution failed. Intermediate errors: {errors}"
            )
            
        # Save to database
        filename = file.filename or "uploaded_file.log"
        report_id = save_report_to_db(filename, final_report)
            
        return AnalysisResponse(
            success=len(errors) == 0,
            report=final_report,
            report_id=report_id,
            errors=errors
        )
    except Exception as e:
        logger.exception("Exception in POST /analyze")
        return AnalysisResponse(
            success=False,
            errors=[f"API endpoint execution exception: {str(e)}"]
        )

@router.post("/analyze-text", response_model=AnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """Endpoint to analyze CI/CD log text passed in a JSON payload."""
    logger.info("API request: POST /analyze-text")
    
    if not request.log_text.strip():
        raise HTTPException(status_code=400, detail="Log text cannot be empty.")
        
    try:
        result_state = run_log_analysis(
            raw_log=request.log_text,
            filename="raw_text_payload.log",
            platform_hint=request.platform
        )
        
        final_report = result_state.get("final_report")
        errors = result_state.get("errors", [])
        
        if not final_report:
            raise HTTPException(
                status_code=500,
                detail=f"Log analysis execution failed. Intermediate errors: {errors}"
            )
            
        # Save to database
        report_id = save_report_to_db("raw_text_payload.log", final_report)
            
        return AnalysisResponse(
            success=len(errors) == 0,
            report=final_report,
            report_id=report_id,
            errors=errors
        )
    except Exception as e:
        logger.exception("Exception in POST /analyze-text")
        return AnalysisResponse(
            success=False,
            errors=[f"API endpoint execution exception: {str(e)}"]
        )

@router.get("/health", response_model=HealthStatusResponse)
async def get_health():
    """System health check endpoint, showing ML framework states and Gemini configuration."""
    logger.info("API request: GET /health")
    
    # 1. PyTorch check
    torch_available = False
    try:
        import torch
        torch_available = True
    except ImportError:
        pass
        
    # 2. Transformers check
    transformers_available = False
    try:
        import transformers
        transformers_available = True
    except ImportError:
        pass
        
    # 3. Gemini check
    gemini_configured = False
    try:
        from src.services.gemini_service import GeminiService
        gemini_configured = GeminiService().is_configured
    except Exception:
        pass

    # 4. Database Connection Check (SQLite setup)
    db_connected = False
    conn = None
    try:
        from src.config import settings
        conn = sqlite3.connect(settings.sqlite_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        db_connected = True
    except Exception as e:
        logger.error(f"SQLite Health check connection failed: {str(e)}")
    finally:
        if conn:
            conn.close()

    status = "ok" if (torch_available and transformers_available and db_connected) else "degraded"
    
    return HealthStatusResponse(
        status=status,
        torch_available=torch_available,
        transformers_available=transformers_available,
        gemini_configured=gemini_configured,
        database_connected=db_connected
    )

@router.get("/reports")
async def list_reports(
    platform: Optional[str] = Query(None, description="Filter by platform"),
    failure_type: Optional[str] = Query(None, description="Filter by failure type")
):
    """Retrieves a list of past analysis reports from the database."""
    logger.info("API request: GET /reports")
    conn = None
    try:
        conn = sqlite3.connect(settings.sqlite_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT id, filename, platform, failure_type, summary, timestamp FROM analysis_reports"
        params = []
        conditions = []
        
        if platform:
            conditions.append("platform LIKE ?")
            params.append(f"%{platform}%")
        if failure_type:
            conditions.append("failure_type LIKE ?")
            params.append(f"%{failure_type}%")
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY id DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        reports = []
        for row in rows:
            reports.append({
                "id": row["id"],
                "filename": row["filename"],
                "platform": row["platform"],
                "failure_type": row["failure_type"],
                "summary": row["summary"],
                "timestamp": row["timestamp"]
            })
        return {"reports": reports}
    except Exception as e:
        logger.exception("Exception in GET /reports")
        raise HTTPException(status_code=500, detail=f"Database query exception: {str(e)}")
    finally:
        if conn:
            conn.close()

@router.get("/reports/{report_id}")
async def get_report_details(report_id: int):
    """Retrieves full details of a specific analysis report by ID."""
    logger.info(f"API request: GET /reports/{report_id}")
    conn = None
    try:
        conn = sqlite3.connect(settings.sqlite_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM analysis_reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Report with ID {report_id} not found.")
            
        # Safely deserialize JSON columns
        evidence = []
        if row["evidence"]:
            try:
                evidence = json.loads(row["evidence"])
            except Exception:
                pass
                
        recommended_fixes = []
        if row["recommended_fixes"]:
            try:
                fixes_raw = json.loads(row["recommended_fixes"])
                for item in fixes_raw:
                    recommended_fixes.append({
                        "fix": item.get("fix", ""),
                        "priority": item.get("priority", "medium"),
                        "explanation": item.get("explanation", "")
                      })
            except Exception:
                pass
                
        return {
            "id": row["id"],
            "filename": row["filename"],
            "pipeline_platform": row["platform"],
            "failure_type": row["failure_type"],
            "root_cause": row["root_cause"],
            "summary": row["summary"],
            "timestamp": row["timestamp"],
            "evidence": evidence,
            "recommended_fixes": recommended_fixes
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Exception in GET /reports/{report_id}")
        raise HTTPException(status_code=500, detail=f"Database query exception: {str(e)}")
    finally:
        if conn:
            conn.close()

@router.delete("/reports/{report_id}")
async def delete_report(report_id: int):
    """Deletes a specific analysis report by ID from history."""
    logger.info(f"API request: DELETE /reports/{report_id}")
    conn = None
    try:
        conn = sqlite3.connect(settings.sqlite_db_path)
        cursor = conn.cursor()
        
        # Check existence first
        cursor.execute("SELECT 1 FROM analysis_reports WHERE id = ?", (report_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Report with ID {report_id} not found.")
            
        cursor.execute("DELETE FROM analysis_reports WHERE id = ?", (report_id,))
        conn.commit()
        logger.info(f"Report ID {report_id} successfully deleted.")
        return {"success": True, "message": f"Report with ID {report_id} deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Exception in DELETE /reports/{report_id}")
        raise HTTPException(status_code=500, detail=f"Database operation exception: {str(e)}")
    finally:
        if conn:
            conn.close()


# =========================================================================
# GITHUB ACTIONS OAUTH & LOGS ANALYZER ENDPOINTS
# =========================================================================

@router.get("/auth/github/login")
async def github_login():
    """Redirect user to GitHub OAuth login."""
    if not settings.github_client_id:
        raise HTTPException(
            status_code=400,
            detail="GitHub OAuth is not configured in settings/env file."
        )
    
    from fastapi.responses import RedirectResponse
    auth_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&redirect_uri={settings.github_redirect_uri}"
        "&scope=repo%20read:user"
    )
    logger.info(f"Initiating GitHub OAuth Redirect: {auth_url}")
    return RedirectResponse(auth_url)


@router.get("/auth/github/callback")
async def github_callback(code: Optional[str] = None, error: Optional[str] = None):
    """Handle the OAuth callback redirect from GitHub and close the popup window."""
    from fastapi.responses import HTMLResponse
    
    if error or not code:
        logger.warning(f"GitHub OAuth callback failure: {error}")
        return HTMLResponse(content=f"""
            <html>
                <head><title>Authentication Failed</title></head>
                <body style="background:#0b0c10;color:#fff;font-family:sans-serif;text-align:center;padding-top:10%;">
                    <h3>GitHub Sign-In Failed</h3>
                    <p style="color:#ff6b6b;">{error or 'Authorization code is missing.'}</p>
                    <button onclick="window.close()" style="background:#e84393;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;margin-top:15px;">Close Window</button>
                    <script>
                        if (window.opener) {{
                            window.opener.postMessage({{ type: "GITHUB_OAUTH_FAILURE", error: "{error or 'Missing code'}" }}, window.location.origin);
                        }}
                        setTimeout(function() {{ window.close(); }}, 4000);
                    </script>
                </body>
            </html>
        """)

    # Exchange authorization code for token
    import urllib.request
    import urllib.parse
    
    token_url = "https://github.com/login/oauth/access_token"
    post_data = urllib.parse.urlencode({
        "client_id": settings.github_client_id,
        "client_secret": settings.github_client_secret,
        "code": code,
        "redirect_uri": settings.github_redirect_uri
    }).encode("utf-8")
    
    req = urllib.request.Request(
        token_url,
        data=post_data,
        headers={
            "Accept": "application/json",
            "User-Agent": "CI-CD-Log-Analyzer"
        },
        method="POST"
    )

    try:
        logger.info("Exchanging auth code for access token...")
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            access_token = res_data.get("access_token")
            
            if not access_token:
                err_desc = res_data.get("error_description", "Could not retrieve access token.")
                raise Exception(err_desc)
                
            logger.info("GitHub Access Token retrieved successfully.")
            return HTMLResponse(content=f"""
                <html>
                    <head><title>Authentication Successful</title></head>
                    <body style="background:#0b0c10;color:#fff;font-family:sans-serif;text-align:center;padding-top:10%;">
                        <h3 style="color:#00bec4;">Successfully Authenticated!</h3>
                        <p>Transferring session back to CI/CD Analyzer dashboard...</p>
                        <script>
                            if (window.opener) {{
                                window.opener.postMessage({{ type: "GITHUB_OAUTH_SUCCESS", token: "{access_token}" }}, window.location.origin);
                            }}
                            setTimeout(function() {{ window.close(); }}, 1000);
                        </script>
                    </body>
                </html>
            """)
    except Exception as e:
        logger.error(f"Error exchanging OAuth code: {str(e)}")
        return HTMLResponse(content=f"""
            <html>
                <head><title>Authentication Error</title></head>
                <body style="background:#0b0c10;color:#fff;font-family:sans-serif;text-align:center;padding-top:10%;">
                    <h3>Token Exchange Failed</h3>
                    <p style="color:#ff6b6b;">{str(e)}</p>
                    <script>
                        if (window.opener) {{
                            window.opener.postMessage({{ type: "GITHUB_OAUTH_FAILURE", error: "{str(e)}" }}, window.location.origin);
                        }}
                    </script>
                </body>
            </html>
        """)


@router.get("/github/user")
async def get_github_user(token: str = Query(..., description="GitHub OAuth or PAT token")):
    """Get profile of authenticated GitHub user."""
    try:
        user_info = github_service.get_user_profile(token)
        return user_info
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/github/repos")
async def get_github_repos(token: str = Query(..., description="GitHub OAuth or PAT token")):
    """Get list of user's repositories."""
    try:
        repos = github_service.list_repositories(token)
        return {"repositories": repos}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/github/repos/{owner}/{repo}/runs")
async def get_github_runs(
    owner: str,
    repo: str,
    token: str = Query(..., description="GitHub OAuth or PAT token")
):
    """Get recent workflow runs for a repository."""
    try:
        runs = github_service.list_workflow_runs(token, owner, repo)
        return {"runs": runs}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/github/repos/{owner}/{repo}/runs/{run_id}/analyze", response_model=AnalysisResponse)
async def analyze_github_run(
    owner: str,
    repo: str,
    run_id: int,
    token: str = Query(..., description="GitHub OAuth or PAT token")
):
    """Download Action run logs, extract step logs, merge them, and run AI analyzer."""
    logger.info(f"GitHub Ingest: Requesting log analysis for {owner}/{repo} (run: {run_id})")
    try:
        # Download and merge the workflow run logs
        raw_logs = github_service.download_and_merge_logs(token, owner, repo, run_id)
        
        filename = f"github_actions_{owner}_{repo}_{run_id}.log"
        
        # Execute the multi-agent graph workflow
        result_state = run_log_analysis(
            raw_log=raw_logs,
            filename=filename,
            platform_hint="github"
        )
        
        final_report = result_state.get("final_report")
        errors = result_state.get("errors", [])
        
        if not final_report:
            raise HTTPException(
                status_code=500,
                detail=f"GitHub Actions log analysis failed. Intermediate errors: {errors}"
            )
            
        # Save to history SQLite database
        report_id = save_report_to_db(filename, final_report)
            
        return AnalysisResponse(
            success=len(errors) == 0,
            report=final_report,
            report_id=report_id,
            errors=errors
        )
    except Exception as e:
        logger.exception(f"Exception in POST /github/repos/{owner}/{repo}/runs/{run_id}/analyze")
        return AnalysisResponse(
            success=False,
            errors=[f"GitHub Actions analysis exception: {str(e)}"]
        )
