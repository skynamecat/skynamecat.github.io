$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$source = Join-Path $workspace "testDeepSeekHarness\testDeepSeekHarness\resource\pangbobo"
$output = Join-Path $workspace "frontend\public\pangbobo\pangbobo-actions-complete.glb"
& blender --background --python (Join-Path $PSScriptRoot "build_action_pack.py") -- `
  --model "C:\Users\skynamecat\Documents\ChatGPT\庞菠菠.fbx" `
  --daily (Join-Path $workspace "frontend\public\pangbobo\pangbobo-actions-lite.glb") `
  --hiphop (Join-Path $source "pangbobo-hiphop.glb") `
  --output $output
if ($LASTEXITCODE -ne 0) { throw "Action pack build failed with exit code $LASTEXITCODE" }
