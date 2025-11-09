@echo off
REM Start Socket.IO Server and Next.js Frontend for Omegle-Style Random Chat
echo ========================================
echo  FriendFinder Random Chat - Quick Start
echo ========================================
echo.
echo Starting Socket.IO Server on port 3004...
echo.

REM Open new terminal for Socket.IO server
start "Socket.IO Server (Port 3004)" cmd /k "cd /d %~dp0 && set SOCKET_PORT=3004 && set NODE_ENV=development && node server.js"

REM Wait 3 seconds for server to start
timeout /t 3 /nobreak > nul

echo.
echo Starting Next.js Frontend on port 3000...
echo.

REM Open new terminal for Next.js
start "Next.js Frontend (Port 3000)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo  Servers Starting...
echo ========================================
echo.
echo Two terminal windows have opened:
echo   1. Socket.IO Server (Port 3004)
echo   2. Next.js Frontend (Port 3000)
echo.
echo Wait for both to show "Ready" messages, then:
echo.
echo   Open: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
