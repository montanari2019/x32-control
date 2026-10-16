---
stage: review
feature: android-discovery-setbroadcast-hang
pbi: descoberta-android-setbroadcast
created_at: 2026-10-15
status: done
---

# Review — descoberta-android-setbroadcast

## Rodada de revisão 1 — 2026-10-15

**Veredicto:** APROVADO
**Tasks revisadas:** _não informado_ (revisão em modo PBI, perfil padrão)

**Escopo:** commit 9224d5c (branch `feature/android-discovery-setbroadcast-fix`). Arquivos de código em `repos/x32-control`: `src/shared/network/{UdpTransport,NetworkScanner,NativeNetworkInterfaces,UdpDiagnostics}.ts`, `android/.../network/TacimixNetworkInfoModule.kt`, `src/features/consoleDiscovery/hooks/useConsoleDiscovery.ts`, i18n (en, pt-BR, es) e `__tests__/shared/network/*`.

**Método:** revisão feita pelo orquestrador, sem subagentes de passe, lendo o corpo completo de `NetworkScanner` e o diff dos demais arquivos. Os passes 3–5 (subagentes) não foram executados nesta rodada.

## Resumo

Sem findings critical/major. Há 5 findings minor (F-01 a F-05), nenhum bloqueante. A premissa de que o envio para broadcast funciona sem chamar `setBroadcast` foi validada no aparelho: 2 scans após a correção resultaram em 0 eventos `send_error`/`send_timeout` e `discovery_scan_complete` com `deviceCount=1`.

## Achados

| #    | Severidade | Arquivo                                                            | Linha | Categoria     | Descrição                                                                                                                                                                                                                                                                       | Recomendação                                                                                         |
| ---- | ---------- | ------------------------------------------------------------------ | ----- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| F-01 | minor      | `NetworkScanner.scanForConsoles`                                   | —     | concorrência  | Quando o watchdog (9s) vence, a função retorna enquanto `runScan` ainda pode estar no `finally` liberando MulticastLock/vínculo Wi-Fi; um novo scan iniciado logo em seguida poderia ter seu vínculo desfeito pelo unbind tardio do scan anterior. Raro (`runScan` normalmente termina em ~4–5s). | Aguardar a liberação antes de retornar, ou serializar scans.                                         |
| F-02 | minor      | `releaseAndroidNetwork`                                            | —     | robustez      | Usa `withTimeout(…, 1500ms, () => false)`: se o unbind de `bindProcessToNetwork` expirar, o processo permanece vinculado à rede Wi-Fi sem nova tentativa. Impacto baixo para este app (só usa a LAN), mas é estado de processo global.                                         | _não informado_                                                                                      |
| F-03 | minor      | `UdpDiagnostics`                                                   | —     | privacidade   | Agora espelha TODOS os eventos para o logcat via módulo nativo, inclusive em build de release e incluindo endereços IP da rede local; antes o release só logava erros.                                                                                                          | Limitar a `__DEV__` ou a eventos de erro em release.                                                 |
| F-04 | minor      | `TacimixNetworkInfoModule.kt` (MulticastLock)                      | —     | concorrência  | MulticastLock é não-contado (`setReferenceCounted(false)`); dois scans concorrentes soltariam o lock do outro. Hoje a UI impede scan concorrente.                                                                                                                              | Registrar como premissa.                                                                             |
| F-05 | minor      | `useConsoleDiscovery.ts`, `TacimixNetworkInfoModule.kt`            | —     | cobertura     | Sem teste do hook `useConsoleDiscovery` para a escolha da mensagem Android vs iOS e sem teste de unidade Kotlin para `TacimixNetworkInfoModule` (apenas compilação).                                                                                                            | _não informado_                                                                                      |

**Não-findings registrados:** comentário de que sockets Android já permitem broadcast, confirmado empiricamente (sem `send_error`).

## Cobertura dos critérios de aceite

| Critério | Task            | Status                                                                                                                                                                                                                                                                                      |
| -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-01    | _não informado_ | Verificado — teste do scanner por varredura unicast + verificação manual no Redmi Note 9S: osc-server/X32/192.168.1.250:10023 em ~3,5s.                                                                                                                                                     |
| CA-02    | _não informado_ | Coberto por testes automatizados (watchdog, bind pendente, consultas nativas penduradas). NÃO verificado manualmente (teste com mesa desligada pendente).                                                                                                                                    |
| CA-03    | _não informado_ | Verificado — logs `TacimixDiscovery` no logcat, verificado no aparelho.                                                                                                                                                                                                                     |
| CA-04    | _não informado_ | Sem regressão por inspeção: caminho iOS inalterado (teste "does not touch Android native helpers on iOS"; sem diffs de código nativo iOS em `ios/`; preflight de Rede Local intocado). NÃO verificado em iPhone.                                                                             |
| CA-05    | _não informado_ | Verificado — `tsc` limpo, Jest 28 suites / 117 testes, compilação Kotlin OK.                                                                                                                                                                                                                |

**Verificação adicional nesta revisão:** 2 scans no aparelho após a correção, com 0 eventos `send_error`/`send_timeout` e `discovery_scan_complete` `deviceCount=1`.

**Pendências de UAT manual:** CA-02 e CA-04.

---

Próximo passo: nenhum bloqueio; o `doninha-code-review` pode acionar o `doninha-documentation`. Os findings F-01 a F-04 podem virar PBI/tarefa de hardening, e o UAT manual (CA-02, CA-04) segue pendente.
