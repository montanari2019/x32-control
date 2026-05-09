---
title: Android Build – AAB e APK
type: skill
version: 1.0
scope: android
tags: [android, gradle, keystore, signing, aab, apk, build-types, flavors, firebase]
---

## Summary

Configura o ambiente Android de um projeto React Native (com ou sem Expo) para gerar artefatos de distribuição (`.aab` para Google Play e `.apk` para homologação/sideload). Cobre: versões de SDK, configuração de assinatura com keystores, build types, scripts de conveniência e propriedades de performance do Gradle.

---

## Arquivos Envolvidos

| Arquivo | Papel |
|---|---|
| `android/build.gradle` | Versões globais de SDK e plugins do projeto |
| `android/app/build.gradle` | Config de namespace, signing, build types, dependências |
| `android/gradle.properties` | Flags de arquitetura, Hermes, New Arch, JVM args |
| `android/settings.gradle` | Nome do projeto, inclusão de módulos e plugins |
| `android/gradle/wrapper/gradle-wrapper.properties` | Versão do Gradle |
| `android/local.properties` | Caminho local do Android SDK (não versionado) |
| `android/app/debug.keystore` | Keystore de debug (pode ser versionado) |
| `android/app/release.keystore` | Keystore de release (NÃO versionar – usar variáveis de CI) |
| `android/app/proguard-rules.pro` | Regras customizadas do ProGuard/R8 |
| `android/app/src/main/AndroidManifest.xml` | Permissões, deep links, metadados |
| `android/assembleHomologRelease.sh` | Script para gerar APK de homologação |
| `android/bundleRelease.sh` | Script para gerar AAB de produção |

---

## Core Pattern

### 1. `android/build.gradle` — Versões Globais

Define as versões de SDK e plugins como extensões reutilizáveis por todos os módulos.

```groovy
buildscript {
    ext {
        buildToolsVersion = "36.0.0"
        minSdkVersion    = 24          // mínimo recomendado para React Native moderno
        compileSdkVersion = 36
        targetSdkVersion = 36
        ndkVersion       = "27.1.12297006"
        kotlinVersion    = "2.1.20"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")

        // Firebase (remova se não usar)
        classpath 'com.google.gms:google-services:4.4.3'
        classpath 'com.google.firebase:firebase-crashlytics-gradle:3.0.6'
    }
}

apply plugin: "com.facebook.react.rootproject"
// Se usar Expo:
apply plugin: "expo-root-project"
```

