@echo off
chcp 65001 >nul
echo ========================================================
echo   ACT & R - One-Click Launcher (Auto-Fix)
echo ========================================================
echo.
cd /d "%~dp0"

REM 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it first.
    pause
    exit /b
)

REM 2. Install Dependencies (if needed)
if not exist "node_modules" (
    echo [INFO] Installing libraries...
    call npm install
)

REM 3. Build Frontend (if missing)
if not exist "dist" (
    echo [INFO] Building website...
    call npm run build
)

REM 4. Start Server
echo.
echo [SUCCESS] Starting System...
echo [INFO] Opening Browser...
start http://localhost:3001
echo.
echo Server is running. Press Ctrl+C to stop.
node server.cjs
pause
