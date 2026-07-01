@echo off
chcp 65001 >nul
title Expo Mobile - Web

echo ========================================
echo  Expo Mobile Web Development Server
echo ========================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [1/2] Installing dependencies...
    call npm install
)

echo [2/2] Starting Metro Bundler...
echo.
echo  URL: http://localhost:8081
echo  Logs will be shown below:
echo ========================================
echo.

call npm run web 2>&1 | tee.exe /a /d "%~dp0\expo-web.log" 2>nul || call npm run web > "%~dp0\expo-web.log" 2>&1

pause
