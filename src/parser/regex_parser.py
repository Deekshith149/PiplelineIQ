import re
import logging
from typing import Dict, List, Any, Optional
from src.models.state import ParsedLog

logger = logging.getLogger("ci_cd_analyzer.parser")

class RegexParser:
    """Specialized regex parser to extract structured diagnostics from raw CI/CD logs."""

    # Common patterns
    TIMESTAMP_REGEX = re.compile(
        r"(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?|"
        r"\b\d{2}:\d{2}:\d{2}\b)"
    )
    
    EXIT_CODE_REGEX = re.compile(
        r"(?:exit code|exit status|process exited with code|failed with exit code)\s*[:=]?\s*(-?\d+)", 
        re.IGNORECASE
    )

    # Platform-specific patterns
    PLATFORMS = {
        "github": {
            "error": re.compile(r"##\[error\](.*)"),
            "warning": re.compile(r"##\[warning\](.*)"),
            "stage": re.compile(r"##\[group\]Starting:\s*(.*)"),
            "indicator": re.compile(r"github\.com/actions|##\[add-matcher\]")
        },
        "jenkins": {
            "error": re.compile(r"\[ERROR\]\s*(.*)|FATAL:\s*(.*)"),
            "warning": re.compile(r"\[WARNING\]\s*(.*)|\[WARN\]\s*(.*)"),
            "stage": re.compile(r"\[Pipeline\]\s*stage\s*\(\s*([^)]+)\s*\)|\[Pipeline\]\s*\{\s*\(([^)]+)\)"),
            "indicator": re.compile(r"Jenkins\s*Version|jenkins\.model|\[Pipeline\]")
        },
        "gitlab": {
            "error": re.compile(r"ERROR:\s*Job failed:\s*(.*)|Job failed\s*\(.*?\)\s*with\s*(.*)"),
            "warning": re.compile(r"WARNING:\s*(.*)"),
            "stage": re.compile(r"Running on\s*(.*)|Creating cache\s*(.*)"),
            "indicator": re.compile(r"gitlab-runner|Running on\s*gitlab-runner")
        },
        "azure": {
            "error": re.compile(r"##\[error\](.*)"),
            "warning": re.compile(r"##\[warning\](.*)"),
            "stage": re.compile(r"##\[section\]Starting:\s*(.*)"),
            "indicator": re.compile(r"vstsAgent|##\[section\]")
        },
        "circleci": {
            "error": re.compile(r"Error:\s*(.*)|Failed step:\s*(.*)"),
            "warning": re.compile(r"Warning:\s*(.*)"),
            "stage": re.compile(r"====>>\s*(.*)"),
            "indicator": re.compile(r"circleci\.com|====>>\s*Spin up environment")
        }
    }

    # Fallback/General error/warning matchers
    GENERAL_ERROR_REGEX = re.compile(
        r"(?:^|\s)(?:error|fail|failed|fatal|exception|severe)\b\s*[:\-]?\s*(.*)", 
        re.IGNORECASE
    )
    GENERAL_WARNING_REGEX = re.compile(
        r"(?:^|\s)(?:warning|warn)\b\s*[:\-]?\s*(.*)", 
        re.IGNORECASE
    )

    # Stack trace pattern matching
    PYTHON_STACK_TRACE_START = re.compile(r"Traceback \(most recent call last\):")
    JAVA_STACK_TRACE_LINE = re.compile(r"^\s+at\s+[a-zA-Z0-9_.]+\([a-zA-Z0-9_$.:]+\)")
    NODE_STACK_TRACE_LINE = re.compile(r"^\s+at\s+async\s+.*|^\s+at\s+.*:\d+:\d+")

    def detect_platform(self, text: str) -> str:
        """Heuristically determines the CI/CD platform from log content."""
        scores = {p: 0 for p in self.PLATFORMS}
        
        for platform, config in self.PLATFORMS.items():
            if "indicator" in config and config["indicator"].search(text):
                scores[platform] += 10
            
            # Count pattern matches
            if config["error"].search(text):
                scores[platform] += 2
            if "stage" in config and config["stage"].search(text):
                scores[platform] += 2
                
        best_platform = max(scores, key=scores.get)
        if scores[best_platform] > 0:
            logger.info(f"Detected platform: {best_platform} (Score: {scores[best_platform]})")
            return best_platform
            
        logger.info("Could not reliably detect CI/CD platform. Defaulting to 'general'.")
        return "general"

    def parse(self, text: str, platform_hint: Optional[str] = None) -> ParsedLog:
        """Parses raw text logs and returns a ParsedLog model."""
        lines = text.splitlines()
        
        platform = platform_hint.lower() if platform_hint else self.detect_platform(text)
        
        errors: List[str] = []
        warnings: List[str] = []
        timestamps: List[str] = []
        stack_traces: List[str] = []
        stages: List[str] = []
        exit_codes: List[int] = []
        
        # Temp storage for building tracebacks
        in_python_traceback = False
        current_traceback: List[str] = []
        
        platform_config = self.PLATFORMS.get(platform, {})
        error_pat = platform_config.get("error")
        warn_pat = platform_config.get("warning")
        stage_pat = platform_config.get("stage")

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # 1. Extract Timestamps
            ts_match = self.TIMESTAMP_REGEX.search(line_str)
            if ts_match:
                timestamps.append(ts_match.group(1))

            # 2. Extract Exit Codes
            ec_match = self.EXIT_CODE_REGEX.search(line_str)
            if ec_match:
                try:
                    exit_codes.append(int(ec_match.group(1)))
                except ValueError:
                    pass

            # 3. Stack Trace Aggregation
            # Python Exception Handler
            if self.PYTHON_STACK_TRACE_START.search(line_str):
                in_python_traceback = True
                current_traceback = [line_str]
                continue
            elif in_python_traceback:
                current_traceback.append(line_str)
                # A python traceback usually ends with an unindented line that has the exception name
                if not line.startswith(" ") and ":" in line_str:
                    in_python_traceback = False
                    stack_traces.append("\n".join(current_traceback))
                    errors.append(line_str)  # Add final error message
                    current_traceback = []
                continue

            # Java/Node Stack Trace line checks
            if self.JAVA_STACK_TRACE_LINE.search(line) or self.NODE_STACK_TRACE_LINE.search(line):
                if stack_traces and line_str not in stack_traces[-1]:
                    # Append line to last stack trace if it seems related
                    stack_traces[-1] += "\n" + line_str
                else:
                    stack_traces.append(line_str)
                continue

            # 4. Extract Stages
            if stage_pat:
                stage_match = stage_pat.search(line_str)
                if stage_match:
                    stage_name = next(g for g in stage_match.groups() if g is not None)
                    stages.append(stage_name.strip())

            # 5. Extract Errors and Warnings (Platform-specific vs. General)
            matched_error = False
            if error_pat:
                err_match = error_pat.search(line_str)
                if err_match:
                    err_msg = next(g for g in err_match.groups() if g is not None)
                    errors.append(err_msg.strip())
                    matched_error = True
            
            if not matched_error:
                # Try general error matches
                err_match = self.GENERAL_ERROR_REGEX.search(line_str)
                if err_match:
                    errors.append(err_match.group(1).strip())
                    matched_error = True

            matched_warn = False
            if warn_pat:
                warn_match = warn_pat.search(line_str)
                if warn_match:
                    warn_msg = next(g for g in warn_match.groups() if g is not None)
                    warnings.append(warn_msg.strip())
                    matched_warn = True
            
            if not matched_warn and not matched_error:
                warn_match = self.GENERAL_WARNING_REGEX.search(line_str)
                if warn_match:
                    warnings.append(warn_match.group(1).strip())

        # Deduplicate while preserving order
        def dedup(lst: List[Any]) -> List[Any]:
            seen = set()
            return [x for x in lst if not (x in seen or seen.add(x))]

        # Ensure exit code 1 or other general non-zero codes is added if no exit code matched but failures are clear
        if not exit_codes and errors:
            exit_codes.append(1)

        parsed_log = ParsedLog(
            errors=dedup(errors)[:50],  # Limit to top 50 to prevent overflow
            warnings=dedup(warnings)[:50],
            timestamps=dedup(timestamps)[:50],
            stack_traces=dedup(stack_traces)[:20],
            stages=dedup(stages)[:20],
            job_names=[platform],
            exit_codes=dedup(exit_codes)
        )
        
        logger.info(
            f"Parsing complete. Extracted {len(parsed_log.errors)} errors, "
            f"{len(parsed_log.warnings)} warnings, {len(parsed_log.stack_traces)} stack traces."
        )
        return parsed_log
