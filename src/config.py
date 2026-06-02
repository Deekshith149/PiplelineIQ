import os
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings, reading from environment variables or .env file."""
    
    # AI models
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    distilbert_model_path: str = "distilbert-base-uncased"
    
    # DB
    sqlite_db_path: str = "ci_cd_analyzer.db"
    
    # Application Config
    log_level: str = "INFO"
    
    # GitHub Integration
    github_client_id: str | None = None
    github_client_secret: str | None = None
    github_redirect_uri: str = "http://localhost:8000/api/v1/auth/github/callback"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Instantiate settings
settings = Settings()

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ci_cd_analyzer")
logger.info("Configuration loaded.")
