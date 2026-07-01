@echo off
echo ========================================
echo   离线2048 - APK 构建脚本
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查登录状态...
npx eas-cli whoami
if errorlevel 1 (
    echo.
    echo ❌ 未登录 Expo 账户
    echo.
    echo 请先运行以下命令登录:
    echo   npx eas-cli login
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ 已登录
echo.
echo [2/3] 开始构建 APK (预览版本)...
echo.

npx eas-cli build --platform android --profile preview

if errorlevel 1 (
    echo.
    echo ❌ 构建失败
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 构建成功！
echo ========================================
echo.
echo APK 文件可以通过以下链接下载:
echo (请查看上面的构建输出中的下载链接)
echo.
pause
