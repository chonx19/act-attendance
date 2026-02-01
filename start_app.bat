@echo off
echo ==========================================
echo ACT ^& R Application Launcher
echo ==========================================
echo.
cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed on this computer!
    echo.
    echo Please download and install "Node.js (LTS)" from:
    echo https://nodejs.org/
    echo.
    echo After installing, please restart this script.
    pause
    exit /b
)

echo [1/2] Checking and Installing Dependencies...
if not exist "node_modules" (
    call npm install
) else (
    echo Dependencies already installed. Skipping...
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Starting Development Server...
echo.
echo A browser window should open shortly...
echo Press Ctrl+C to stop the server.
echo.
call npm run dev
pause
