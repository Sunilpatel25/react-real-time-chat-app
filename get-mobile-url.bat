@echo off
echo ========================================
echo   Chat App - Mobile Access Setup
echo ========================================
echo.

REM Get IP Address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

echo Your Computer's IP Address: %IP%
echo.
echo ========================================
echo   Access from your phone at:
echo   http://%IP%:3000
echo ========================================
echo.
echo Make sure:
echo 1. Backend is running (npm run dev in backend folder)
echo 2. Set USE_NETWORK_IP = true in config.ts
echo 3. Your phone is on the same WiFi network
echo.
pause