> Versões de `buildToolsVersion`, `compileSdkVersion` e `targetSdkVersion` devem ser mantidas em sincronia. Consulte sempre o [Android API levels](https://apilevels.com) para saber o nível estável atual.

---

### 2. `android/settings.gradle` — Nome e Módulos

```groovy
pluginManagement {
    includeBuild("../node_modules/@react-native/gradle-plugin")
    // Bloco Expo – remova se não usar Expo
    def expoPluginsPath = new File(
        providers.exec {
            workingDir(rootDir)
            commandLine("node", "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })")
        }.standardOutput.asText.get().trim(),
        "../android/expo-gradle-plugin"
    ).absolutePath
    includeBuild(expoPluginsPath)
}
plugins {
    id("com.facebook.react.settings")
    // Se usar Expo:
    id("expo-autolinking-settings")
}

extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->
    ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)
}

rootProject.name = 'SeuAppName'   // ← alterar
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')

// Se usar Expo:
expoAutolinking.useExpoModules()
expoAutolinking.useExpoVersionCatalog()
includeBuild(expoAutolinking.reactNativeGradlePlugin)
```

---

### 3. `android/app/build.gradle` — Configuração Principal

#### 3.1 Plugins

```groovy
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

// Firebase (remova se não usar)
apply plugin: 'com.google.gms.google-services'
apply plugin: 'com.google.firebase.crashlytics'
```

#### 3.2 Bloco `react {}`

```groovy
react {
    autolinkLibrariesWithApp()
    // Descomente e ajuste conforme necessário:
    // debuggableVariants = ["liteDebug", "prodDebug"]
    // entryFile = file("../index.js")
}
```

#### 3.3 Flags de Proguard

```groovy
def enableProguardInReleaseBuilds = false  // true para minificação agressiva
```

#### 3.4 Bloco `android {}`

```groovy
android {
    ndkVersion        rootProject.ext.ndkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdk        rootProject.ext.compileSdkVersion

    namespace     "com.empresa.seuapp"    // ← Java package único
    defaultConfig {
        applicationId "br.com.empresa.seuapp"   // ← ID único na Play Store
        minSdkVersion    rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1        // ← incrementar a cada publicação
        versionName "1.0.0"  // ← semver visível ao usuário
    }

    signingConfigs {
        debug {
            storeFile     file('debug.keystore')
            storePassword 'android'
            keyAlias      'androiddebugkey'
            keyPassword   'android'
        }
        // Build type extra para ambiente de homologação (opcional)
        homolog {
            storeFile     file('debug.keystore')
            storePassword 'android'
            keyAlias      'androiddebugkey'
            keyPassword   'android'
        }
        release {
            // Em CI: ler de variáveis de ambiente; nunca hardcodar senhas
            storeFile     file('release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: 'local-password'
            keyAlias      System.getenv("KEY_ALIAS")         ?: 'release'
            keyPassword   System.getenv("KEY_PASSWORD")      ?: 'local-password'
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
            manifestPlaceholders = [usesCleartextTraffic: "true"]
            applicationIdSuffix ".develop"
        }
        // Build type de homologação (APK assinado, mas com id diferente)
        homologRelease {
            initWith release
            matchingFallbacks   = ['release']
            signingConfig       signingConfigs.homolog
            manifestPlaceholders = [usesCleartextTraffic: "false"]
            applicationIdSuffix ".homolog"
        }
        release {
            signingConfig signingConfigs.release
            manifestPlaceholders = [usesCleartextTraffic: "false"]
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
            applicationIdSuffix ""

            // Firebase Crashlytics NDK (remova se não usar)
            firebaseCrashlytics {
                nativeSymbolUploadEnabled true
                unstrippedNativeLibsDir 'build/intermediates/merged_native_libs/release/out/lib'
            }
        }
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    if (hermesEnabled.toBoolean()) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation 'io.github.react-native-community:jsc-android:2026004.+'
    }
}
```

---

### 4. `android/gradle.properties` — Performance e Flags

```properties
# JVM com memória suficiente para builds grandes
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m

# Suporte a AndroidX
android.useAndroidX=true

# Arquiteturas alvo (todas para Play Store; reduza para builds locais mais rápidos)
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64

# Nova Arquitetura (Fabric + TurboModules) – habilite ao migrar bibliotecas
newArchEnabled=true

# Motor JS: Hermes é obrigatório para New Arch e produção
hermesEnabled=true

# Edge-to-edge (apenas com ReactActivity padrão)
edgeToEdgeEnabled=false
```

---

### 5. `android/gradle/wrapper/gradle-wrapper.properties` — Versão do Gradle

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.3-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

> Sempre use a versão recomendada pelo Android Gradle Plugin atual. Consulte a [tabela de compatibilidade AGP ↔ Gradle](https://developer.android.com/build/releases/gradle-plugin#updating-gradle).

---

### 6. `android/local.properties` — SDK Local (não versionar)

```properties
# Gerado automaticamente pelo Android Studio ou pelo desenvolvedor
sdk.dir=/Users/seuusuario/Library/Android/sdk      # macOS/Linux
# sdk.dir=C\:\\Users\\seuusuario\\AppData\\Local\\Android\\Sdk  # Windows
```

Adicione `local.properties` ao `.gitignore`.

---

### 7. Keystores

#### Gerar keystore de release

```bash
keytool -genkeypair -v \
  -keystore android/app/release.keystore \
  -alias release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

- **Nunca versionar** `release.keystore` nem senhas em texto plano.
- Em CI (Azure DevOps, GitHub Actions, Bitrise): armazene o keystore como **secure file** e as senhas como **variáveis secretas**.
- O `debug.keystore` pode ser versionado (senha padrão: `android`).

---

### 8. `android/app/src/main/AndroidManifest.xml` — Estrutura Base

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:tools="http://schemas.android.com/tools">

  <!-- Permissões comuns -->
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

  <application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="${usesCleartextTraffic}"
    android:supportsRtl="true">

    <activity
      android:name=".MainActivity"
      android:label="@string/app_name"
      android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
      android:launchMode="singleTask"
      android:screenOrientation="portrait"
      android:windowSoftInputMode="adjustResize"
      android:exported="true">

      <!-- Launcher padrão -->
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>

      <!-- Deep links (ajuste o scheme) -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="seuapp" />
      </intent-filter>
    </activity>
  </application>
</manifest>
```

A variável `${usesCleartextTraffic}` é injetada via `manifestPlaceholders` no `build.gradle`, sendo `"true"` em debug e `"false"` em release/homolog.

---

### 9. Scripts de Build

#### `android/assembleHomologRelease.sh` — APK de Homologação

```bash
#!/bin/bash
./gradlew assemblehomologRelease
```

#### `android/bundleRelease.sh` — AAB de Produção

```bash
#!/bin/bash
./gradlew bundleRelease
```

#### Entradas no `package.json`

```json
{
  "scripts": {
    "assemble:android": "cd android && ./assembleHomologRelease.sh",
    "bundle:android":   "cd android && ./bundleRelease.sh"
  }
}
```

> No Windows use `gradlew.bat` diretamente ou execute via WSL/Git Bash.

---

### 10. Fontes dos Artefatos Gerados

| Tipo | Gradle task | Saída padrão |
|---|---|---|
| APK debug | `assembleDebug` | `app/build/outputs/apk/debug/` |
| APK homolog | `assemblehomologRelease` | `app/build/outputs/apk/homologRelease/` |
| APK release | `assembleRelease` | `app/build/outputs/apk/release/` |
| AAB release | `bundleRelease` | `app/build/outputs/bundle/release/` |

---

### 11. Google Services por Flavor (Firebase)

Cada build type que usa Firebase precisa de seu próprio `google-services.json` na pasta de source correspondente:

```
android/app/src/
  debug/          → google-services.json  (projeto Firebase de dev)
  homologRelease/ → google-services.json  (projeto Firebase de homolog)
  release/        → google-services.json  (projeto Firebase de prod)
```

O plugin `com.google.gms.google-services` seleciona automaticamente o arquivo correto conforme o build type ativo.

---

## Implementation Steps

1. **Definir versões de SDK** em `android/build.gradle` (`minSdkVersion`, `compileSdkVersion`, `targetSdkVersion`, `ndkVersion`).
2. **Atualizar `settings.gradle`** com o nome correto do projeto (`rootProject.name`).
3. **Configurar `android/app/build.gradle`**:
   - Definir `namespace` e `applicationId` únicos.
   - Definir `versionCode` e `versionName`.
   - Criar `signingConfigs` para debug, homolog e release.
   - Criar `buildTypes` correspondentes.
4. **Gerar keystores** com `keytool` e armazenar o release keystore fora do VCS ou em secret storage.
5. **Ajustar `gradle.properties`** para arquiteturas, Hermes e New Arch.
6. **Verificar `gradle-wrapper.properties`** para compatibilidade de versão.
7. **Adicionar `local.properties`** ao `.gitignore`.
8. **Configurar `AndroidManifest.xml`** com permissões, deep links e `manifestPlaceholders`.
9. **Criar scripts shell** `assembleHomologRelease.sh` e `bundleRelease.sh` e referenciá-los no `package.json`.
10. **Adicionar `google-services.json`** nas pastas de source de cada build type (se usar Firebase).

---

## Checklist

- [ ] `namespace` e `applicationId` definidos e únicos
- [ ] `versionCode` / `versionName` atualizados
- [ ] `signingConfigs` configurados para todos os build types usados
- [ ] Senhas do release keystore lidas de variáveis de ambiente (não hardcoded)
- [ ] `release.keystore` fora do VCS (`.gitignore`)
- [ ] `local.properties` no `.gitignore`
- [ ] `gradle-wrapper.properties` com versão compatível com o AGP
- [ ] `hermesEnabled=true` em `gradle.properties`
- [ ] `google-services.json` presente em cada pasta de source com Firebase
- [ ] Scripts shell têm permissão de execução (`chmod +x android/*.sh`)
- [ ] `package.json` com scripts `assemble:android` e `bundle:android`
- [ ] Build gerado e testado localmente antes do merge

---

## Prompt Seed

```
Meu projeto é React Native [com/sem Expo].
Preciso configurar o Android para gerar:
- APK de homologação (build type `homologRelease`)
- AAB de produção (build type `release`)

Dados do projeto:
- applicationId: br.com.empresa.meuapp
- versionCode: 1 / versionName: 1.0.0
- minSdkVersion: 24 / targetSdkVersion: 36
- Usa Firebase: [sim/não]
- New Architecture: [habilitada/desabilitada]

Gere os arquivos: build.gradle (raiz e app), gradle.properties, settings.gradle,
AndroidManifest.xml, scripts shell de build e entradas no package.json.
```

---

## Referências

- [React Native – Publishing to Google Play](https://reactnative.dev/docs/signed-apk-android)
- [Android Gradle Plugin Release Notes](https://developer.android.com/build/releases/gradle-plugin)
- [Firebase – Add Firebase to Android](https://firebase.google.com/docs/android/setup)
- [Gradle Compatibility Matrix](https://developer.android.com/build/releases/gradle-plugin#updating-gradle)
