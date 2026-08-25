$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$assets = @(
    (Join-Path $workspace "frontend\public\pangbobo\pangbobo-actions-lite.glb"),
    (Join-Path $workspace "frontend\public\pangbobo\pangbobo-hiphop.glb"),
    (Join-Path $workspace "frontend\public\pangbobo\pangbobo-actions-complete.glb"),
    "C:\Users\skynamecat\Documents\ChatGPT\庞菠菠.fbx"
) | Where-Object { Test-Path -LiteralPath $_ }

if (-not $assets) { throw "No Pangbobo assets were found." }
$output = Join-Path $workspace "docs\pangbobo\asset-audit.json"
& blender --background --python (Join-Path $PSScriptRoot "audit_assets.py") -- --output $output @assets
if ($LASTEXITCODE -ne 0) { throw "Blender asset audit failed with exit code $LASTEXITCODE" }
Write-Host "Asset audit written to $output"
