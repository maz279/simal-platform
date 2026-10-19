@echo off
rem uninstall-autostart.cmd — remove the SimalDevRig logon task created by install-autostart.cmd.
setlocal
set "TASK=SimalDevRig"
schtasks /Query /TN "%TASK%" >nul 2>&1
if errorlevel 1 (
  echo Task "%TASK%" does not exist - nothing to remove.
  exit /b 0
)
schtasks /Delete /TN "%TASK%" /F
if errorlevel 1 exit /b 1
echo Removed "%TASK%".
endlocal
