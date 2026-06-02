import re
import logging
from typing import Any, Dict, List, Tuple

logger = logging.getLogger("ci_cd_analyzer.ingestion")

class LogIngestionAgent:
    """Agent responsible for validating, normalising, cleaning and smart chunking raw CI/CD logs."""

    def __init__(self, max_lines: int = 1000, context_window: int = 3):
        self.max_lines = max_lines
        self.context_window = context_window
        # Failure keywords to preserve context in large logs
        self.error_keywords = [
            r"fail", r"error", r"exception", r"fatal", 
            r"exit code", r"exit status", r"stderr", 
            r"##\[error\]", r"\[ERROR\]", r"failed"
        ]
        self.keyword_regex = re.compile("|".join(self.error_keywords), re.IGNORECASE)

    def ingest(self, raw_input: Any, filename: str = "raw_text_input") -> Dict[str, Any]:
        """Ingests raw bytes or text log and returns normalized text with metadata."""
        logger.info(f"Ingesting log: {filename}")
        
        # 1. Normalise encoding and type
        log_text = self._normalize_to_string(raw_input)
        
        # 2. Validate input
        if not log_text.strip():
            raise ValueError("Input log is empty or contains only whitespace.")
        
        raw_size_bytes = len(log_text.encode("utf-8", errors="ignore"))
        
        # 3. Clean empty lines & standardise line endings
        cleaned_lines = self._clean_lines(log_text)
        
        # 4. Smart chunking if exceeds limits
        is_chunked = len(cleaned_lines) > self.max_lines
        final_lines = self._smart_chunk(cleaned_lines) if is_chunked else cleaned_lines
        
        final_log = "\n".join(final_lines)
        
        result = {
            "raw_log": final_log,
            "metadata": {
                "source": filename,
                "size_bytes": raw_size_bytes,
                "original_line_count": len(cleaned_lines),
                "processed_line_count": len(final_lines),
                "is_chunked": is_chunked
            }
        }
        
        logger.info(
            f"Ingested {filename} successfully. "
            f"Original lines: {len(cleaned_lines)}, processed: {len(final_lines)}"
        )
        return result

    def _normalize_to_string(self, raw_input: Any) -> str:
        """Helper to convert bytes or various text formats to a standard UTF-8 string."""
        if isinstance(raw_input, str):
            return raw_input
        elif isinstance(raw_input, (bytes, bytearray)):
            # Try UTF-8 first, fallback to common encodings, then replace errors
            for encoding in ("utf-8", "latin-1", "cp1252", "utf-16"):
                try:
                    return raw_input.decode(encoding)
                except UnicodeDecodeError:
                    continue
            return raw_input.decode("utf-8", errors="replace")
        else:
            return str(raw_input)

    def _clean_lines(self, text: str) -> List[str]:
        """Splits text into lines, strips trailing whitespaces, and removes empty lines."""
        lines = text.splitlines()
        cleaned = [line.rstrip() for line in lines if line.strip()]
        return cleaned

    def _smart_chunk(self, lines: List[str]) -> List[str]:
        """Intelligently chunks massive logs by keeping head, tail, and error contexts."""
        logger.info(f"Log exceeds {self.max_lines} lines. Applying smart chunking.")
        
        total_lines = len(lines)
        keep_head_count = 150  # Configuration/init step info
        keep_tail_count = 350  # Final steps/failures
        
        # Identify indices to keep
        indices_to_keep = set()
        
        # 1. Keep head
        for i in range(min(keep_head_count, total_lines)):
            indices_to_keep.add(i)
            
        # 2. Keep tail
        for i in range(max(0, total_lines - keep_tail_count), total_lines):
            indices_to_keep.add(i)
            
        # 3. Smart Scan: Find error lines and add them with context
        for i in range(keep_head_count, total_lines - keep_tail_count):
            line = lines[i]
            if self.keyword_regex.search(line):
                # Add current line and context window around it
                start = max(keep_head_count, i - self.context_window)
                end = min(total_lines - keep_tail_count, i + self.context_window + 1)
                for j in range(start, end):
                    indices_to_keep.add(j)
                    
        # 4. Construct final list, adding placeholder markers where chunks were omitted
        sorted_indices = sorted(list(indices_to_keep))
        final_lines = []
        last_idx = -1
        
        for idx in sorted_indices:
            if last_idx != -1 and idx > last_idx + 1:
                omitted = idx - last_idx - 1
                final_lines.append(f"... [OMITTED {omitted} LINES OF SUCCESSFUL / NON-DIAGNOSTIC LOGS] ...")
            final_lines.append(lines[idx])
            last_idx = idx
            
        return final_lines
