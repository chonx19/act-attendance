@echo off
echo ========================================================
echo   ACT & R - Production System Launcher
echo ========================================================
echo.

cd /d "%~dp0"

IF NOT EXIST "dist" (
    echo [INFO] First time run detected. Building Frontend...
    call npm run build
    echo [OK] Build Complete.
)

echo.
echo [INFO] Starting Server...
echo [INFO] Access via Browser: http://localhost:3001
echo [INFO] For other devices: http://[YOUR_IP]:3001
echo.
echo Press Ctrl+C to Stop.
echo.

node server.cjs
pause
