# Setup script for WSL2 and Virtual Machine Platform for Docker Desktop
$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Dell OptiPlex 5090 - Docker Desktop & WSL2 Auto-Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Enabling Windows Optional Features..." -ForegroundColor Yellow
Write-Host "  - Feature: VirtualMachinePlatform" -ForegroundColor Gray
Write-Host "  - Feature: Microsoft-Windows-Subsystem-Linux" -ForegroundColor Gray

$dismResult = dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
Write-Host $dismResult

Write-Host ""
Write-Host "[2/3] Installing and Updating WSL Linux Kernel..." -ForegroundColor Yellow
wsl.exe --update
if ($LASTEXITCODE -ne 0) {
    wsl.exe --install --no-distribution
}

Write-Host ""
Write-Host "[3/3] Checking CPU Virtualization Status..." -ForegroundColor Yellow
$proc = Get-CimInstance Win32_Processor
if ($proc.VirtualizationFirmwareEnabled -eq $true) {
    Write-Host "  [OK] CPU Virtualization is ENABLED in BIOS!" -ForegroundColor Green
} else {
    Write-Host "  [ATTENTION] CPU Virtualization is currently DISABLED in Dell BIOS." -ForegroundColor Magenta
    Write-Host "  -> Don't worry! All Windows components are now installed." -ForegroundColor Yellow
    Write-Host "  -> To finish, simply restart the PC, tap F2 at the Dell logo," -ForegroundColor Yellow
    Write-Host "     and turn ON 'Intel Virtualization Technology'." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Setup completed successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
