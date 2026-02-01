@echo off
echo Starting Development Environment...
cd /d "%~dp0"

echo [1/2] Starting Backend (Port 3001)...
start "ACT Backend" cmd /k "node server.cjs"

echo [2/2] Starting Frontend (Port 3000)...
start "ACT Frontend" cmd /k "npm run dev"

echo.
echo [INFO] Please wait a moment, then open: http://localhost:3000
echo.
pause
