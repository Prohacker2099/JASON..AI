#!/bin/bash

# Kill any processes using port 8990
echo "Checking for processes using port 8990..."
PID=$(lsof -ti:8990)

if [ -n "$PID" ]; then
  echo "Found process $PID using port 8990. Killing it..."
  kill -9 $PID
  echo "Process killed."
else
  echo "No processes found using port 8990."
fi

# Kill any processes using port 8991 (our new port)
echo "Checking for processes using port 8991..."
PID=$(lsof -ti:8991)

if [ -n "$PID" ]; then
  echo "Found process $PID using port 8991. Killing it..."
  kill -9 $PID
  echo "Process killed."
else
  echo "No processes found using port 8991."
fi

echo "Cleanup complete. You can now start the server."