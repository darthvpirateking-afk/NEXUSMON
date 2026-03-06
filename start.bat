@echo off
setlocal

set REPO=e:\NEXUSMON-main\NEXUSMON-main-backup-20260227-224154

:: Explicit paths so double-click from Explorer works
set PATH=%PATH%;C:\Users\Gaming PC\AppData\Local\Programs\Python\Python311;C:\Users\Gaming PC\AppData\Local\Programs\Python\Python311\Scripts;C:\Program Files\nodejs

echo [NEXUSMON] Starting backend...
start "NEXUSMON Backend" cmd /k "cd /d %REPO% && python nexusmon_server.py"

timeout /t 5 /nobreak >nul

echo [NEXUSMON] Starting cockpit...
start "NEXUSMON Cockpit" cmd /k "cd /d %REPO%\cockpit && node node_modules\vite\dist\node\cli.js"

timeout /t 5 /nobreak >nul

echo [NEXUSMON] Opening browser...
start "" http://localhost:5173

echo.
echo NEXUSMON is starting.
echo   Backend:  http://localhost:8000/api/health
echo   Cockpit:  http://localhost:5173
echo.
echo Check the two terminal windows for startup logs.
pause
