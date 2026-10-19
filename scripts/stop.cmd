@echo off
set TOOLS=%~dp0..\tools
"%TOOLS%\pgsql\bin\pg_ctl.exe" -D "%TOOLS%\pgdata" stop
echo PostgreSQL stopped. (SeaweedFS: close its console window or: taskkill /im weed.exe /f)
