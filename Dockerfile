# Avi Games World - Production Dockerfile
FROM python:3.12-slim

# Prevent Python from writing .pyc files & enable unbuffered standard I/O
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Set application working directory
WORKDIR /app

# Install system dependencies for PostgreSQL & container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . /app/

# Ensure entrypoint is executable
RUN chmod +x /app/entrypoint.sh

# Expose HTTP port
EXPOSE 8000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Launch container via entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "space_racing_project.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--threads", "2", "--timeout", "120"]
