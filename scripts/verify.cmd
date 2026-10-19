@echo off
setlocal
set TOOLS=%~dp0..\tools
set PG=%TOOLS%\pgsql\bin
echo node:      & node --version
echo npm:       & npm --version
echo git:       & git --version
echo terraform: & "%TOOLS%\terraform.exe" version | findstr /r "^Terraform"
echo k6:        & "%TOOLS%\k6-v1.5.0-windows-amd64\k6.exe" version | findstr /r "k6"
echo gitleaks:  & "%TOOLS%\gitleaks.exe" version
echo psql:      & "%PG%\psql.exe" --version
"%PG%\pg_isready.exe" -h 127.0.0.1 -p 5433 || echo [FAIL] PostgreSQL not reachable on 5433
echo s3: skipped (filesystem for dev - see guide §3)
endlocal
