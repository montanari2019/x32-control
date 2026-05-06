$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$isMacOS = $PSVersionTable.Platform -eq "Unix" -and $env:OSTYPE -notlike "*linux*"

if (-not $isMacOS) {
    Write-Host "Skipping CocoaPods installation on this OS."
    exit 0
}

Push-Location (Join-Path $projectRoot "ios")
try {
    bundle install
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    bundle exec pod install
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
