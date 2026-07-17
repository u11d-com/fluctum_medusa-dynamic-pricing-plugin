#!/bin/bash

# Database configuration
DB_NAME="dynamic_pricing"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Connection string
CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}"

echo "🔌 Terminating active connections to ${DB_NAME}..."
psql "${CONNECTION_STRING}/postgres" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

echo "🗑️  Dropping database ${DB_NAME}..."
psql "${CONNECTION_STRING}/postgres" -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";"

echo "✨ Creating new database ${DB_NAME}..."
psql "${CONNECTION_STRING}/postgres" -c "CREATE DATABASE \"${DB_NAME}\";"

echo "Running migrations..."
(cd starter && pnpm run backend:migrate)

echo "Creating admin user..."
(cd starter && pnpm run backend:create-admin)

echo "📝 Fetching publishable key from database..."
PUBLISHABLE_KEY=$(psql "${CONNECTION_STRING}/${DB_NAME}" -t -c "SELECT token FROM api_key WHERE type = 'publishable' LIMIT 1;" | xargs)

if [ -n "$PUBLISHABLE_KEY" ]; then
  echo "🔑 Updating storefront .env with publishable key..."
   STOREFRONT_ENV="starter/storefront/.env"
  
  if [ -f "$STOREFRONT_ENV" ]; then
    # Update existing key
    sed -i.bak "s/^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*/NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${PUBLISHABLE_KEY}/" "$STOREFRONT_ENV"
    rm -f "${STOREFRONT_ENV}.bak"
    echo "✓ Updated publishable key: ${PUBLISHABLE_KEY}"
  else
    echo "⚠️  Storefront .env file not found at ${STOREFRONT_ENV}"
  fi
else
  echo "⚠️  No publishable key found in database"
fi

echo "✅ Database reset complete!"
