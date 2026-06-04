# Atualiza vendor/agent-skills (addyosmani/agent-skills)
$root = Split-Path $PSScriptRoot -Parent
$vendor = Join-Path $root "vendor\agent-skills"
if (-not (Test-Path $vendor)) {
  Write-Host "Clonando agent-skills..."
  New-Item -ItemType Directory -Force -Path (Join-Path $root "vendor") | Out-Null
  git clone --depth 1 https://github.com/addyosmani/agent-skills.git $vendor
} else {
  git -C $vendor pull
}
Write-Host "OK: $vendor"
