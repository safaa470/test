#!/bin/bash

echo "Starting Warehouse Management System..."
echo ""
echo "Backend API will run on: http://localhost:5000"
echo "Frontend App will be served from: http://localhost:5000"
echo ""

echo "Installing dependencies..."
npm install

echo ""
echo "Building frontend..."
npm run build

echo ""
echo "Starting server..."
npm run server &

echo ""
echo "Waiting for server to start..."
sleep 5

echo ""
echo "Application started successfully!"
echo "The application is running at: http://localhost:5000"
echo ""
echo "Login credentials:"
echo "Username: admin"
echo "Password: admin"
echo ""
echo "Press Ctrl+C to stop the server."

# Keep the script running
wait