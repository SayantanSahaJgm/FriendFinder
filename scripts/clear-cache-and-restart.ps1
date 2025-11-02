# Clear Cache and Restart Development Servers
Write-Host "🧹 Clearing all caches..." -ForegroundColor Cyan

# Stop all Node processes
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear Next.js cache
Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "✓ .next folder deleted" -ForegroundColor Green
}

# Clear node_modules/.cache
Write-Host "Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Path "node_modules/.cache" -Recurse -Force
    Write-Host "✓ node_modules/.cache deleted" -ForegroundColor Green
}

# Clear Turbopack cache if exists
if (Test-Path ".turbo") {
    Remove-Item -Path ".turbo" -Recurse -Force
    Write-Host "✓ .turbo folder deleted" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ All caches cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 To clear browser cache:" -ForegroundColor Cyan
Write-Host "   Chrome/Edge: Press Ctrl+Shift+Delete or Ctrl+F5 for hard refresh" -ForegroundColor White
Write-Host "   Firefox: Press Ctrl+Shift+Delete or Ctrl+Shift+R for hard refresh" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Starting development servers..." -ForegroundColor Cyan
Write-Host ""

# Start servers in new windows
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev:socket"

Write-Host "✅ Servers started in new windows!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Next.js: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔌 Socket.IO: http://localhost:3004" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now perform a HARD REFRESH in your browser:" -ForegroundColor Yellow
Write-Host "  • Windows: Ctrl+F5 or Ctrl+Shift+R" -ForegroundColor White
Write-Host "  • Mac: Cmd+Shift+R" -ForegroundColor White
