#!/bin/bash

PORT=${1:-3000}

echo "Starting application on port $PORT"

PORT=$PORT docker-compose up --build