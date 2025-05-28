#!/bin/bash

# COMPASS Model Training Script
# 
# This script starts the sequential model training with notifications
# and ensures proper environment setup.

# Set environment variables for training
export TRAINING_SCHEDULED_TIME="02:00"
export TRAINING_TIMEZONE="America/Chicago"
export TRAINING_MAX_RUNTIME=25200000  # 7 hours in milliseconds
export TRAINING_EPOCHS=150
export TRAINING_BATCH_SIZE=64
export ENABLE_MODEL_TRAINING=true
export NODE_ENV=production
export LOG_LEVEL=info

# Use Neon DB instead of MongoDB
export USE_NEON_DB=true
export ENABLE_NEON_MEMORY=true

# Check if Neon DB connection string is set
if [ -z "$NEON_DB_CONNECTION_STRING" ]; then
  echo "WARNING: NEON_DB_CONNECTION_STRING environment variable is not set"
  echo "Make sure it's set in the .env file or export it before running this script"
fi

# Optional email notification (uncomment and set if needed)
# export TRAINING_NOTIFICATION_EMAIL="your-email@example.com"

# Set TensorFlow.js environment variables
export TF_CPP_MIN_LOG_LEVEL=2  # Reduce TensorFlow logging verbosity
export TF_FORCE_GPU_ALLOW_GROWTH=true  # Allow GPU memory growth

echo "Starting COMPASS model training with notifications..."
echo "Models will be trained in sequence: Team Rating, Game Prediction, Strength of Schedule, Player Impact"
echo "Training will continue until models reach sufficient quality or time limit is reached"
echo ""
echo "You'll be notified when:"
echo "- Each individual model reaches sufficient quality"
echo "- All models are ready for use"
echo "- Training completes (success or failure)"
echo ""
echo "Press Ctrl+C to stop monitoring (training will continue in background)"
echo ""

# Run the training script
node scripts/monitor-and-notify-training.js

# Check the exit code
if [ $? -ne 0 ]; then
  echo "Error starting training. Check the logs for details."
  exit 1
fi

echo "Training started successfully and is running in the background"
echo "Notifications will be logged to ./results/sequential-training/notifications.log"