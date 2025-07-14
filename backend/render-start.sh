#!/bin/bash
# Render Start Script for ChannelZap Backend

echo "🚀 Starting ChannelZap ERP Backend..."

# Start the application with Uvicorn (like Docker)
poetry run uvicorn app.main:app \
    --host 0.0.0.0 \
    --port $PORT \
    --workers 1
