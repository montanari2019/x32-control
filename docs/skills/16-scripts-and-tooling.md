---
title: Scripts and Tooling
type: skill
version: 1.0
scope: dev-tooling
tags: [scripts, package.json, husky, jest, eslint, tsc, pods, ci]
---

## Summary

O `package.json` agrupa todos os scripts por categoria: execução, build, testes, qualidade de código e setup. Os scripts de plataforma delegam para shell scripts na pasta `android/`. O setup de iOS é encapsulado em `pod-install.sh` via Gemfile para garantir versões fixas do CocoaPods.

## Core Pattern

- Scripts organizados por categoria com namespacing por `:` (ex: `test:ci`, `lint:ci`).
- Variantes `:ci` de cada script para uso em pipelines.
- Shell scripts por plataforma em `android/` chamados pelos scripts do `package.json`.
- `pod-install.sh` detecta o SO e só roda CocoaPods no macOS, nunca no CI.
- `postinstall` e `prepare` automatizam setup do Husky e pods após `yarn install`.

## Reference Implementation

- Scripts: [package.json](package.json)
- Pod install: [pod-install.sh](pod-install.sh)
- Android assemble: [android/assembleHomologRelease.sh](android/assembleHomologRelease.sh)
- Android bundle: [android/bundleRelease.sh](android/bundleRelease.sh)
- Gemfile (versões CocoaPods): [Gemfile](Gemfile)

## Scripts por Categoria

### Execução

| Script | Comando real | Uso |
|---|---|---|
| `yarn android` | `react-native run-android --appIdSuffix=develop` | Roda no Android (flavor develop) |
| `yarn ios` | `react-native run-ios --mode=Debug` | Roda no iOS (modo Debug) |
| `yarn start` | `react-native start` | Sobe Metro Bundler |

### Build

| Script | Comando real | Uso |
|---|---|---|
| `yarn assemble:android` | `cd android && ./assembleHomologRelease.sh` | Gera APK homolog |
| `yarn bundle:android` | `cd android && ./bundleRelease.sh` | Gera AAB homolog |

Os shell scripts invocam o Gradle diretamente:

```bash
# android/assembleHomologRelease.sh
./gradlew assemblehomologRelease

# android/bundleRelease.sh
./gradlew bundleRelease
```

### Testes

| Script | Uso |
|---|---|
| `yarn test` | Roda todos os testes |
| `yarn test:ci` | Testes com cobertura, modo CI (sem interatividade) |
| `yarn test:coverage` | Testes com cobertura e abre relatório HTML (macOS) |
| `yarn test:watch` | Watch mode para desenvolvimento |

### Qualidade de Código

| Script | Uso |
|---|---|
| `yarn lint` | ESLint com cache local |
| `yarn lint:ci` | ESLint para pipeline (cache separado) |
| `yarn tsc` | Checagem de tipos sem emitir arquivos |
| `yarn tsc:ci` | Checagem incremental para pipeline |
| `yarn lint:tsc:ci` | `lint:ci` e `tsc` em paralelo (`run-p`) |

`run-p` vem do pacote `npm-run-all` e executa scripts em paralelo — instalar como devDependency.

### Setup

| Script | Uso |
|---|---|
| `yarn pod` | Instala CocoaPods via `pod-install.sh` |
| `yarn postinstall` | Automático após `yarn install`: roda `husky && yarn pod` |
| `yarn prepare` | Automático pelo Husky: instala git hooks |

## Shell Scripts

### `pod-install.sh`

Detecta macOS e ambiente não-CI antes de rodar pods. Copiar exatamente para novos projetos:

```bash
#!/bin/bash

unameOut="$(uname -s)"

echo "$unameOut";

if [ "$unameOut" == "Darwin" ] && [ "${CI}" == "" ]; then
    cd ios
    bundle install
    bundle exec pod install
fi
```

- `bundle exec pod install` usa o `Gemfile` para garantir versão controlada do CocoaPods.
- A variável `CI` impede que pods rodem em pipelines (onde o ambiente já está configurado).

### `android/assembleHomologRelease.sh` e `bundleRelease.sh`

Scripts mínimos que chamam tasks Gradle. O nome da task deve bater com o flavor definido em `android/app/build.gradle`.

```bash
#!/bin/bash
./gradlew assemblehomologRelease   # para APK
# ou
./gradlew bundleRelease            # para AAB
```

## `Gemfile` (CocoaPods controlado)

Necessário para `bundle exec pod install`. Copiar para novos projetos e ajustar restrições de versão se necessário:

```ruby
source 'https://rubygems.org'

ruby ">= 2.6.10"

gem 'cocoapods', '>= 1.13', '!= 1.15.0', '!= 1.15.1'
gem 'activesupport', '>= 6.1.7.5', '!= 7.1.0'
gem 'xcodeproj', '< 1.26.0'
gem 'concurrent-ruby', '< 1.3.4'

gem 'bigdecimal'
gem 'logger'
gem 'benchmark'
gem 'mutex_m'
```

## Implementation Steps

1. Copiar o bloco `scripts` do `package.json` adaptando o `appIdSuffix` e o nome do flavor Android.
2. Instalar devDependencies necessárias: `npm-run-all`, `husky`, `jest`, `eslint`, `typescript`.
3. Criar `pod-install.sh` na raiz com o conteúdo acima e dar permissão: `chmod +x pod-install.sh`.
4. Criar `android/assembleHomologRelease.sh` e `android/bundleRelease.sh` com a task Gradle correta.
5. Criar `Gemfile` na raiz com as restrições de versão do CocoaPods.
6. Rodar `yarn install` — `postinstall` vai executar Husky e pods automaticamente.

## Conventions to Follow

- Sempre ter variante `:ci` para scripts usados em pipeline.
- Usar `run-p` para rodar `lint` e `tsc` em paralelo no CI (economiza tempo).
- Nunca chamar `pod install` diretamente; sempre usar `yarn pod` para manter versões controladas.
- Os shell scripts Android devem ter permissão de execução (`chmod +x`).

## Pitfalls

- Esquecer `chmod +x` nos shell scripts quebra o `yarn assemble:android` e `yarn bundle:android`.
- Usar `pod install` global em vez de `bundle exec pod install` pode usar versão errada do CocoaPods.
- Rodar `yarn pod` no CI sem checar a variável `CI` instala pods desnecessariamente e pode falhar.
- Omitir `npm-run-all` como devDependency quebra `yarn lint:tsc:ci`.

## Checklist

- [ ] Bloco `scripts` no `package.json` com todas as categorias
- [ ] `pod-install.sh` criado com detecção de SO e CI
- [ ] `android/assembleHomologRelease.sh` e `android/bundleRelease.sh` criados e com permissão de execução
- [ ] `Gemfile` criado na raiz
- [ ] `npm-run-all` e `husky` instalados como devDependencies
- [ ] `yarn install` executado para acionar o `postinstall`

## Prompt Seed

Configure os scripts do `package.json` para um projeto React Native com Expo, seguindo as categorias: execução (android/ios/start), build (assemble/bundle para Android), testes (test/test:ci/test:watch), qualidade (lint/tsc com variantes :ci e run-p em paralelo) e setup (pod/postinstall/prepare com Husky). Crie os shell scripts auxiliares (`pod-install.sh`, `assembleHomologRelease.sh`, `bundleRelease.sh`) e o `Gemfile` conforme descrito nesta skill.
