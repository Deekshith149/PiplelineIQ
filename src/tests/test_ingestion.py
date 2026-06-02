import pytest
from src.ingestion.ingestion_agent import LogIngestionAgent

def test_log_ingestion_normalization():
    agent = LogIngestionAgent()
    
    # Test byte input decoding
    byte_input = b"Line 1\n\nLine 2\r\n"
    res = agent.ingest(byte_input)
    assert res["raw_log"] == "Line 1\nLine 2"
    assert res["metadata"]["original_line_count"] == 2
    assert res["metadata"]["processed_line_count"] == 2
    assert res["metadata"]["is_chunked"] is False

def test_log_ingestion_validation_empty():
    agent = LogIngestionAgent()
    with pytest.raises(ValueError):
        agent.ingest("   \n\n  ")

def test_log_ingestion_smart_chunking():
    agent = LogIngestionAgent(max_lines=100)
    
    # Create a log with 600 lines
    lines = [f"Normal line {i}" for i in range(600)]
    # Inject an error line in the middle
    lines[300] = "ERROR: Failed executing compiling phase"
    log_text = "\n".join(lines)
    
    res = agent.ingest(log_text)
    assert res["metadata"]["is_chunked"] is True
    # Ensure it keeps the error line and surrounds it with context
    assert "ERROR: Failed executing compiling phase" in res["raw_log"]
    assert "[OMITTED" in res["raw_log"]
