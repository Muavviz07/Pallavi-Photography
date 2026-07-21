@echo off
title Pallavi Photography - Backend
echo ===============================================
echo  Pallavi Photography - Backend Server
echo ===============================================
echo.

cd /d "%~dp0"

echo [1/2] Activating virtual environment...
call venv\Scripts\activate.bat

echo [2/2] Starting FastAPI server on http://127.0.0.1:8000
echo       Press CTRL+C to stop.
echo.
python main.py

pause
