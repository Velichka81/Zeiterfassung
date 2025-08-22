param(
	[switch]$StartBackend
)
$dbPath = Join-Path $PSScriptRoot 'backend\db\zeiterfassung.db'
if(Test-Path $dbPath){
	Remove-Item $dbPath -Force
	Write-Host 'SQLite DB gelöscht.' -ForegroundColor Green
} else {
	Write-Host 'Keine vorhandene DB gefunden.' -ForegroundColor Yellow
}
if($StartBackend){
	Write-Host 'Starte Backend zum Re-Init...' -ForegroundColor Cyan
	& $PSScriptRoot\start-backend.ps1
} else {
	Write-Host 'Beim nächsten Backend-Start wird schema.sql erneut eingespielt.' -ForegroundColor Green
}
