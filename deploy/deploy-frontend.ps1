param(
    [string]$SshTarget = "testproject-server",
    [string]$RemoteRoot = "/www/wwwroot/testProject"
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $workspaceRoot "frontend"
$archivePath = Join-Path ([System.IO.Path]::GetTempPath()) "testproject-frontend-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()).tar.gz"

Push-Location $frontendRoot
try {
    npm ci
    npm test
    tar -C out -czf $archivePath .
} finally {
    Pop-Location
}

try {
    scp $archivePath "${SshTarget}:/tmp/testproject-frontend.tar.gz"
    ssh $SshTarget "set -eu; test '$RemoteRoot' != '/'; test -d '$RemoteRoot'; tar -xzf /tmp/testproject-frontend.tar.gz -C '$RemoteRoot'; rm -f /tmp/testproject-frontend.tar.gz"
    Write-Host "Frontend deployed to ${SshTarget}:${RemoteRoot}"
} finally {
    if (Test-Path -LiteralPath $archivePath) {
        Remove-Item -LiteralPath $archivePath -Force
    }
}
