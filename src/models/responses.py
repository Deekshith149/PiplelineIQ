from typing import List, Optional
from pydantic import BaseModel, Field
from src.models.state import FinalReport

class HealthStatusResponse(BaseModel):
    """System health check response."""
    status: str = "ok"
    torch_available: bool
    transformers_available: bool
    gemini_configured: bool
    database_connected: bool

class AnalysisResponse(BaseModel):
    """Standard analysis execution response."""
    success: bool
    report: Optional[FinalReport] = None
    report_id: Optional[int] = None
    errors: List[str] = Field(default_factory=list)
