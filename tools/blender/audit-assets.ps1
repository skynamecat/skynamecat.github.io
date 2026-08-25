$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$sourceRoot = Join-Path $workspace "testDeepSeekHarness\testDeepSeekHarness\resource\pangbobo"
$assets = @(
    (Join-Path $workspace "frontend\public\pangbobo\pangbobo-actions-lite.glb"),
    (Join-Path $sourceRoot "pangbobo-hiphop.glb"),
    (Join-Path $sourceRoot "pangbobo.glb"),
    "C:\Users\skynamecat\Documents\ChatGPT\庞菠菠.fbx"
) | Where-Object { Test-Path -LiteralPath $_ }

if (-not $assets) { throw "No Pangbobo assets were found." }
$output = Join-Path $workspace "docs\pangbobo\asset-audit.json"
& blender --background --python (Join-Path $PSScriptRoot "audit_assets.py") -- --output $output @assets
if ($LASTEXITCODE -ne 0) { throw "Blender asset audit failed with exit code $LASTEXITCODE" }
Write-Host "Asset audit written to $output"
