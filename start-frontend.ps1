param(
	[switch]$NoInstall
)

$ErrorActionPreference = 'Stop'

# Port 5173 freigeben (falls belegt)
try {
	$pids = @()
	if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
		$pids = (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess) | Sort-Object -Unique
	}
	if ($pids -and $pids.Count -gt 0) {
		Write-Host "Beende Prozess(e) auf Port 5173: $($pids -join ', ')" -ForegroundColor Yellow
		$pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
		Start-Sleep -Milliseconds 300
	}
} catch { }

# Wechsle ins Frontend-Verzeichnis
Set-Location -Path (Join-Path $PSScriptRoot 'frontend')

function Test-NpmAvailability {
	if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
		throw "npm wurde nicht gefunden. Bitte Node.js installieren und npm in PATH verfügbar machen."
	}
}
Test-NpmAvailability

if (-not $NoInstall) {
	if (Test-Path package-lock.json) {
		Write-Host "Installiere Abhängigkeiten (npm ci) ..." -ForegroundColor Cyan
		npm ci
	} else {
		Write-Host "Installiere Abhängigkeiten (npm install) ..." -ForegroundColor Cyan
		npm install
	}
}

Write-Host "Starte Vite-Frontend (http://localhost:5173) ..." -ForegroundColor Green
npm run dev -- --host
