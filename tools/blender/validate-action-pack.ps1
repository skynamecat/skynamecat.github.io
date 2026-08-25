$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
& blender --background --python (Join-Path $PSScriptRoot "validate_action_pack.py") -- `
  --input (Join-Path $workspace "frontend\public\pangbobo\pangbobo-actions-complete.glb") `
  --output (Join-Path $workspace "docs\pangbobo\complete-pack-qa.json")
if ($LASTEXITCODE -ne 0) { throw "Action pack validation failed with exit code $LASTEXITCODE" }
