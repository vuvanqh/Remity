#!/bin/bash

PORT=${1:-3000}
INSTANCES=${2:-2}

if [ "$INSTANCES" -lt 2 ]; then
  INSTANCES=2
fi

echo "Starting application on port $PORT with $INSTANCES instances"

PORT=$PORT docker-compose up --build --scale api=$INSTANCES