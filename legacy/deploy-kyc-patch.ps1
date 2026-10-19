<#
.SYNOPSIS
  deploy-kyc-patch.ps1 — Deploy KYC Login & Portal Patch to 182.160.112.72

.DESCRIPTION
  Transfers simal-kyc-login-patch.zip and deploy-kyc-patch.sh to the production
  server (182.160.112.72) via SCP and triggers extraction + service restart via SSH.

.EXAMPLE
  .\deploy-kyc-patch.ps1 -User root -KeyPath ~\.ssh\id_rsa
#>
param(
  [string]$Server = "182.160.112.72",
  [string]$User = "root",
  [string]$KeyPath = "",
  [string]$RemoteDir = "/tmp/kyc-patch"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$zipPath = Join-Path $scriptDir "simal-kyc-login-patch.zip"
$shPath = Join-Path $scriptDir "deploy-kyc-patch.sh"

if (!(Test-Path $zipPath)) {
  Write-Error "Could not find $zipPath"
}
if (!(Test-Path $shPath)) {
  Write-Error "Could not find $shPath"
}

$sshOpts = @("-o", "StrictHostKeyChecking=no")
if ($KeyPath -and (Test-Path $KeyPath)) {
  $sshOpts += @("-i", $KeyPath)
}

Write-Host "==> [1/3] Uploading patch bundle to $User@$Server:$RemoteDir..." -ForegroundColor Cyan
& ssh @sshOpts "$User@$Server" "mkdir -p $RemoteDir"
& scp @sshOpts $zipPath "$User@$Server`:$RemoteDir/simal-kyc-login-patch.zip"
& scp @sshOpts $shPath "$User@$Server`:$RemoteDir/deploy-kyc-patch.sh"

Write-Host "==> [2/3] Executing deployment on $Server..." -ForegroundColor Cyan
& ssh @sshOpts "$User@$Server" "chmod +x $RemoteDir/deploy-kyc-patch.sh && cd $RemoteDir && ./deploy-kyc-patch.sh"

Write-Host "==> [3/3] Verifying live HTTPS endpoint..." -ForegroundColor Cyan
try {
  $resp = Invoke-WebRequest -Uri "https://kyc.simalme.com/login.html" -SkipCertificateCheck -UseBasicParsing -TimeoutSec 10
  Write-Host "Live Status: $($resp.StatusCode) OK" -ForegroundColor Green
  Write-Host "Successfully deployed https://kyc.simalme.com/login.html!" -ForegroundColor Green
} catch {
  Write-Warning "Direct HTTP check: $($_.Exception.Message)"
}
