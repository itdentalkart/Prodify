#Requires -RunAsAdministrator
<#
.SYNOPSIS
    DK Productivity Agent Installer — Local Server Version
.DESCRIPTION
    Installs and enrolls the DK Agent pointing to your local Ubuntu server.
.PARAMETER ServerUrl
    Your Ubuntu server URL, e.g. http://192.168.1.100:3000
.PARAMETER EnrollToken
    One-time enrollment token generated from the dashboard.
.EXAMPLE
    .\install.ps1 -ServerUrl "http://192.168.1.100:3000" -EnrollToken "abc123def456..."
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerUrl,

    [Parameter(Mandatory=$true)]
    [string]$EnrollToken,

    [string]$InstallPath = "$env:ProgramFiles\DKAgent",
    [string]$ServiceName = "DKAgent"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================"   -ForegroundColor Cyan
Write-Host "  DK Productivity Agent Installer"         -ForegroundColor Cyan
Write-Host "  Target: $ServerUrl"                      -ForegroundColor Yellow
Write-Host "========================================"   -ForegroundColor Cyan

# ── Stop and remove old service if exists ─────────────────────────────────────
$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($svc) {
    Write-Host "Removing old service..." -ForegroundColor Yellow
    Stop-Service $ServiceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $ServiceName | Out-Null
    Start-Sleep 2
}

# ── Create install directory ──────────────────────────────────────────────────
Write-Host "Creating install directory: $InstallPath" -ForegroundColor Green
New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null

# ── Copy agent files ───────────────────────────────────────────────────────────
Write-Host "Copying agent files..." -ForegroundColor Green
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item "$src\*" -Destination $InstallPath -Recurse -Force -Exclude "install.ps1","*.ps1"

# ── Create config.json ────────────────────────────────────────────────────────
Write-Host "Writing config.json..." -ForegroundColor Green
$configDir = "$env:ProgramData\DKAgent"
New-Item -ItemType Directory -Path $configDir -Force | Out-Null

$config = @{
    ServerUrl            = $ServerUrl
    DeviceId             = ""
    AgentToken           = ""
    AgentVersion         = "1.0.0"
    ScreenshotIntervalSec = 300
    HeartbeatIntervalSec  = 60
    IdleThresholdSec      = 300
    WorkingHours          = "09:00-18:00"
    EnrollToken           = $EnrollToken
} | ConvertTo-Json -Depth 3

$config | Out-File -FilePath "$configDir\config.json" -Encoding utf8
Write-Host "Config saved to: $configDir\config.json" -ForegroundColor Green

# ── Test server connectivity ───────────────────────────────────────────────────
Write-Host "Testing server connectivity..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$ServerUrl/health" -Method Get -TimeoutSec 10
    Write-Host "Server reachable! Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Cannot reach server at $ServerUrl" -ForegroundColor Red
    Write-Host "         Make sure the server is running and firewall allows port 3000" -ForegroundColor Red
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') { exit 1 }
}

# ── Install Windows Service ───────────────────────────────────────────────────
Write-Host "Installing Windows Service..." -ForegroundColor Green
$exePath = "$InstallPath\DKAgent.exe"

if (-not (Test-Path $exePath)) {
    Write-Host "ERROR: DKAgent.exe not found at $exePath" -ForegroundColor Red
    Write-Host "       Build the project first: dotnet publish -c Release -r win-x64 --self-contained" -ForegroundColor Yellow
    exit 1
}

New-Service -Name $ServiceName `
            -BinaryPathName $exePath `
            -DisplayName "DK Productivity Agent" `
            -Description "DK Productivity monitoring agent" `
            -StartupType Automatic

# ── Start service ──────────────────────────────────────────────────────────────
Write-Host "Starting service..." -ForegroundColor Green
Start-Service -Name $ServiceName
Start-Sleep 3

$svcStatus = Get-Service -Name $ServiceName
Write-Host ""
Write-Host "========================================"   -ForegroundColor Cyan
Write-Host "  Service Status: $($svcStatus.Status)"    -ForegroundColor $(if ($svcStatus.Status -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "========================================"   -ForegroundColor Cyan

if ($svcStatus.Status -eq 'Running') {
    Write-Host ""
    Write-Host "✅ DK Agent installed successfully!" -ForegroundColor Green
    Write-Host "   Server:  $ServerUrl"              -ForegroundColor White
    Write-Host "   Config:  $configDir\config.json"  -ForegroundColor White
    Write-Host "   Logs:    Windows Event Viewer > Application > Source: DK Agent" -ForegroundColor White
    Write-Host ""
    Write-Host "The agent will enroll automatically on first start."  -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Service failed to start!" -ForegroundColor Red
    Write-Host "   Check: Windows Event Viewer > Application log" -ForegroundColor Yellow
    Write-Host "   OR run manually for debug: $exePath --console"  -ForegroundColor Yellow
}
