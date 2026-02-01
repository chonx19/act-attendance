@echo off
cd /d "%~dp0"
echo Starting Server Launcher...
echo --------------------------------
echo Step 1: Checking Node.js Path...

:: Hardcoded path with quotes
set "NODE_PATH=C:\Program Files\nodejs\node.exe"

if exist "%NODE_PATH%" (
    echo [OK] Found Node.js at: "%NODE_PATH%"
) else (
    echo [ERROR] Node.js NOT found at: "%NODE_PATH%"
    echo Please install Node.js manually.
    pause
)

echo --------------------------------
echo Step 2: Checking Node Version...
"%NODE_PATH%" -v

echo --------------------------------
echo Step 2.5: Checking Dependencies...
if not exist "node_modules\express" (
    echo [INFO] Module 'express' not found. Installing...
    "C:\Program Files\nodejs\npm.cmd" install express cors body-parser
) else (
    echo [OK] Dependencies found.
)
echo --------------------------------

echo Step 3: Launching Server...
echo If this fails, please take a screenshot or read the error below.
echo --------------------------------

"%NODE_PATH%" server.cjs

echo --------------------------------
echo Server process ended.
pause
