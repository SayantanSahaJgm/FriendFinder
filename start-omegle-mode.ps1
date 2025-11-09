# Start Socket.IO Server and Next.js Frontend for Omegle-Style Random Chat
Write-Host "========================================"
Write-Host " FriendFinder Random Chat - Quick Start"
Write-Host "========================================"
Write-Host ""

# Start Socket.IO Server in new PowerShell window
Write-Host "Starting Socket.IO Server on port 3004..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:SOCKET_PORT=3004; `$env:NODE_ENV='development'; Write-Host 'Socket.IO Server Starting...' -ForegroundColor Cyan; node server.js"

# Wait 3 seconds
Start-Sleep -Seconds 3

# Start Next.js in new PowerShell window
Write-Host "Starting Next.js Frontend on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Next.js Frontend Starting...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "========================================"
Write-Host " Servers Starting..."
Write-Host "========================================"
Write-Host ""
Write-Host "Two PowerShell windows have opened:" -ForegroundColor Yellow
Write-Host "  1. Socket.IO Server (Port 3004)" -ForegroundColor Cyan
Write-Host "  2. Next.js Frontend (Port 3000)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait for both to show 'Ready' messages, then:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Open: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
