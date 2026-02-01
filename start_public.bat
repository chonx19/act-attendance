@echo off
echo ========================================================
echo   ACT & R - Public Internet Access Launcher (Fixed URL)
echo ========================================================
echo.
echo [DATA SAFETY NOTICE]
echo Your data is safely stored on this computer (in the 'data' folder).
echo Even if you close this window or restart the computer,
echo all your Products, Users, and Stock levels remain safe.
echo.
echo ========================================================

echo [Step 1] Initializing System...
start /min start_system.bat

echo [Step 2] Waiting for Server to start...
timeout /t 10 /nobreak >nul

echo.
echo [Step 3] Opening Public Tunnel...
echo.
echo ========================================================
echo   ATTEMPTING TO USE FIXED URL:
echo   https://act-system-chana.loca.lt
echo ========================================================
echo.
echo   NOTE: If the above URL does not work, it means someone else
echo   is using it. A random URL will be assigned instead.
echo.
echo   [PASSWORD REQUIRED?]
echo   If asked for a Tunnel Password, enter this IP:
call curl -s https://loca.lt/mytunnelpassword
echo.
echo ========================================================
echo.

call npx localtunnel --port 3001 --subdomain act-system-chana

pause
