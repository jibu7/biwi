#!/bin/bash
# Render Start Script for ChannelZap Backend

echo "🚀 Starting ChannelZap ERP Backend..."

# Start the application with Gunicorn
poetry run gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:$PORT \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --log-level info
