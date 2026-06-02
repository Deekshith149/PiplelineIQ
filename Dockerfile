# Use a lightweight official Python runtime base image
FROM python:3.11-slim

# Set environment variables to optimize Python container execution
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set container working directory
WORKDIR /app

# Install system dependencies (useful for PyTorch/Transformers or sqlite setups)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependency manifest
COPY requirements.txt .

# Install dependencies (utilize pip cache matching)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code and mock static files
COPY src/ /app/src/

# Expose server port
EXPOSE 8000

# Launch FastAPI web application with production-grade uvicorn settings
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
