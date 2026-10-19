@echo off
title Simal KYC System - Local Server
cd /d "%~dp0"
echo ============================================================
echo  Simal KYC System - starting local server (Node)
echo ============================================================
if not exist .env (
  echo [WARN] No .env found - copy .env.example to .env first.
  pause
  exit /b 1
)
rem -- read PORT from .env so this launcher can never drift from the server config
set "PORT_NUM=3000"
for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /l /c:"PORT=" .env`) do set "PORT_NUM=%%B"
echo  Portal:     http://127.0.0.1:%PORT_NUM%/index.html
echo  Admin:      http://127.0.0.1:%PORT_NUM%/admin.html
echo.
echo  First run?  1) copy .env.example to .env and fill it in
echo              2) node tools/seed.js
echo  (Press Ctrl+C in this window to stop the server)
echo ============================================================
start "" "http://127.0.0.1:%PORT_NUM%/index.html"
node src/server.js
pause
