@echo off
echo ====================================
echo n8n Agent Swarm - Windows Startup
echo ====================================
echo.

echo [1/3] Starting Docker containers...
docker-compose up -d

echo.
echo [2/3] Waiting for n8n to be ready (30 seconds)...
timeout /t 30 /nobreak

echo.
echo [3/3] Importing workflow...
powershell -ExecutionPolicy Bypass -File ".\scripts\auto-import.ps1"

echo.
echo ====================================
echo n8n is ready at http://localhost:5678
echo ====================================
pause
