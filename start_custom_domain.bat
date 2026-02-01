@echo off
echo ========================================================
echo   ACT & R - Custom Domain Launcher
echo ========================================================
echo.

echo [Step 1] Initializing System...
start /min start_system.bat

echo [Step 2] Waiting for Server to start...
timeout /t 10 /nobreak >nul

echo.
echo [Step 3] Opening Public Tunnel...
echo.
echo ========================================================
echo   WEBSITE ONLINE AT YOUR DOMAIN
echo ========================================================
echo.
echo   Don't close this window.
echo.

cloudflared.exe tunnel --config config.yml run act-server

pause
