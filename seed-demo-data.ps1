<#
Seeds demo data via the running backend API on http://localhost:8082.
Usage (PowerShell):
	.\seed-demo-data.ps1 -AdminUser admin -AdminPass admin123
#>
param(
	[string]$BaseUrl = "http://localhost:8082",
	[string]$AdminUser = "admin",
	[string]$AdminPass = "admin123"
)

Write-Host "Seeding demo data to $BaseUrl ..."

function Invoke-JsonPost($Url, $Body, $Token) {
	$headers = @{}
	if ($Token) { $headers["Authorization"] = "Bearer $Token" }
	return Invoke-RestMethod -Method Post -Uri $Url -ContentType 'application/json' -Headers $headers -Body ($Body | ConvertTo-Json -Depth 6)
}
function Invoke-JsonGet($Url, $Token) {
	$headers = @{}
	if ($Token) { $headers["Authorization"] = "Bearer $Token" }
	return Invoke-RestMethod -Method Get -Uri $Url -Headers $headers
}

# Login as admin
$login = Invoke-JsonPost "$BaseUrl/api/auth/login" @{ username = $AdminUser; password = $AdminPass } $null
$token = $login.token
if (-not $token) { throw "Login failed" }
Write-Host "Login okay (user=$($login.username))"

# Create a demo user if not exists
$users = Invoke-JsonGet "$BaseUrl/api/admin/users" $token
if (-not ($users | Where-Object { $_.username -eq 'veli' })) {
	$null = Invoke-JsonPost "$BaseUrl/api/admin/users" @{ username = 'veli'; password = 'test'; role = 'USER' } $token
	Write-Host "User 'veli' created (password 'test')"
} else {
	Write-Host "User 'veli' exists"
}

# Create a demo project if not exists
$projects = Invoke-JsonGet "$BaseUrl/api/projects" $token
if (-not ($projects | Where-Object { $_.name -eq 'Demo Projekt' })) {
	$proj = Invoke-JsonPost "$BaseUrl/api/projects" @{ name='Demo Projekt'; description='Beispiel'; customer='Acme'; budgetMinutes=480; status='aktiv' } $token
	Write-Host "Project created: $($proj.id) $($proj.name)"
} else {
	$proj = ($projects | Where-Object { $_.name -eq 'Demo Projekt' } | Select-Object -First 1)
	Write-Host "Project exists: $($proj.id) $($proj.name)"
}

# Start and stop a demo work session for admin
$ws = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/worksessions/start?projectId=$($proj.id)" -Headers @{ Authorization = "Bearer $token" }
Start-Sleep -Seconds 2
$null = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/worksessions/pause/$($ws.id)?pause=$true&seconds=30" -Headers @{ Authorization = "Bearer $token" }
Start-Sleep -Seconds 1
$null = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/worksessions/stop/$($ws.id)" -Headers @{ Authorization = "Bearer $token" }
Write-Host "Demo work session created: $($ws.id)"

Write-Host "Done."
