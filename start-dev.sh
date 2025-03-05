#!/bin/bash

# Display local IP address
echo "Your local network IP address:"
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
echo "IP: $IP"

# Verify if the IP in the configuration files matches
echo ""
echo "Please make sure this IP is correctly set in:"
echo "- apps/web/.env.local"
echo "- apps/server/src/server.ts"
echo ""

# Start the server in the background
echo "Starting the server..."
cd apps/server
npm run dev &
SERVER_PID=$!
cd ../..

# Wait for the server to start
echo "Waiting for the server to start..."
sleep 5

# Start the client
echo "Starting the web client..."
cd apps/web
npm run dev

# When the client is stopped with Ctrl+C, also stop the server
trap "echo 'Stopping the server...'; kill $SERVER_PID" EXIT

# Wait for the client to exit
wait 