$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidGradleDir = Join-Path $projectRoot "android\.gradle"
$androidBuildDir = Join-Path $projectRoot "android\build"
$appBuildDir = Join-Path $projectRoot "android\app\build"
$gradleWrapper = Join-Path $projectRoot "android\gradlew.bat"

$targets = @($androidGradleDir, $androidBuildDir, $appBuildDir)

try {
    if (Test-Path -LiteralPath $gradleWrapper) {
        Push-Location (Join-Path $projectRoot "android")
        try {
            & $gradleWrapper --stop | Out-Null
        } finally {
            Pop-Location
        }
    }
} catch {
    Write-Host "Gradle daemon was not running."
}

foreach ($target in $targets) {
    if (Test-Path -LiteralPath $target) {
        Write-Host "Removing $target"
        try {
            Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction Stop
        } catch {
            Write-Warning "Could not fully remove $target. Continuing with remaining cleanup."
        }
    }
}

Write-Host ""
Write-Host "Android Gradle caches cleaned."
Write-Host "Next step: npm run android"
