# =====================================================================
#  EcoBus - Stop everything started by start-all
#  Usage: double-click stop-all.bat
#         or:  powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1 [-KeepMySQL]
# =====================================================================
param(
  [switch]$KeepMySQL
)

$DbPassword = ''   # keep in sync with scripts\start-all.ps1

$Ports = [ordered]@{
  5173 = 'client-web'
  8000 = 'api-gateway'
  5001 = 'user-service'
  5002 = 'trip-service'
  5003 = 'booking-service'
  5004 = 'payment-service'
  5005 = 'notification-service'
  5006 = 'voucher-service'
  5007 = 'dispatch-service'
  5008 = 'analytic-service'
}

Write-Host "`n=== Stopping EcoBus ===" -ForegroundColor Cyan

foreach ($port in $Ports.Keys) {
  $name  = $Ports[$port]
  $owner = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  if (-not $owner) { Write-Host "  [SKIP] $name not running" -ForegroundColor DarkGray; continue }

  foreach ($procId in $owner) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq 'node') {
      Stop-Process -Id $procId -Force
      Write-Host "  [OK]   stopped $name (port $port)" -ForegroundColor Green
    } elseif ($proc) {
      Write-Host "  [WARN] port $port is used by '$($proc.ProcessName)', not by EcoBus - left alone" -ForegroundColor Yellow
    }
  }
}

if (-not $KeepMySQL) {
  $mysqld = Get-Process mysqld -ErrorAction SilentlyContinue | Where-Object { $_.Path -like 'C:\laragon\*' }
  if ($mysqld) {
    $admin = Join-Path (Split-Path -Parent $mysqld[0].Path) 'mysqladmin.exe'
    $adminArgs = @('--user=root', '--host=127.0.0.1', '--protocol=TCP')
    if ($DbPassword) { $adminArgs += "--password=$DbPassword" }
    & $admin @adminArgs shutdown 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host '  [OK]   stopped MySQL (Laragon)' -ForegroundColor Green }
    else { Write-Host '  [WARN] could not shut down MySQL cleanly' -ForegroundColor Yellow }
  } else {
    Write-Host '  [SKIP] Laragon MySQL not running' -ForegroundColor DarkGray
  }
}

Write-Host "`nDone.`n"
