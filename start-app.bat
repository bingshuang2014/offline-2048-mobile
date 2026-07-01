@echo off
chcp 65001 >nul
title Expo Mobile - App

set EXPO_ROUTER_APP_ROOT=app
set EXPO_ROUTER_IMPORT_MODE=sync

cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting Expo...
call npx expo start --clear
pause
