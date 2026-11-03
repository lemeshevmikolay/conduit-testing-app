$ErrorActionPreference = "Stop"
$composeFile = Join-Path $PSScriptRoot "docker-compose.portable.yml"
docker compose -f $composeFile up --build -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$appPort = if ($env:APP_PORT) { $env:APP_PORT } else { "8080" }
Write-Host "Conduit is running at http://localhost:$appPort"
