@echo off
:: Check for administrative rights
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :gotAdmin
) else (
    echo Requesting Administrator privileges...
    powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

:gotAdmin
title Dell OptiPlex 5090 - Docker Desktop & WSL2 Setup
color 0B
cls
echo ======================================================================
echo   Dell OptiPlex 5090: Docker Desktop & WSL2 Configuration Check
echo ======================================================================
echo.

echo [1/3] Checking CPU Hardware Virtualization (BIOS)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$v = (Get-CimInstance Win32_Processor).VirtualizationFirmwareEnabled; if ($v -eq $true) { Write-Host ' [OK] CPU Virtualization is ENABLED in BIOS.' -ForegroundColor Green } else { Write-Host ' [CRITICAL] CPU Virtualization is DISABLED in Dell BIOS!' -ForegroundColor Red; Write-Host '   --> You MUST restart, press F2 at the Dell logo, go to Virtualization, and turn ON Intel Virtualization Technology.' -ForegroundColor Yellow }"

echo.
echo [2/3] Enabling Windows Features (VirtualMachinePlatform & WSL)...
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

echo.
echo [3/3] Updating Windows Subsystem for Linux (WSL)...
wsl.exe --update 2>nul
if %errorLevel% neq 0 (
    echo Installing WSL kernel package...
    wsl.exe --install --no-distribution
)

echo.
echo ======================================================================
echo   CONFIGURATION FINISHED
echo ======================================================================
echo.
echo IMPORTANT: If CPU Virtualization was reported DISABLED above:
echo   1. Restart the computer now.
echo   2. When the Dell logo appears, tap F2 repeatedly to enter BIOS Setup.
echo   3. Under 'Virtualization Support', check 'Intel Virtualization Technology' to ENABLE it.
echo   4. Apply changes and exit to start Windows.
echo   5. Open Docker Desktop.
echo ======================================================================
echo.
set /p REBOOT="Would you like to restart your computer now to enter BIOS (F2)? (Y/N): "
if /i "%REBOOT%"=="Y" (
    echo Restarting Windows in 5 seconds...
    shutdown /r /t 5 /c "Restarting. Tap F2 when Dell logo appears to enter BIOS setup!"
) else (
    echo.
    echo Please remember to restart and enable Intel Virtualization (F2 in Dell BIOS).
    pause
)
