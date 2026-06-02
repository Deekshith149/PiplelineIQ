from typing import Optional
from pydantic import BaseModel, Field

class TextAnalysisRequest(BaseModel):
    """Request body for text log analysis endpoint."""
    log_text: str = Field(..., description="The raw CI/CD text log to analyze")
    platform: Optional[str] = Field(
        None, 
        description="Optional CI/CD platform hint (e.g., 'github', 'jenkins', 'gitlab', 'azure', 'circleci')"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "log_text": "2026-06-02T10:00:00Z ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'\nProcess finished with exit code 1",
                "platform": "github"
            }
        }
    }
