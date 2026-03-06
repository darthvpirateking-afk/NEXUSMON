@echo off
echo ================================================
echo  NEXUSMON — SOVEREIGN ORGANISM v4.0
echo  http://localhost:8000/cockpit/
echo ================================================

:: Load .env into environment
if exist .env (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if not "%%a"=="" if not "%%b"=="" (
            if not "%%a"=="" set "%%a=%%b"
        )
    )
    echo [ENV] .env loaded
) else (
    echo [WARN] No .env file found. Copy .env.example to .env and add your API keys.
)

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.11+ from https://python.org
    pause
    exit /b 1
)

:: Install dependencies
echo [DEPS] Installing requirements...
pip install -r requirements.txt -q
if errorlevel 1 (
    echo [WARN] Some dependencies may have failed. Continuing...
)

:: Start server
echo [START] Launching NEXUSMON on http://localhost:8000
echo [START] Cockpit at http://localhost:8000/cockpit/
echo.
uvicorn nexusmon_server:app --host 0.0.0.0 --port 8000 --reload
