#!/bin/bash

# Check-in Service Startup Script
# This script starts all components of the Check-in Service application:
# 1. .NET Core API backend
# 2. AdminPanel frontend
# 3. UserFrontend

# Configuration
API_PORT=5141
ADMIN_PORT=8080
USER_PORT=8081
LOG_DIR="./logs"
PROJECT_DIR="$(pwd)"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"
echo "Created logs directory at: $LOG_DIR"

# Function to check if a port is already in use
port_in_use() {
  lsof -i:"$1" &>/dev/null
  return $?
}

# Function to display colored output
print_message() {
  local color=$1
  local message=$2
  
  case $color in
    "green") echo -e "\033[0;32m$message\033[0m" ;;
    "red") echo -e "\033[0;31m$message\033[0m" ;;
    "yellow") echo -e "\033[0;33m$message\033[0m" ;;
    "blue") echo -e "\033[0;34m$message\033[0m" ;;
    *) echo "$message" ;;
  esac
}

# Function to kill processes by port
kill_process_on_port() {
  local port=$1
  if port_in_use "$port"; then
    print_message "yellow" "Stopping service on port $port..."
    lsof -ti:"$port" | xargs kill -9 2>/dev/null
    sleep 1
  fi
}

# Function to stop all services
stop_all() {
  print_message "blue" "Stopping all services..."
  kill_process_on_port $API_PORT
  kill_process_on_port $ADMIN_PORT
  kill_process_on_port $USER_PORT
  print_message "green" "All services stopped."
}

# Handle script termination
trap stop_all EXIT INT TERM

# Check if ports are already in use and stop services if needed
if port_in_use $API_PORT; then
  print_message "yellow" "Port $API_PORT is already in use. Stopping the service..."
  kill_process_on_port $API_PORT
fi

if port_in_use $ADMIN_PORT; then
  print_message "yellow" "Port $ADMIN_PORT is already in use. Stopping the service..."
  kill_process_on_port $ADMIN_PORT
fi

if port_in_use $USER_PORT; then
  print_message "yellow" "Port $USER_PORT is already in use. Stopping the service..."
  kill_process_on_port $USER_PORT
fi

# Start the API
print_message "blue" "Starting .NET Core API on https://localhost:$API_PORT..."
cd "$PROJECT_DIR"
dotnet run --project CheckinService.Api --urls="http://localhost:$API_PORT" > "$PROJECT_DIR/$LOG_DIR/api.log" 2>&1 &
API_PID=$!

# Wait for API to start
print_message "yellow" "Waiting for API to start..."
sleep 5

# Check if API started successfully
if ! ps -p $API_PID > /dev/null; then
  print_message "red" "Failed to start API. Check logs at $LOG_DIR/api.log"
  exit 1
fi

# Start the AdminPanel
print_message "blue" "Starting AdminPanel on http://localhost:$ADMIN_PORT..."
cd "$PROJECT_DIR/AdminPanel"
npx http-server -p $ADMIN_PORT > "$PROJECT_DIR/$LOG_DIR/admin.log" 2>&1 &
ADMIN_PID=$!

# Start the UserFrontend
print_message "blue" "Starting UserFrontend on http://localhost:$USER_PORT..."
cd "$PROJECT_DIR/UserFrontend"
npx http-server -p $USER_PORT > "$PROJECT_DIR/$LOG_DIR/user.log" 2>&1 &
USER_PID=$!

# Wait a moment to ensure services start
sleep 2

# Check if services started successfully
if ! ps -p $ADMIN_PID > /dev/null; then
  print_message "red" "Failed to start AdminPanel. Check logs at $PROJECT_DIR/$LOG_DIR/admin.log"
  exit 1
fi

if ! ps -p $USER_PID > /dev/null; then
  print_message "red" "Failed to start UserFrontend. Check logs at $PROJECT_DIR/$LOG_DIR/user.log"
  exit 1
fi

# Print success message with URLs
print_message "green" "✅ Check-in Service started successfully!"
print_message "green" "API: http://localhost:$API_PORT/api"
print_message "green" "AdminPanel: http://localhost:$ADMIN_PORT"
print_message "green" "UserFrontend: http://localhost:$USER_PORT"
print_message "yellow" "Logs are available in the $LOG_DIR directory"
print_message "yellow" "Press Ctrl+C to stop all services"

# Keep script running until user presses Ctrl+C
wait