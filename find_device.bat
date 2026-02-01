@echo off
echo ========================================================
echo   ACT & R - Device Scanner (Find Device on LAN)
echo ========================================================
echo.
echo Scanning local network for devices (Ports 80, 5005, 4370)...
echo This might take a minute.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$subnet = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.PrefixOrigin -eq 'Dhcp' }).IPAddress; " ^
 "if (!$subnet) { $subnet = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' }).IPAddress }; " ^
 "Write-Host 'Local IP: ' $subnet[0]; " ^
 "Write-Host 'Scanning ARP Table...'; " ^
 "$neighbors = Get-NetNeighbor -AddressFamily IPv4 | Where-Object { $_.State -eq 'Reachable' -or $_.State -eq 'Stale' }; " ^
 "foreach ($n in $neighbors) { " ^
 "  $ip = $n.IPAddress; " ^
 "  Write-Host -NoNewline '.' ; " ^
 "  $ports = @(80, 5005, 4370); " ^
 "  foreach ($p in $ports) { " ^
 "    $conn = Test-NetConnection -ComputerName $ip -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue; " ^
 "    if ($conn) { " ^
 "      Write-Host ''; Write-Host 'FOUND CANDIDATE: ' $ip ' (Port ' $p ' Open)'; " ^
 "      if ($p -eq 80) { " ^
 "        try { " ^
 "          $res = Invoke-WebRequest -Uri 'http://'$ip -TimeoutSec 2 -UseBasicParsing; " ^
 "          Write-Host '   - Title: ' $res.BaseResponse.Title; " ^
 "        } catch {} " ^
 "      } " ^
 "    } " ^
 "  } " ^
 "}; " ^
 "Write-Host ''; Write-Host 'Scan Complete.';"

pause
