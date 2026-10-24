@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title RAGSentinel Launcher
where python >nul 2>nul
if errorlevel 1 (echo [ERROR] Python missing. Install Python 3.10+ and enable PATH.& pause& exit /b 1)
where node >nul 2>nul
if errorlevel 1 (echo [ERROR] Node.js missing. Install Node.js LTS.& pause& exit /b 1)
if not exist "backend\.venv\Scripts\python.exe" (
  echo [1/4] Creating backend virtual environment...
  python -m venv backend\.venv
  if errorlevel 1 (echo [ERROR] Could not create Python venv.& pause& exit /b 1)
)
echo [2/4] Installing / verifying backend dependencies...
"backend\.venv\Scripts\python.exe" -m pip install --disable-pip-version-check -r backend\requirements.txt
if errorlevel 1 (echo [ERROR] Backend dependency installation failed.& pause& exit /b 1)
"backend\.venv\Scripts\python.exe" -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8765/health',timeout=1).read()" >nul 2>nul
if not errorlevel 1 (
  echo [3/4] Backend already responds on port 8765; reusing it.
) else (
  echo [3/4] Starting backend in a separate window...
  start "RAGSentinel API" cmd /k "cd /d ""%~dp0backend"" ^&^& ""%~dp0backend\.venv\Scripts\python.exe"" -m uvicorn app:app --host 127.0.0.1 --port 8765"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; 1..30 | ForEach-Object { try { Invoke-RestMethod 'http://127.0.0.1:8765/health' -TimeoutSec 1 | Out-Null; $ok=$true; break } catch { Start-Sleep -Seconds 1 } }; if (-not $ok) { exit 1 }"
  if errorlevel 1 (echo [ERROR] Backend did not become healthy. Check the RAGSentinel API window.& pause& exit /b 1)
)
echo [4/4] Preparing desktop dependencies...
cd /d "%~dp0desktop"
if not exist node_modules\electron\dist\electron.exe (
  if exist node_modules rmdir /s /q node_modules
  if exist package-lock.json del package-lock.json
  call npm.cmd install-scripts approve electron
  call npm.cmd install
  if errorlevel 1 (echo [ERROR] Electron install failed. Check network/proxy/antivirus.& pause& exit /b 1)
)
if not exist node_modules\electron\dist\electron.exe (echo [ERROR] Electron executable missing. Check network/proxy/antivirus, then run: node .\node_modules\electron\install.js& pause& exit /b 1)
call npm.cmd start
endlocal
