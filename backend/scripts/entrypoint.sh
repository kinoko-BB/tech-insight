#!/bin/bash
set -e

echo "Running Alembic migrations..."
alembic upgrade head

echo "Seeding initial data..."
python -m scripts.seed_data

echo "Starting API server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
