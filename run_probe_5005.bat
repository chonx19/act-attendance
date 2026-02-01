@echo off
echo ========================================================
echo   ACT ^& R - Port 5005 Probe
echo ========================================================
echo.
echo Checking hidden management port...
echo.
node probe_port_5005.cjs
echo.
echo ========================================================
echo Capture any "RESPONSE" lines!
echo ========================================================
pause
