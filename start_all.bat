@echo off
REM PSS Builder - Start all services
REM Simple batch script to run backend and frontend

echo ===============================================
echo PSS Builder - Startup Script
echo ===============================================
echo.

echo 🚀 Starting Backend...
cd /d "%~dp0backend"

if not exist venv (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
)

echo 📦 Installing dependencies...
call venv\Scripts\activate.bat
pip install -q fastapi uvicorn pydantic sqlalchemy

echo 🔌 Starting Backend server on http://127.0.0.1:8000
start "PSS Builder - Backend" python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

timeout /t 3 /nobreak

echo.
echo 🚀 Starting Frontend...
cd /d "%~dp0frontend"

if not exist node_modules (
    echo 📦 Installing npm dependencies...
    call npm install --quiet
    echo ✅ npm dependencies installed
)

echo 🔌 Starting Frontend dev server on http://localhost:3000
start "PSS Builder - Frontend" npm run dev

echo.
echo ✅ Services started!
echo.
echo 📋 Summary:
echo    Backend:  http://127.0.0.1:8000
echo    Frontend: http://localhost:3000
echo    API Docs: http://127.0.0.1:8000/docs
echo.
echo Close the terminal windows to stop services.
