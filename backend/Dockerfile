FROM python:3.11-slim

WORKDIR /app

# Copy all backend source code and database files
COPY . /app

# Cloud providers set PORT dynamically (default 8000)
ENV PORT=8000
EXPOSE 8000

# Run zero-dependency high performance server
CMD ["python", "server.py"]
