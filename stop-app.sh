#!/bin/bash

# Check-in Service Stop Script
# This script stops all components of the Check-in Service application

# Configuration
API_PORT=5141
ADMIN_PORT=8080
USER_PORT=8081

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

# Function to check if a port is in use
port_in_use() {
  lsof -i:"$1" &>/dev/null
  return $?
}

# Function to kill processes by port
kill_process_on_port() {
  local port=$1
  if port_in_use "$port"; then
    print_message "yellow" "Stopping service on port $port..."
    lsof -ti:"$port" | xargs kill -9 2>/dev/null
    if [ $? -eq 0 ]; then
      print_message "green" "Service on port $port stopped successfully."
    else
      print_message "red" "Failed to stop service on port $port."
    fi
  else
    print_message "blue" "No service running on port $port."
  fi
}

# Stop all services
print_message "blue" "Stopping all Check-in Service components..."

# Stop the API
kill_process_on_port $API_PORT

# Stop the AdminPanel
kill_process_on_port $ADMIN_PORT

# Stop the UserFrontend
kill_process_on_port $USER_PORT

print_message "green" "All Check-in Service components have been stopped."