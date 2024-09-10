#!/bin/bash

SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR/.."

echo "Building the API image..."
bin/build.sh

echo "Stopping the API..."
docker compose -f docker/api/docker-compose.api.yml down

echo "Do DB migration..."
docker compose -f docker/api/docker-compose.migration.yml up

echo "Deploying the API..."
docker compose -f docker/api/docker-compose.api.yml up -d
