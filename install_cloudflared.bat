@echo off
echo ========================================================
echo   ACT ^& R - Custom Domain Installer (Cloudflare)
echo ========================================================
echo.

cd /d "%~dp0"

IF NOT EXIST "cloudflared.exe" (
    echo [INFO] Downloading Cloudflare Tunnel Software...
    
    :: Try using Curl first (Built-in on Windows 10/11)
    curl -L -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
    
    :: Verify if download succeeded
    if not exist "cloudflared.exe" (
        echo [INFO] Curl failed. Trying PowerShell...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
    )

    if not exist "cloudflared.exe" (
        echo [ERROR] Download Failed. Please download 'cloudflared-windows-amd64.exe' manually
        echo from https://github.com/cloudflare/cloudflared/releases/latest
        echo and rename it to 'cloudflared.exe' in this folder.
        pause
        exit /b
    )
    echo [OK] Download Complete.
)

echo.
echo ========================================================
echo   STEP 1: LOGIN TO CLOUDFLARE
echo   A browser window will open. Please select your domain.
echo ========================================================
echo.
pause

cloudflared.exe tunnel login

echo.
echo ========================================================
echo   STEP 2: CREATE TUNNEL
echo   We will now create a secure tunnel for 'act-server'.
echo ========================================================
echo.

cloudflared.exe tunnel create act-server
echo.
echo [INFO] Tunnel created. Configuring...

echo.
echo ========================================================
echo   STEP 3: CONFIGURATION
echo   Please enter your domain name exactly as it appears in Cloudflare
echo   Example: act-precision.com
echo ========================================================
echo.
set /p domain="Enter your Domain Name: "

echo.
echo [INFO] Linking tunnel to https://%domain%
cloudflared.exe tunnel route dns act-server %domain%

echo.
echo [INFO] Creating config file...
(
echo tunnel: act-server
echo credentials-file: %USERPROFILE%\.cloudflared\*.json
echo. 
echo ingress:
echo   - hostname: %domain%
echo     service: http://localhost:3001
echo   - service: http_status:404
) > config.yml

echo.
echo ========================================================
echo   SETUP COMPLETE!
echo   To start the website, run: start_custom_domain.bat
echo ========================================================
echo.
pause
