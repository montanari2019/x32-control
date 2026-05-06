---
title: Running the Project (Android & iOS)
type: skill
version: 1.0
scope: dev-environment
tags: [android, ios, run, setup, environment]
---

## Summary

This skill descreve a estrutura mínima necessária para rodar o projeto no Android e no iOS sem modificar o projeto. Siga exatamente esta ordem para garantir que o app suba na primeira tentativa.

## Prerequisites

| Ferramenta | Android | iOS |
|---|---|---|
| Node.js ≥ 18 | ✓ | ✓ |
| Yarn | ✓ | ✓ |
| JDK 17 | ✓ | – |
| Android Studio + SDK | ✓ | – |
| Xcode ≥ 15 | – | ✓ |
| CocoaPods | – | ✓ |
| Ruby (via rbenv/rvm) | – | ✓ |

## Arquivos Locais Obrigatórios

### Android — `android/local.properties`

Deve existir na máquina do dev. **Não sobe no git.**

```properties
sdk.dir=/Users/<seu-usuario>/Library/Android/sdk          # macOS
# sdk.dir=C:\\Users\\<seu-usuario>\\AppData\\Local\\Android\\Sdk  # Windows
```

Crie manualmente se não existir, apontando para o diretório do Android SDK instalado.

### iOS — sem arquivo extra

O Podfile usa autolink do Expo. Basta ter o Ruby e o CocoaPods corretos (instalados via `bundle install`).

## Installation Steps

```bash
# 1. Instalar dependências JS
yarn install

# 2. Instalar pods (macOS only — o script já detecta o SO)
yarn pod
```

`yarn pod` executa `pod-install.sh`, que só roda `bundle install && bundle exec pod install` no macOS. No Windows, o passo de pods é ignorado automaticamente.

## Running

### Android

```bash
yarn android
# equivale a: react-native run-android --appIdSuffix=develop
```

Requisitos antes de rodar:
- Emulador Android aberto **ou** dispositivo físico conectado via USB com USB Debugging ativado.
- `android/local.properties` existente com `sdk.dir` correto.

### iOS (macOS only)

```bash
yarn ios
# equivale a: react-native run-ios --mode=Debug
```

Requisitos antes de rodar:
- Simulator aberto **ou** dispositivo físico confiado no Xcode.
- Pods instalados (`yarn pod`).

## Metro Bundler

O Metro sobe automaticamente junto com `yarn android` ou `yarn ios`. Para subir separadamente (útil quando já há um metro rodando ou para debug isolado):

```bash
yarn start
```

Para resetar o cache do Metro (resolve a maioria dos erros de módulo não encontrado):

```bash
yarn start --reset-cache
```

## Variáveis de Ambiente

O projeto usa arquivos `.env` por flavor. Certifique-se de que o arquivo correto existe na raiz:

```
.env            # default / develop
.env.homolog    # homolog
.env.production # produção
```

Se não existirem, crie baseando-se no `.env.example` (se disponível) ou peça os valores ao time.

## Flavors / Build Variants

| Comando | Flavor | Observação |
|---|---|---|
| `yarn android` | `develop` | appIdSuffix=develop |
| `yarn ios` | `Debug` | mode=Debug |
| `yarn assemble:android` | `homologRelease` | gera APK homolog |
| `yarn bundle:android` | `homologRelease` | gera AAB homolog |

## Troubleshooting Rápido

| Sintoma | Solução |
|---|---|
| `SDK location not found` | Criar `android/local.properties` com `sdk.dir` correto |
| `No emulators found` | Abrir emulador no Android Studio antes de rodar |
| `Pod install failed` | Rodar `cd ios && bundle install && bundle exec pod install` manualmente |
| `Xcode build error` (módulo não encontrado) | Limpar build: `cd ios && xcodebuild clean` e reinstalar pods |
| Metro `Unable to resolve module` | `yarn start --reset-cache` |
| Erro de versão JDK | Garantir JDK 17 ativo (`java -version`). Usar `JAVA_HOME` se necessário |

## Conventions to Follow

- Nunca commitar `android/local.properties` (já está no `.gitignore`).
- Sempre usar `yarn pod` em vez de `pod install` direto para garantir as versões corretas do Gemfile.
- Rodar `yarn install` após qualquer `git pull` que altere `package.json`.

## Checklist

- [ ] `android/local.properties` criado com `sdk.dir` correto
- [ ] `yarn install` executado
- [ ] `yarn pod` executado (macOS)
- [ ] Emulador/dispositivo disponível
- [ ] Metro sem conflito de porta (padrão 8081)

## Prompt Seed

Configure o ambiente de execução do projeto React Native com Expo para rodar no Android (`yarn android`) e no iOS (`yarn ios`). Crie `android/local.properties` com o `sdk.dir` correto, rode `yarn install` e `yarn pod`, e use `yarn start --reset-cache` se houver erros de módulo no Metro.
