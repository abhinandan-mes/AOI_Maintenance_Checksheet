#!/bin/bash

# AOI CheckPoint Quick Start Script

echo "🚀 AOI CheckPoint - Quick Start Setup"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

echo "✓ Node.js found: $(node -v)"
echo "✓ npm found: $(npm -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL might not be installed or not in PATH"
    echo "Please ensure PostgreSQL is running and accessible"
fi

echo ""
echo "📦 Installing Backend Dependencies..."
cd server
npm install
echo "✓ Backend dependencies installed"

echo ""
echo "📦 Installing Frontend Dependencies..."
cd ../client
npm install
echo "✓ Frontend dependencies installed"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Update database credentials in server/.env"
echo "2. Ensure PostgreSQL is running"
echo "3. Run: npm run dev (from server directory)"
echo "4. Run: npm start (from client directory)"
echo ""
echo "🌐 Frontend: http://localhost:3010"
echo "🔧 Backend:  http://localhost:5010"
