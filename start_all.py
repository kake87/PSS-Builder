#!/usr/bin/env python3
"""
PSS Builder - Complete Project Startup Script
Запускает backend и frontend одновременно
"""

import subprocess
import os
import sys
import time
from pathlib import Path

def main():
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"
    
    print("=" * 70)
    print("PSS Builder - Startup Script")
    print("=" * 70)
    print(f"Project Root: {project_root}\n")
    
    # Backend
    print("🚀 Starting Backend...")
    backend_venv = backend_dir / "venv"
    
    if not backend_venv.exists():
        print("📦 Creating Python virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", str(backend_venv)], 
                      cwd=backend_dir, check=True)
        print("✅ Virtual environment created")
    
    # Backend command
    if sys.platform == "win32":
        python_exe = backend_venv / "Scripts" / "python.exe"
    else:
        python_exe = backend_venv / "bin" / "python"
    
    backend_install_cmd = [
        str(python_exe),
        "-m", "pip", "install", "-q",
        "fastapi", "uvicorn", "pydantic", "sqlalchemy"
    ]
    
    print("📦 Installing backend dependencies...")
    subprocess.run(backend_install_cmd, cwd=backend_dir, 
                  capture_output=True, check=False)
    print("✅ Backend dependencies installed\n")
    
    # Start backend in subprocess
    backend_start_cmd = [
        str(python_exe),
        "-m", "uvicorn",
        "app.main:app",
        "--reload",
        "--host", "127.0.0.1",
        "--port", "8000"
    ]
    
    print("🔌 Starting Backend server...")
    backend_process = subprocess.Popen(
        backend_start_cmd,
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    print("✅ Backend started on http://127.0.0.1:8000\n")
    
    # Wait for backend to initialize
    time.sleep(3)
    
    # Frontend
    print("🚀 Starting Frontend...")
    node_modules = frontend_dir / "node_modules"
    
    if not node_modules.exists():
        print("📦 Installing npm dependencies...")
        # Use shell=True for Windows compatibility
        subprocess.run("npm install --quiet", 
                      cwd=frontend_dir, shell=True, check=True)
        print("✅ npm dependencies installed\n")
    
    print("🔌 Starting Frontend dev server...")
    
    # Use shell=True for Windows npm command compatibility
    frontend_process = subprocess.Popen(
        "npm run dev",
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        shell=True
    )
    print("✅ Frontend started on http://localhost:3000\n")
    
    # Summary
    print("=" * 70)
    print("✅ All services started successfully!")
    print("=" * 70)
    print("\n📋 Summary:")
    print("   Backend:  http://127.0.0.1:8000")
    print("   Frontend: http://localhost:3000")
    print("   API Docs: http://127.0.0.1:8000/docs")
    print("\nPress Ctrl+C to stop all services...\n")
    
    try:
        # Keep processes running
        backend_process.wait()
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        backend_process.terminate()
        frontend_process.terminate()
        time.sleep(1)
        try:
            backend_process.kill()
            frontend_process.kill()
        except:
            pass
        print("✅ All services stopped")

if __name__ == "__main__":
    main()
