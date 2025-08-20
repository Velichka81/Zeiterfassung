param(
	[int[]]$Ports = @(8082, 5173)
)

Write-Host "Suche Prozesse auf Ports: $($Ports -join ', ')" -ForegroundColor Cyan

try {
	$conns = Get-NetTCPConnection -State Listen | Where-Object { $Ports -contains $_.LocalPort }
} catch {
	Write-Warning "Get-NetTCPConnection nicht verfügbar (altes PS?). Versuche netstat-Fallback."
	$conns = @()
}

if ($conns.Count -gt 0) {
	$pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 }
	foreach ($procId in $pids) {
		try {
			$proc = Get-Process -Id $procId -ErrorAction Stop
			Write-Host ("Beende Prozess PID={0} Name={1}" -f $proc.Id, $proc.ProcessName) -ForegroundColor Yellow
			Stop-Process -Id $proc.Id -Force -ErrorAction Stop
		} catch {
			# ignore
		}
	}
} else {
	Write-Host "Keine Listener über Get-NetTCPConnection gefunden." -ForegroundColor DarkGray
}

Start-Sleep -Milliseconds 300

# Prüfen, ob Ports frei sind
$left = @()
try {
	$left = Get-NetTCPConnection -State Listen | Where-Object { $Ports -contains $_.LocalPort }
} catch {}

if ($left -and $left.Count -gt 0) {
	Write-Host "Noch belegt:" -ForegroundColor Red
	$left | Select-Object LocalAddress,LocalPort,OwningProcess | Format-Table -AutoSize | Out-String | Write-Host
} else {
	Write-Host "Alle Ziel-Ports frei." -ForegroundColor Green
}
