param(
  [switch]$NoMigrate
)

$ErrorActionPreference = 'Stop'

# Port 8082 freigeben (falls belegt)
try {
  $pids = @()
  if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
    $pids = (Get-NetTCPConnection -LocalPort 8082 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess) | Sort-Object -Unique
  }
  if ($pids -and $pids.Count -gt 0) {
    Write-Host "Beende Prozess(e) auf Port 8082: $($pids -join ', ')" -ForegroundColor Yellow
    $pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 300
  }
} catch { }


# Immer aus dem Projekt-Hauptverzeichnis arbeiten
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

function Invoke-Maven {
  param([string[]]$MvnParams)
  if (Get-Command mvn -ErrorAction SilentlyContinue) {
  & mvn @MvnParams
    return $LASTEXITCODE
  }
  $mvnw = Join-Path (Join-Path $PSScriptRoot 'backend') 'mvnw.cmd'
  if (Test-Path $mvnw) {
  & $mvnw @MvnParams
    return $LASTEXITCODE
  }
  throw "Maven wurde nicht gefunden. Bitte mvn in PATH hinzufügen oder mvnw verwenden."
}


Write-Host "Spring Boot starten (Port 8082)..." -ForegroundColor Green
Push-Location ./backend
# Tests überspringen und sauberen Start sicherstellen
Invoke-Maven -MvnParams @('spring-boot:run','-DskipTests')
Pop-Location
