@echo off
rem ==== supervisor.cmd - starts (or restarts) all dev servers ====
rem Usage: scripts\supervisor.cmd   (run from Codebase folder or add to PATH)

for %%i in ("%~dp0..\..") do set ROOT=%%~fi
set PORTAL=%ROOT%\Codebase\apps\portal
set PATH=%ROOT%\Codebase\tools\node;%PATH%

echo [supervisor] checking services...

rem --- PostgreSQL on 5433 ---
"%ROOT%\Codebase\tools\pgsql\bin\pg_isready.exe" -h 127.0.0.1 -p 5433 >nul 2>&1
if errorlevel 1 (
  echo [supervisor] PG down - starting...
  "%ROOT%\Codebase\tools\pgsql\bin\pg_ctl.exe" -D "%ROOT%\Codebase\tools\pgdata" -o "-p 5433" -l "%ROOT%\Codebase\tools\pgdata\pg.log" start
) else (
  echo [supervisor] PG OK on 5433
)

rem --- Portal on 8090 ---
curl -s -m 2 http://127.0.0.1:8090/api/health >nul 2>&1
if errorlevel 1 (
  echo [supervisor] portal down - starting...
  rem kill zombie if any
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8090.*LISTENING"') do taskkill /PID %%a /F >nul 2>&1
  cd /d "%PORTAL%"
  start /b node src\server.js > server.log 2>&1
  %SystemRoot%\System32\timeout.exe /t 2 /nobreak >nul
  curl -s -m 2 http://127.0.0.1:8090/api/health >nul 2>&1
  if errorlevel 1 (echo [supervisor] portal FAILED to start) else (echo [supervisor] portal OK on 8090)
) else (
  echo [supervisor] portal OK on 8090
)

rem --- Prototype on 8000 (unify 2026-10-19: served by legacy\serve_prototype.py from prototype\) ---
curl -s -m 2 -o nul -w "%%{http_code}" http://127.0.0.1:8000/index.html | findstr "200" >nul
if errorlevel 1 (
  echo [supervisor] prototype down - starting...
  cd /d "%ROOT%\Codebase\legacy"
  start /b python serve_prototype.py > "%ROOT%\prototype-server.log" 2>&1
  %SystemRoot%\System32\timeout.exe /t 2 /nobreak >nul
  curl -s -m 2 -o nul -w "%%{http_code}" http://127.0.0.1:8000/index.html | findstr "200" >nul
  if errorlevel 1 (echo [supervisor] prototype FAILED) else (echo [supervisor] prototype OK on 8000)
) else (
  echo [supervisor] prototype OK on 8000
)

echo [supervisor] done.
