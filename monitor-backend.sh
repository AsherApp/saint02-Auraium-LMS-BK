#!/bin/bash

echo "🚀 AuraiumLMS Backend Monitor"
echo "This script will keep the backend running and restart it if it crashes"
echo "Press Ctrl+C to stop monitoring"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down backend monitor..."
    pkill -f "tsx watch"
    pkill -f "node.*server"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Function to check if backend is running
check_backend() {
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo "🔄 Starting backend server..."
    cd Endubackend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for the server to start
    sleep 5
    
    # Check if it started successfully
    if check_backend; then
        echo "✅ Backend started successfully (PID: $BACKEND_PID)"
        return 0
    else
        echo "❌ Backend failed to start"
        return 1
    fi
}

# Main monitoring loop
while true; do
    if ! check_backend; then
        echo "⚠️  Backend is not responding, restarting..."
        pkill -f "tsx watch"
        pkill -f "node.*server"
        sleep 2
        
        if start_backend; then
            echo "✅ Backend restarted successfully"
        else
            echo "❌ Failed to restart backend, trying again in 10 seconds..."
            sleep 10
        fi
    else
        echo "✅ Backend is running normally"
    fi
    
    # Check every 30 seconds
    sleep 30
done
