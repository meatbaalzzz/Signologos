#!/bin/bash
# ============================================================
# Signologos — PostgreSQL Initialization Script
# ============================================================
#
# This script runs automatically when the PostgreSQL container
# starts for the first time (via docker-entrypoint-initdb.d/).
#
# It creates extensions and sets the timezone.

set -e

echo "[init-db] Initializing Signologos database..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable UUID generation
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Set timezone
    SET timezone = 'UTC';

    -- Performance settings
    ALTER DATABASE signologos SET statement_timeout = '30s';
    ALTER DATABASE signologos SET lock_timeout = '10s';

    GRANT ALL PRIVILEGES ON DATABASE signologos TO signologos;
EOSQL

echo "[init-db] Database initialized successfully."
