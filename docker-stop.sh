#!/bin/bash

# FlexTime Docker Stop Script

echo "==== Stopping FlexTime Docker Services ===="

# Stop all services
docker-compose down

echo "All FlexTime services have been stopped"