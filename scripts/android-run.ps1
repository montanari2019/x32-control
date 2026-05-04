$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $projectRoot "android"
$tempRoot = Join-Path $env:TEMP "x32-control-gradle"
$projectCacheDir = Join-Path $tempRoot "project-cache"
$androidStudioJbr = "C:\Program Files\Android\Android Studio\jbr"

if (Test-Path -LiteralPath $androidStudioJbr) {
    $env:JAVA_HOME = $androidStudioJbr
    $env:Path = "$androidStudioJbr\bin;$env:Path"
}

if (-not $env:ANDROID_SDK_ROOT -and $env:ANDROID_HOME) {
    $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
}

if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $projectCacheDir -Force | Out-Null

$env:GRADLE_OPTS = "-Dorg.gradle.projectcachedir=$projectCacheDir -Dorg.gradle.daemon=false"

try {
    & (Join-Path $androidDir "gradlew.bat") --stop | Out-Null
} catch {
    Write-Host "Gradle daemon was not running."
}

Push-Location $projectRoot
try {
    & npx react-native run-android
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
