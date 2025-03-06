#!/bin/bash

# Get network interface IP
echo "🔍 Finding your local network IP address..."
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
echo "✅ Your local network IP address: $IP"

# Update .env file with this IP automatically
echo ""
echo "📝 Updating .env.local with your network IP..."
sed -i.bak -e "s|http://SEU_IP_LOCAL:3001|http://$IP:3001|g" -e "s|http://localhost:3001|http://$IP:3001|g" apps/web/.env.local
echo "✅ Updated apps/web/.env.local with: http://$IP:3001"

echo ""
echo "📱 For multi-device testing:"
echo "   - Server Address: http://$IP:3001"
echo "   - Web Client (Computer): http://localhost:3000"
echo "   - Web Client (Mobile): http://$IP:3000"
echo ""

# Start the server in the background
echo "🚀 Starting the server..."
cd apps/server
npm run dev &
SERVER_PID=$!
cd ../..

# Wait for the server to start
echo "⏳ Waiting for the server to start..."
sleep 5

# Start the client
echo "🚀 Starting the web client..."
cd apps/web
npm run dev

# When the client is stopped with Ctrl+C, also stop the server
trap "echo '🛑 Stopping the server...'; kill $SERVER_PID" EXIT

# Wait for the client to exit
wait 