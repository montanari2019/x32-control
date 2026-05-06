$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $projectRoot "android"
$androidStudioJbr = "C:\Program Files\Android\Android Studio\jbr"
$sdkCandidates = @(
    $env:ANDROID_SDK_ROOT,
    $env:ANDROID_HOME,
    "C:\AndroidHome",
    "C:\Users\Montanari\AppData\Local\Android\Sdk"
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$localPropertiesPath = Join-Path $androidDir "local.properties"

if (Test-Path -LiteralPath $androidStudioJbr) {
    $env:JAVA_HOME = $androidStudioJbr
    $env:ORG_GRADLE_JAVA_HOME = $androidStudioJbr
    $env:Path = "$androidStudioJbr\bin;$env:Path"
}

if (-not $env:ANDROID_SDK_ROOT -and $sdkCandidates.Count -gt 0) {
    $env:ANDROID_SDK_ROOT = $sdkCandidates[0]
}

if ($env:ANDROID_SDK_ROOT -and -not (Test-Path -LiteralPath $localPropertiesPath)) {
    $sdkDir = $env:ANDROID_SDK_ROOT.Replace('\', '\\')
    Set-Content -LiteralPath $localPropertiesPath -Value "sdk.dir=$sdkDir"
}

try {
    & (Join-Path $androidDir "gradlew.bat") --stop | Out-Null
} catch {
    Write-Host "Gradle daemon was not running."
}

Push-Location $projectRoot
try {
    & npx react-native run-android --mode developDebug --appIdSuffix develop
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
