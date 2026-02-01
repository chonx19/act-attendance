@echo off
echo ========================================================
echo   ACT & R - Cloud Connector (Get Public URL)
echo ========================================================
echo.
echo This window will generate a PUBLIC URL for your Deli Device.
echo Keep this window OPEN as long as you want to receive data.
echo.
echo Installing/Running LocalTunnel...
echo.
call npx -y localtunnel --port 3001
pause
