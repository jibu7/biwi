#!/bin/bash
if [ "$1" == "init-db" ]; then
  poetry run python app/init_db.py
elif [ "$1" == "server" ]; then
  poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
  echo "Usage: ./dev.sh [init-db|server]"
fi
