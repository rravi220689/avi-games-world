#!/bin/sh
set -e

echo "=================================================="
echo "       🚀 AVI GAMES WORLD DOCKER CONTAINER        "
echo "=================================================="

echo "==> Applying database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static assets..."
python manage.py collectstatic --noinput

echo "==> Checking initial game data..."
python manage.py seed_data || echo "Warning: Seed data skipped or completed."

echo "==> Launching server..."
exec "$@"
