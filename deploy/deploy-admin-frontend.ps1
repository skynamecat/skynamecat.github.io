param(
    [string]$SshTarget = "testproject-server",
    [string]$RemoteRoot = "/www/wwwroot/testProject/manage-app"
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$adminRoot = Join-Path $workspaceRoot "admin-frontend"
$archivePath = Join-Path ([System.IO.Path]::GetTempPath()) "testproject-admin-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()).tar.gz"

Push-Location $adminRoot
try {
    npm ci
    npm run build
    tar -C dist -czf $archivePath .
} finally {
    Pop-Location
}

try {
    scp $archivePath "${SshTarget}:/tmp/testproject-admin.tar.gz"
    ssh $SshTarget "set -eu; test '$RemoteRoot' != '/'; mkdir -p '$RemoteRoot'; find '$RemoteRoot' -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +; tar -xzf /tmp/testproject-admin.tar.gz -C '$RemoteRoot'; rm -f /tmp/testproject-admin.tar.gz"
    Write-Host "Admin frontend deployed to ${SshTarget}:${RemoteRoot}"
} finally {
    if (Test-Path -LiteralPath $archivePath) {
        Remove-Item -LiteralPath $archivePath -Force
    }
}
