@echo off
echo ================================
echo   Docker Desktop Restart Script
echo ================================
echo.

echo Stopping Docker Desktop...
taskkill /F /IM "Docker Desktop.exe" /T 2>nul
timeout /t 3 /nobreak >nul

echo Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo.
echo Waiting for Docker to start (30 seconds)...
timeout /t 30 /nobreak

echo.
echo Testing Docker...
docker --version
docker ps

echo.
echo ================================
echo Docker restart complete!
echo ================================
echo.
echo Now run: docker build -t trustx-app .
echo.
