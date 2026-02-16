FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY server_rest.py .

# Expose MCP server port
EXPOSE 8000

# Run the REST server (compatible with NOVA SDK)
CMD ["python", "server_rest.py"]
