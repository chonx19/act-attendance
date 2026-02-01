@echo off
echo ========================================================
echo   ACT & R - Force Rebuild System
echo ========================================================
echo.

echo [Step 1] Cleaning old files...
if exist "dist" (
    rmdir /s /q "dist"
    echo [OK] Old build removed.
)

echo.
echo [Step 2] Building New Website Version...
echo (This may take 1-2 minutes)
echo.

call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build Failed!
    echo Please check if Node.js is installed correctly.
    pause
    exit /b
)

echo.
echo ========================================================
echo   BUILD SUCCESSFUL!
echo ========================================================
echo.
echo Now you can close this window and run 'start_custom_domain.bat'
echo.
pause
