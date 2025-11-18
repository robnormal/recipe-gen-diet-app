#!/bin/bash
set -e

# Create template test database
echo "Creating template test database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE template_test_db;
EOSQL

# Populate template database with schema
echo "Populating template test database with schema..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname template_test_db < /docker-entrypoint-initdb.d/schema.sql

echo "Template test database created successfully!"

