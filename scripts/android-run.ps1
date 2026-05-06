$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $projectRoot "android"
$androidStudioJbr = "C:\Program Files\Android\Android Studio\jbr"

if (Test-Path -LiteralPath $androidStudioJbr) {
    $env:JAVA_HOME = $androidStudioJbr
    $env:Path = "$androidStudioJbr\bin;$env:Path"
}

if (-not $env:ANDROID_SDK_ROOT -and $env:ANDROID_HOME) {
    $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
}

try {
    & (Join-Path $androidDir "gradlew.bat") --stop | Out-Null
} catch {
    Write-Host "Gradle daemon was not running."
}

Push-Location $projectRoot
try {
    & npx react-native run-android --appId com.x32control.busauxcontrol
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
