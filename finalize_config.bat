@echo off
echo ========================================================
echo   ACT ^& R - Finalize Device Config (Key: 1234)
echo ========================================================
echo.
echo Setting Server URL on 192.168.1.3...
echo.
node configure_device_final.cjs
echo.
echo ========================================================
echo 1. Check if you see "Succeed" or "OK" above.
echo 2. If yes, PLEASE RESTART (REBOOT) THE DELI DEVICE.
echo 3. After reboot, check if data appears in the Web Report.
echo ========================================================
pause
