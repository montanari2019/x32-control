# Spec (dev) — Descoberta de consoles no Android sem travar por setBroadcast

> Registro histórico. Implementado em 2026-10-15. Spec técnica detalhada de origem:
> `repos/x32-control/src/features/consoleDiscovery/.specs/feature/android-discovery-field-failure/`
> Log: `logs/2026-10-15_21-05-00-android-discovery-fix-setbroadcast.txt`

## Critérios de aceite (imutáveis, de pbi.md)
CA-01..CA-05 — ver `pbi.md`.

## Causa raiz
`setBroadcast()` do react-native-udp 4.1.7 (Android) nunca retorna e prende uma das 2 threads do pool nativo
(`UdpSockets.executorService`, N_THREADS = 2). O app chamava duas vezes (nativa + fallback JS), esgotando o
pool; binds e envios seguintes nunca rodavam, nenhum pacote saía. Provado com logs nativos temporários.

## Decisões técnicas
| # | Decisão | Motivo |
|---|---------|--------|
| 1 | Android não chama `setBroadcast` (`UdpTransport.configureBroadcastOnce`) | chamada trava o pool; soquete já permite broadcast e a varredura unicast não depende dele |
| 2 | Timeouts: bind 4s, consultas nativas 1,5s, watchdog 9s (só Android) em `NetworkScanner` | nenhum passo pode manter o spinner para sempre; iOS fica sem limite no bind (prompt de Rede Local) |
| 3 | Android: varredura unicast da sub-rede logo após o broadcast | broadcast é o caminho menos confiável no Android |
| 4 | MulticastLock + vínculo do processo à rede Wi-Fi durante o scan (`TacimixNetworkInfoModule.kt`), liberados em `finally` | defesa contra filtro de broadcast e rota via rede móvel; custo baixo |

## Arquivos
- repos/x32-control/src/shared/network/{UdpTransport,NetworkScanner,NativeNetworkInterfaces,UdpDiagnostics}.ts
- repos/x32-control/android/app/src/main/java/com/tacimix/app/network/TacimixNetworkInfoModule.kt
- repos/x32-control/src/features/consoleDiscovery/hooks/useConsoleDiscovery.ts
- repos/x32-control/src/shared/i18n/resources/{en,pt-BR,es}.ts
- repos/x32-control/__tests__/shared/network/*

## Verificação
tsc limpo; Jest 28 suites / 117 testes; compilação Kotlin OK; teste manual no Redmi Note 9S: osc-server / X32 / 192.168.1.250:10023 em ~3,5s.
