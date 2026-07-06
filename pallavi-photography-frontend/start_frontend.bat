@echo off
title Pallavi Photography - Frontend
echo ===============================================
echo  Pallavi Photography - Frontend (Next.js)
echo ===============================================
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo [1/2] Installing npm packages...
    call npm install
) else (
    echo [1/2] node_modules found, skipping install.
)

echo [2/2] Starting Next.js dev server on http://localhost:3000
echo       Press CTRL+C to stop.
echo.
call npm run dev

pause
