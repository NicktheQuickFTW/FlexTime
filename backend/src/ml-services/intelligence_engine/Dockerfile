# Dockerfile for the HELiiX Intelligence Engine

# Use Python 3.9 as the base image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=4001

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the port
EXPOSE ${PORT}

# Set the entrypoint
ENTRYPOINT ["python", "run.py"]

# Default command
CMD ["--host", "0.0.0.0", "--port", "4001"]