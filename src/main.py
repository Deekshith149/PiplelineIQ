import os
import logging
import sqlite3
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from src.config import settings
from src.api.routes import router as api_router

logger = logging.getLogger("ci_cd_analyzer.main")

def init_db() -> None:
    """Initializes development SQLite database schema."""
    logger.info(f"Initializing SQLite database at: {settings.sqlite_db_path}")
    conn = None
    try:
        conn = sqlite3.connect(settings.sqlite_db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                platform TEXT,
                failure_type TEXT,
                root_cause TEXT,
                summary TEXT,
                timestamp TEXT NOT NULL,
                evidence TEXT,
                recommended_fixes TEXT
            );
        """)
        # Schema migration check: ensure columns exist in case table already existed
        cursor.execute("PRAGMA table_info(analysis_reports)")
        columns = [row[1] for row in cursor.fetchall()]
        if "evidence" not in columns:
            cursor.execute("ALTER TABLE analysis_reports ADD COLUMN evidence TEXT")
        if "recommended_fixes" not in columns:
            cursor.execute("ALTER TABLE analysis_reports ADD COLUMN recommended_fixes TEXT")
        conn.commit()
        logger.info("SQLite database schema verified/created successfully.")
    except Exception as e:
        logger.error(f"Error during SQLite DB schema initialization: {str(e)}")
    finally:
        if conn:
            conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for FastAPI startup and shutdown operations."""
    logger.info("FastAPI Application starting up...")
    # Initialize DB schema
    init_db()
    yield
    logger.info("FastAPI Application shutting down...")

# Create FastAPI app
app = FastAPI(
    title="AI-Powered CI/CD Log Analyzer",
    description="A multi-agent system powered by DistilBERT and Gemini to analyze pipeline logs.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(api_router, prefix="/api/v1")

# Mount Static Files (ensure the folder is created)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/styles.css")
async def styles():
    return FileResponse(os.path.join(STATIC_DIR, "styles.css"))

@app.get("/app.js")
async def app_js():
    return FileResponse(os.path.join(STATIC_DIR, "app.js"))

# Serve Frontend SPA at Root with API JSON Welcome Fallback
@app.get("/")
async def root():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": "Welcome to the AI-Powered CI/CD Log Analyzer API!",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/v1/health",
            "analyze_file": "/api/v1/analyze",
            "analyze_text": "/api/v1/analyze-text",
            "reports": "/api/v1/reports"
        }
    }

# Global exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected backend exception occurred: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting development server...")
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)
