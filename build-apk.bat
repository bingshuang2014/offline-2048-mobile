@echo off
chcp 65001 >nul
echo ========================================
echo   Offline 2048 - Build APK (Preview)
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking login status...
npx eas-cli whoami
if errorlevel 1 (
    echo.
    echo Not logged in to Expo.
    echo.
    echo Please run:
    echo   npx eas-cli login
    echo.
    pause
    exit /b 1
)

echo.
echo Logged in.
echo.
echo [2/3] Building APK (preview)...
echo.

npx eas-cli build --platform android --profile preview

if errorlevel 1 (
    echo.
    echo Build failed.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build succeeded!
echo ========================================
echo.
echo Download APK from the link above.
echo.
pause
