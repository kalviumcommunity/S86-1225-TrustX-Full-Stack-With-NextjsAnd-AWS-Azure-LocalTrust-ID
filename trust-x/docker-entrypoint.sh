#!/bin/sh
set -e

echo "======================================"
echo "Starting TrustX Application"
echo "======================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL is not set!"
fi

# Run Prisma migrations if needed
echo "Running database migrations..."
npx prisma migrate deploy || echo "Migration failed or not needed"

echo "Starting Next.js server..."
exec "$@"
