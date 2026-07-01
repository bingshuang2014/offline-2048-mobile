# Expo Mobile - Web 启动脚本
# 使用方法: 右键 -> 使用 PowerShell 运行

Write-Host "🚀 启动 Expo Web 开发服务器..." -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot

# 检查 node_modules 是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 首次运行，安装依赖中..." -ForegroundColor Yellow
    npm install
}

Write-Host "🌐 启动 Web 服务器..." -ForegroundColor Cyan
Write-Host "   浏览器将自动打开 http://localhost:8081" -ForegroundColor Gray
Write-Host "   按 Ctrl+C 停止服务器" -ForegroundColor Gray
Write-Host ""

npm run web
