@echo off
echo ==========================================
echo ACT & R Application Launcher (Debug Mode)
echo ==========================================
echo.

REM Force change directory to the known project path
cd /d "d:\Desktop\ACT\Programs"
echo Current Directory: %CD%

REM Check for package.json
if not exist "package.json" (
    echo [ERROR] package.json NOT FOUND in %CD%
    echo Please make sure the file is in the correct folder.
    pause
    exit /b
)

echo.
echo [1] Checking Node.js...
node -v
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed or NOT in system PATH.
    echo Please install Node.js LTS from https://nodejs.org/
    pause
    exit /b
)

echo.
echo [2] Installing Dependencies (if needed)...
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
) else (
    echo node_modules already exists. Skipping install.
)

echo.
echo [3] Starting Server...
call npm run dev

echo.
echo Server stopped.
pause
