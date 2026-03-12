#!/usr/bin/env pwsh
<#
PSS Builder - Complete Project Startup Script
Run this script to start both backend and frontend
#>

$projectRoot = Get-Location
Write-Host "Starting PSS Builder..." -ForegroundColor Green
Write-Host "Project Root: $projectRoot" -ForegroundColor Cyan

Write-Host ""
Write-Host "Starting Backend..." -ForegroundColor Yellow

$backendCmd = @"
cd '$projectRoot\backend'
if (-not (Test-Path '.\venv')) {
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
pip install -q -r requirements.txt 2>$null
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 3

Write-Host "Starting Frontend..." -ForegroundColor Yellow

$frontendCmd = @"
cd '$projectRoot\frontend'
if (-not (Test-Path '.\node_modules')) {
    npm install --quiet
}
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "Services started!" -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
