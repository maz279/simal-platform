@echo off
rem install-autostart.cmd — make the Simal dev rig survive reboots (P0-2 follow-up).
rem Registers a logon scheduled task that runs scripts\bringup.mjs (idempotent:
rem starts only what is down). Run once from an elevated prompt; uninstall with
rem uninstall-autostart.cmd.
setlocal
set "ROOT=%~dp0.."
set "TASK=SimalDevRig"

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: node.exe is not on PATH for this user; install Node first.
  exit /b 1
)

schtasks /Query /TN "%TASK%" >nul 2>&1
if not errorlevel 1 (
  echo Task "%TASK%" already exists - leaving it as-is.
  exit /b 0
)

schtasks /Create /TN "%TASK%" /SC ONLOGON /RL LIMITED ^
  /TR "cmd.exe /c cd /d \"%ROOT%\" && node scripts\bringup.mjs >> \"%ROOT%\scripts\autostart.log\" 2>&1" ^
  /F
if errorlevel 1 (
  echo ERROR: schtasks failed - run this script from an elevated prompt.
  exit /b 1
)

echo Registered "%TASK%" (runs bringup.mjs at every logon; it starts only what is down).
echo Verify after next logon: http://127.0.0.1:8100/ and http://localhost:8100/
endlocal
