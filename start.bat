@echo off
setlocal

set REPO=e:\NEXUSMON-main\NEXUSMON-main-backup-20260227-224154

:: Explicit paths so double-click from Explorer works
set PATH=%PATH%;C:\Users\Gaming PC\AppData\Local\Programs\Python\Python311;C:\Users\Gaming PC\AppData\Local\Programs\Python\Python311\Scripts;C:\Program Files\nodejs

:: ── Cockpit bootstrap ───────────────────────────────────────
echo [NEXUSMON] Checking cockpit dependencies...
if not exist "%REPO%\cockpit\node_modules" (
    echo [NEXUSMON] node_modules missing — running npm install...
    pushd "%REPO%\cockpit"
    call npm install
    popd
)

if not exist "%REPO%\cockpit\dist\index.html" (
    echo [NEXUSMON] dist missing — running npm run build...
    pushd "%REPO%\cockpit"
    call npm run build
    popd
)

:: ── Backend ─────────────────────────────────────────────────
echo [NEXUSMON] Starting backend...
start "NEXUSMON Backend" cmd /k "cd /d %REPO% && python nexusmon_server.py"

timeout /t 6 /nobreak >nul

:: ── Cockpit dev server ───────────────────────────────────────
echo [NEXUSMON] Starting cockpit dev server...
start "NEXUSMON Cockpit" cmd /k "cd /d %REPO%\cockpit && npx vite"

timeout /t 5 /nobreak >nul

:: ── Browser ──────────────────────────────────────────────────
echo [NEXUSMON] Opening browser...
start "" http://localhost:5173

echo.
echo NEXUSMON is starting.
echo   Backend:   http://localhost:8000/api/health
echo   Cockpit:   http://localhost:5173        (dev server — live reload)
echo   Cockpit:   http://localhost:8000/cockpit (static build — production)
echo.
echo Check the two terminal windows for startup logs.
pause
