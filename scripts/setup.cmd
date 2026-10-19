@echo off
setlocal
rem ==== Simal production-build environment init (Codebase) ====
set TOOLS=%~dp0..\tools
set PG=%TOOLS%\pgsql\bin
set PGDATA=%TOOLS%\pgdata
set PGPORT=5433
if "%SIMAL_PG_PW%"=="" ( echo [ERROR] SIMAL_PG_PW not set - the simal_dev default was removed ^(credential rotated 2026-10^); set it to the current superuser password & exit /b 1 )

echo [1/4] initdb (first run only)...
if not exist "%PGDATA%" (
  echo %SIMAL_PG_PW%> "%PGDATA%\pw.txt"
  "%PG%\initdb.exe" -D "%PGDATA%" -U simal -E UTF8 --pwfile="%PGDATA%\pw.txt" >nul
  del "%PGDATA%\pw.txt"
)

echo [2/4] starting PostgreSQL on port %PGPORT%...
"%PG%\pg_ctl.exe" -D "%PGDATA%" -o "-p %PGPORT%" -l "%PGDATA%\pg.log" start

echo [3/4] create db + pg_trgm...
"%PG%\psql.exe" -h 127.0.0.1 -p %PGPORT% -U simal -d postgres -c "CREATE DATABASE simal;" 2>nul
"%PG%\psql.exe" -h 127.0.0.1 -p %PGPORT% -U simal -d simal -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

echo [4/4] skipping S3 (see guide §3 - filesystem suffices for dev; cloud bucket for prod)
echo Done. Run scripts\verify.cmd to confirm all components.
endlocal
