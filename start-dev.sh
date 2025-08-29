#!/bin/bash

echo "Starting AuraiumLMS Backend in development mode..."
echo "Press Ctrl+C to stop"

# Function to cleanup on exit
cleanup() {
    echo "Shutting down backend..."
    pkill -f "tsx watch"
    pkill -f "node.*server"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the backend with automatic restart
while true; do
    echo "Starting backend server..."
    npm run dev
    
    # If we get here, the server crashed
    echo "Backend server crashed or stopped. Restarting in 3 seconds..."
    sleep 3
done
