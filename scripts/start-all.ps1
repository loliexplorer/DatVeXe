# =====================================================================
#  EcoBus - Start everything (MySQL + 9 backend services + website)
#  Usage: double-click start-all.bat in the project folder
#         or:  powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1 [-NoBrowser]
#  Safe to run again: anything already running is skipped.
# =====================================================================
param(
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$Root       = Split-Path -Parent $PSScriptRoot
$LogDir     = Join-Path $Root 'logs'
$DbPassword = ''   # MySQL root password (Laragon default is empty)
$SharedJwt  = 'EcoBusSuperSecretKey2026ServiceOrientedArch!@#'

$Services = @(
  @{ Name = 'user-service';         Port = 5001 },
  @{ Name = 'trip-service';         Port = 5002 },
  @{ Name = 'booking-service';      Port = 5003 },
  @{ Name = 'payment-service';      Port = 5004 },
  @{ Name = 'notification-service'; Port = 5005 },
  @{ Name = 'voucher-service';      Port = 5006 },
  @{ Name = 'dispatch-service';     Port = 5007 },
  @{ Name = 'analytic-service';     Port = 5008 },
  @{ Name = 'api-gateway';          Port = 8000 }
)

New-Item -ItemType Directory -Force $LogDir | Out-Null

function Write-Step($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Write-Ok($text)   { Write-Host "  [OK]   $text" -ForegroundColor Green }
function Write-Skip($text) { Write-Host "  [SKIP] $text" -ForegroundColor DarkGray }
function Write-Warn($text) { Write-Host "  [WARN] $text" -ForegroundColor Yellow }
function Write-Fail($text) { Write-Host "  [FAIL] $text" -ForegroundColor Red }

# True if something is listening on the port (checks IPv4 and IPv6 localhost)
function Test-Port([int]$Port) {
  foreach ($addr in '127.0.0.1', '::1') {
    $client = New-Object System.Net.Sockets.TcpClient($(if ($addr -eq '::1') { 'InterNetworkV6' } else { 'InterNetwork' }))
    try {
      $wait = $client.BeginConnect($addr, $Port, $null, $null)
      if ($wait.AsyncWaitHandle.WaitOne(300) -and $client.Connected) { return $true }
    } catch { } finally { $client.Close() }
  }
  return $false
}

function Wait-Port([int]$Port, [int]$Seconds) {
  for ($i = 0; $i -lt ($Seconds * 2); $i++) {
    if (Test-Port $Port) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

# ---------------------------------------------------------------------
# 1. MySQL
# ---------------------------------------------------------------------
Write-Step '1/4  MySQL database server'

$laragonMysql = @('C:\laragon', 'D:\laragon', 'E:\laragon') | ForEach-Object {
  Get-ChildItem "$_\bin\mysql\*\bin\mysqld.exe" -ErrorAction SilentlyContinue
} | Sort-Object FullName -Descending | Select-Object -First 1
$mysqlClient = $null
if ($laragonMysql) {
  $mysqlClient = Join-Path $laragonMysql.DirectoryName 'mysql.exe'
} else {
  $mysqlClient = Get-ChildItem 'C:\Program Files\MySQL\MySQL Server *\bin\mysql.exe' -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}

if (Test-Port 3306) {
  Write-Skip 'MySQL is already running on port 3306'
} elseif ($laragonMysql) {
  $mysqlHome = Split-Path -Parent $laragonMysql.DirectoryName
  $myIni     = Join-Path $mysqlHome 'my.ini'
  Start-Process -FilePath $laragonMysql.FullName `
    -ArgumentList "--defaults-file=`"$myIni`"" `
    -WorkingDirectory $mysqlHome -WindowStyle Hidden `
    -RedirectStandardError (Join-Path $LogDir 'mysql.err.log') | Out-Null
  if (Wait-Port 3306 30) { Write-Ok "MySQL started (Laragon: $mysqlHome)" }
  else { Write-Fail "MySQL did not start. See logs\mysql.err.log"; exit 1 }
} else {
  try {
    Start-Service MySQL80 -ErrorAction Stop
    if (Wait-Port 3306 30) { Write-Ok 'MySQL80 service started' } else { throw 'port 3306 not open' }
  } catch {
    Write-Fail 'Could not start MySQL. Install Laragon, or run this script as Administrator to start the MySQL80 service.'
    exit 1
  }
}

# ---------------------------------------------------------------------
# 2. Databases (only created if missing - existing data is never touched)
# ---------------------------------------------------------------------
Write-Step '2/4  Project databases'

if (-not $mysqlClient -or -not (Test-Path $mysqlClient)) {
  Write-Warn 'mysql.exe client not found - cannot check databases, skipping.'
} else {
  $mysqlArgs = @('--user=root', '--host=127.0.0.1', '--protocol=TCP', '--default-character-set=utf8mb4')
  if ($DbPassword) { $mysqlArgs += "--password=$DbPassword" }

  # Send UTF-8 to mysql.exe so Vietnamese seed data is stored correctly
  $OutputEncoding = New-Object System.Text.UTF8Encoding($false)

  $existing = & $mysqlClient @mysqlArgs '--batch' '--skip-column-names' '--execute=SHOW DATABASES;' 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Fail 'Could not log in to MySQL as root. Set $DbPassword at the top of scripts\start-all.ps1.'
    exit 1
  }

  Get-ChildItem (Join-Path $Root 'database') -Filter '0*.sql' | Sort-Object Name | ForEach-Object {
    $dbName = $_.BaseName -replace '^\d+_', ''
    if ($existing -contains $dbName) {
      Write-Skip "$dbName already exists"
    } else {
      $sqlSourcePath = $_.FullName -replace '\\', '/'
      & $mysqlClient @mysqlArgs "--execute=source $sqlSourcePath"
      if ($LASTEXITCODE -eq 0) { Write-Ok "$dbName created from $($_.Name)" }
      else { Write-Fail "$dbName - import of $($_.Name) failed" }
    }
  }
}

# ---------------------------------------------------------------------
# 3. Backend services
# ---------------------------------------------------------------------
Write-Step '3/4  Backend services'

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
$npm  = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $node -or -not $npm) { Write-Fail 'Node.js is not installed (https://nodejs.org).'; exit 1 }

foreach ($svc in $Services) {
  $dir = Join-Path $Root "services\$($svc.Name)"

  if (Test-Port $svc.Port) { Write-Skip "$($svc.Name) already running on port $($svc.Port)"; continue }

  # .env from .env.example (with the shared JWT secret)
  $envFile = Join-Path $dir '.env'
  if (-not (Test-Path $envFile)) {
    (Get-Content (Join-Path $dir '.env.example')) `
      -replace '^JWT_SECRET=your_jwt_secret_key_here$', "JWT_SECRET=$SharedJwt" `
      -replace '^DB_PASSWORD=$', "DB_PASSWORD=$DbPassword" |
      Set-Content -Encoding ASCII $envFile
    Write-Host "         created $($svc.Name)\.env"
  }

  # Dependencies (first run only)
  if (-not (Test-Path (Join-Path $dir 'node_modules'))) {
    Write-Host "         installing packages for $($svc.Name) (first run, please wait)..."
    Push-Location $dir
    & $npm install --no-audit --no-fund --loglevel=error | Out-Null
    Pop-Location
  }

  Start-Process -FilePath $node -ArgumentList 'src/server.js' -WorkingDirectory $dir -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogDir "$($svc.Name).log") `
    -RedirectStandardError  (Join-Path $LogDir "$($svc.Name).err.log") | Out-Null

  if (Wait-Port $svc.Port 20) { Write-Ok "$($svc.Name) on http://localhost:$($svc.Port)" }
  else { Write-Fail "$($svc.Name) did not start. See logs\$($svc.Name).err.log" }
}

# ---------------------------------------------------------------------
# 4. Website (Vite dev server)
# ---------------------------------------------------------------------
Write-Step '4/4  Website (client-web)'

$web = Join-Path $Root 'client-web'
if (Test-Port 5173) {
  Write-Skip 'Website already running on port 5173'
} else {
  if (-not (Test-Path (Join-Path $web 'node_modules'))) {
    Write-Host '         installing website packages (first run, please wait)...'
    Push-Location $web
    & $npm install --no-audit --no-fund --loglevel=error | Out-Null
    Pop-Location
  }
  Start-Process -FilePath $node -ArgumentList 'node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort' `
    -WorkingDirectory $web -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogDir 'client-web.log') `
    -RedirectStandardError  (Join-Path $LogDir 'client-web.err.log') | Out-Null
  if (Wait-Port 5173 30) { Write-Ok 'Website on http://localhost:5173' }
  else { Write-Fail 'Website did not start. See logs\client-web.err.log' }
}

# ---------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------
Write-Step 'Health check'
try {
  $health = Invoke-RestMethod -Uri 'http://localhost:8000/health/all' -TimeoutSec 10
  foreach ($s in $health.services) {
    if ($s.status -eq 'UP') { Write-Ok "$($s.name)" } else { Write-Fail "$($s.name) is DOWN" }
  }
  Write-Host "`n  $($health.summary)" -ForegroundColor White
} catch {
  Write-Warn 'API gateway health check failed.'
}

Write-Host ''
Write-Host '  Website : http://localhost:5173'           -ForegroundColor White
Write-Host '  Driver  : http://localhost:5173/driver.html' -ForegroundColor White
Write-Host '  Gateway : http://localhost:8000'           -ForegroundColor White
Write-Host '  Logs    : logs\ folder'                    -ForegroundColor White
Write-Host '  Test login: driver1@vexere.com / Password123@'
Write-Host '  To stop everything: double-click stop-all.bat'

if (-not $NoBrowser) { Start-Process 'http://localhost:5173' }
