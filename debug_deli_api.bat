@echo off
echo ========================================================
echo   ACT & R - Device API Probe
echo ========================================================
echo.
echo Connecting to 192.168.1.3...
echo.
node probe_device.cjs > probe_log.txt 2>&1
type probe_log.txt
echo.
echo ========================================================
echo Scan Complete. Please copy the text above or from 'probe_log.txt'
echo and send it to me so I can analyze the API.
echo ========================================================
pause
