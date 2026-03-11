#!/bin/bash
# PSS Builder - Complete Project Startup Script (Linux/macOS)
# Run this script to start both backend and frontend

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "   PSS Builder - Security Systems Architecture Constructor      "
echo "   Complete Startup Script (Linux/macOS)                        "
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Project Root: $PROJECT_ROOT"
echo ""

# Check Python
echo "🔍 Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.10+"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo "✅ $PYTHON_VERSION"
echo ""

# Check Node
echo "🔍 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node --version)
echo "✅ Node $NODE_VERSION"
echo ""

# Setup Backend
echo "─────────────────────────────────────────────────────────────"
echo "🚀 Setting up Backend Server..."
echo "─────────────────────────────────────────────────────────────"
echo ""

cd "$PROJECT_ROOT/backend"

if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
    echo ""
fi

echo "✨ Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing Python dependencies..."
pip install -q fastapi uvicorn pydantic sqlalchemy
echo "✅ Dependencies installed"
echo ""

echo "🔌 Starting Uvicorn server..."
echo "Backend will be available at: http://127.0.0.1:8000"
echo "API documentation at: http://127.0.0.1:8000/docs"
echo ""

# Start backend in background
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
echo "✅ Backend started with PID $BACKEND_PID"

# Give backend time to start
sleep 3

# Setup Frontend
echo ""
echo "─────────────────────────────────────────────────────────────"
echo "🚀 Setting up Frontend Development Server..."
echo "─────────────────────────────────────────────────────────────"
echo ""

cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install --quiet
    echo "✅ Dependencies installed"
    echo ""
fi

echo "🔌 Starting Vite dev server..."
echo "Frontend will be available at: http://localhost:3000"
echo ""
echo "Backend API will be proxied from: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start frontend
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
