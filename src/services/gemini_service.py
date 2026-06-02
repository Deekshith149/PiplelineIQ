import json
import logging
from typing import Dict, Any, List, Optional
from src.config import settings

logger = logging.getLogger("ci_cd_analyzer.gemini_service")

class GeminiService:
    """Production-ready interface for the Gemini API.

    Equipped with direct SDK calls, strict error resilience, and high-fidelity mock generators 
    for offline development when GEMINI_API_KEY is not supplied.
    """

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model_name = settings.gemini_model
        self.client = None
        self._is_active = False

        if self.api_key:
            try:
                # Import google-genai client or langchain as standard
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                self._is_active = True
                logger.info(f"Gemini API successfully configured. Using model: {self.model_name}")
            except Exception as e:
                logger.error(
                    f"Failed to initialize Gemini Client: {str(e)}. "
                    "Falling back to high-fidelity mock diagnostic generation."
                )
        else:
            logger.warning(
                "GEMINI_API_KEY environment variable is missing. "
                "The application will operate using high-fidelity offline mock diagnostic generation."
            )

    @property
    def is_configured(self) -> bool:
        """Indicates if the Gemini client is active and configured."""
        return self._is_active

    def analyze_root_cause(
        self, 
        errors: List[str], 
        warnings: List[str], 
        stack_traces: List[str], 
        stages: List[str],
        failure_type: str
    ) -> Dict[str, Any]:
        """Constructs an analysis prompt for Gemini to identify the root cause."""
        if not self._is_active:
            return self._generate_mock_root_cause(errors, warnings, stack_traces, stages, failure_type)

        prompt = f"""
Analyze the following parsed CI/CD log data and identify the true primary Root Cause.
Ignore cascading failures (failures that only happened because of an earlier failure).

Context:
- Platform / Job: {stages}
- Failure Type: {failure_type}
- Extracted Errors: {errors}
- Extracted Warnings: {warnings}
- Extracted Stack Traces: {stack_traces}

Instructions:
1. Identify the fundamental problem (e.g. missing requirements.txt, wrong credentials, out of memory, network timeout).
2. Extract exact line(s) of evidence from the logs supporting this conclusion.
3. Determine a confidence score between 0.0 and 1.0.
4. Output your analysis strictly in JSON format. Do not add markdown around it.

Expected JSON output format:
{{
  "root_cause": "Detailed explanation of the root cause.",
  "evidence": ["Exact error message line 1", "Exact error message line 2"],
  "confidence": 0.95
}}
"""
        try:
            from google.genai import types
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            # Standardize and parse JSON
            cleaned_text = response.text.strip()
            # Handle standard triple backtick wraps if present
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text.split("```json", 1)[1].rsplit("```", 1)[0].strip()
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text.split("```", 1)[1].rsplit("```", 1)[0].strip()
                
            data = json.loads(cleaned_text)
            return {
                "root_cause": data.get("root_cause", "Unable to extract root cause."),
                "evidence": data.get("evidence", errors[:2]),
                "confidence": float(data.get("confidence", 0.8))
            }
        except Exception as e:
            logger.error(f"Gemini API root cause analysis failed: {str(e)}. Using fallback mock.")
            return self._generate_mock_root_cause(errors, warnings, stack_traces, stages, failure_type)

    def analyze_remediation(
        self, 
        root_cause: str, 
        errors: List[str], 
        failure_type: str
    ) -> Dict[str, Any]:
        """Constructs a prompt for Gemini to generate specific remediation fixes."""
        if not self._is_active:
            return self._generate_mock_remediation(root_cause, errors, failure_type)

        prompt = f"""
Generate highly actionable remediation instructions based on this identified root cause of a CI/CD pipeline failure.

Context:
- Failure Type: {failure_type}
- Identified Root Cause: {root_cause}
- Errors: {errors}

Instructions:
1. Provide practical, clear, step-by-step solutions to fix this failure.
2. Structure solutions by priority (e.g. high, medium).
3. Align with CI/CD best practices and secure development workflows.
4. Output your response strictly in JSON format. Do not add markdown around it.

Expected JSON output format:
{{
  "recommended_fixes": [
    {{
      "fix": "Actionable fix instruction.",
      "priority": "high",
      "explanation": "Why this needs to be done and how it resolves the root cause."
    }}
  ],
  "priority": "high"
}}
"""
        try:
            from google.genai import types
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            # Parse response
            cleaned_text = response.text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text.split("```json", 1)[1].rsplit("```", 1)[0].strip()
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text.split("```", 1)[1].rsplit("```", 1)[0].strip()

            data = json.loads(cleaned_text)
            return {
                "recommended_fixes": data.get("recommended_fixes", []),
                "priority": data.get("priority", "high")
            }
        except Exception as e:
            logger.error(f"Gemini API remediation analysis failed: {str(e)}. Using fallback mock.")
            return self._generate_mock_remediation(root_cause, errors, failure_type)

    # =========================================================================
    # HIGH-FIDELITY OFFLINE DIAGNOSTIC MOCK GENERATORS
    # =========================================================================

    def _generate_mock_root_cause(
        self, 
        errors: List[str], 
        warnings: List[str], 
        stack_traces: List[str], 
        stages: List[str],
        failure_type: str
    ) -> Dict[str, Any]:
        """Provides realistic root causes based on parsed logs for fallback/offline use."""
        logger.info("Generating offline root cause mock prediction.")
        
        evidence = errors[:2] if errors else ["General build failure detected in execution stages."]
        
        # Dependency failure
        if failure_type == "Dependency Failure":
            rc = "The build system was unable to resolve or fetch dependencies. "
            if any("requirements.txt" in err.lower() for err in errors):
                rc += "Specifically, 'requirements.txt' is missing or not present in the workspace root directory, halting python dependency installation."
                evidence = [err for err in errors if "requirements.txt" in err.lower()] or evidence
            elif any("package.json" in err.lower() for err in errors):
                rc += "A missing or malformed 'package.json' file prevented npm/yarn installer from retrieving the node packages."
            else:
                rc += "A network issue or an invalid/private package registry credential caused the package retrieval task to timeout."
            return {"root_cause": rc, "evidence": evidence, "confidence": 0.85}

        # Test failure
        if failure_type == "Test Failure":
            rc = "Unit/Integration tests failed execution. "
            test_errs = [err for err in errors if "assert" in err.lower() or "fail" in err.lower()]
            if test_errs:
                rc += f"An assertion failed during test execution: '{test_errs[0]}'."
                evidence = test_errs
            else:
                rc += "An unhandled exception or crash occurred in one of the test suites, causing the test runner to exit with non-zero code."
            return {"root_cause": rc, "evidence": evidence, "confidence": 0.90}

        # Docker failure
        if failure_type == "Docker Failure":
            rc = "The Docker container build failed. "
            if any("daemon" in err.lower() for err in errors):
                rc += "The Docker daemon is not running or is inaccessible from within the runner execution environment."
            else:
                rc += "A command in the Dockerfile (likely a RUN script or COPY instruction) failed to execute or referenced a missing file."
            return {"root_cause": rc, "evidence": evidence, "confidence": 0.88}

        # Security failure
        if failure_type == "Security Failure":
            rc = "The pipeline triggered a security blocker because a vulnerability scan exceeded the maximum allowed severity threshold, or secrets leak detection flagged credentials in the codebase."
            return {"root_cause": rc, "evidence": evidence, "confidence": 0.95}

        # Compile failure
        if failure_type == "Compilation Failure":
            rc = "Source code compilation failed due to syntax errors, unresolved compiler definitions, or type checker constraints."
            return {"root_cause": rc, "evidence": evidence, "confidence": 0.87}

        # Generic / Unknown
        rc = f"The CI/CD pipeline failed during the '{stages[0] if stages else 'execution'}' phase. "
        if errors:
            rc += f"The primary error was: '{errors[0]}'."
        else:
            rc += "The runner exited unexpectedly with a non-zero exit code, indicating a setup or platform execution issue."
            
        return {
            "root_cause": rc,
            "evidence": evidence,
            "confidence": 0.70
        }

    def _generate_mock_remediation(
        self, 
        root_cause: str, 
        errors: List[str], 
        failure_type: str
    ) -> Dict[str, Any]:
        """Provides realistic fixes based on root cause for fallback/offline use."""
        logger.info("Generating offline remediation mock predictions.")
        
        fixes = []
        
        if failure_type == "Dependency Failure":
            if "requirements.txt" in root_cause.lower():
                fixes.append({
                    "fix": "Create a valid 'requirements.txt' file in your repository's root directory.",
                    "priority": "high",
                    "explanation": "The installer could not locate 'requirements.txt'. Ensure the file is checked into version control."
                })
            else:
                fixes.append({
                    "fix": "Check library names and repository connectivity in your lockfiles.",
                    "priority": "high",
                    "explanation": "Verify repository connectivity and ensure any private registries are configured with correct auth credentials in your CI environment secrets."
                })
            fixes.append({
                "fix": "Cache dependency directories in your pipeline configuration.",
                "priority": "medium",
                "explanation": "Caching dependencies (e.g. ~/.cache/pip or node_modules) reduces download timeouts and accelerates build speeds."
            })
            
        elif failure_type == "Test Failure":
            fixes.append({
                "fix": "Inspect unit tests and repair failing assertions.",
                "priority": "high",
                "explanation": "Pull down the repository branch locally, review the exact test file and line specified in the traceback, and resolve the failing conditions."
            })
            fixes.append({
                "fix": "Ensure test databases or external services are properly mocked.",
                "priority": "medium",
                "explanation": "If tests rely on a database, check that your CI pipeline spins up a localized database container (like Postgres service container) or mock external requests completely."
            })
            
        elif failure_type == "Docker Failure":
            fixes.append({
                "fix": "Verify Dockerfile commands and build context locally.",
                "priority": "high",
                "explanation": "Run 'docker build .' in your local terminal to see if the build fails under local conditions. Double check COPY paths and build argument dependencies."
            })
            fixes.append({
                "fix": "Enable Docker-in-Docker or service setup in pipeline config.",
                "priority": "high",
                "explanation": "If building containers inside GitHub Actions or GitLab CI, ensure the Docker service is enabled, or docker-in-docker (dind) is properly configured."
            })
            
        elif failure_type == "Security Failure":
            fixes.append({
                "fix": "Review security audit logs and patch vulnerable dependencies.",
                "priority": "high",
                "explanation": "Run dependency audits (e.g., 'npm audit', 'pip-audit') and upgrade the reported packages to safe patched versions."
            })
            fixes.append({
                "fix": "Remove exposed credentials and rotate leaked secrets.",
                "priority": "critical",
                "explanation": "If a credential scan failed, remove plain-text API keys from source files immediately and inject them safely using CI/CD secret variables."
            })
            
        else:
            # General generic fixes
            fixes.append({
                "fix": "Check recent git commits and configuration changes.",
                "priority": "high",
                "explanation": "Examine recent edits to the pipeline configuration files (e.g., .github/workflows or jenkinsfile) for syntax or execution faults."
            })
            fixes.append({
                "fix": "Increase verbosity / enable debug logs.",
                "priority": "medium",
                "explanation": "Set debug variables in your pipeline configuration (e.g. ACTIONS_STEP_DEBUG=true) to obtain detailed diagnostic trace lines."
            })
            
        return {
            "recommended_fixes": fixes,
            "priority": "high" if any(f["priority"] == "high" for f in fixes) else "medium"
        }
