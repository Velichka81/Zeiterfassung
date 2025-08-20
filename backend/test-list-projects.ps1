param(
  [string]$User = 'admin',
  [string]$Pass = 'admin123'
)
$ErrorActionPreference = 'Stop'
$body = @{ username = $User; password = $Pass } | ConvertTo-Json -Compress
$login = Invoke-RestMethod -Uri 'http://localhost:8082/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
if(-not $login.token){ throw 'No token from login' }
$headers = @{ Authorization = 'Bearer ' + $login.token }
$projects = Invoke-RestMethod -Uri 'http://localhost:8082/api/projects' -Headers $headers
Write-Host ("COUNT=" + ($projects | Measure-Object | Select-Object -ExpandProperty Count))
$projects | ForEach-Object { Write-Host ("- {0} {1} [{2}]" -f $_.id, $_.name, $_.status) }
