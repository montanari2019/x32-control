---
stage: feature
feature: android-discovery-setbroadcast-hang
created_at: 2026-10-15
status: done
---

# Feature: Descoberta de consoles no Android travada por setBroadcast

**ID:** feature_001_android-discovery-setbroadcast-hang (local, sem tracker)
**Data:** 2026-10-15
**Responsável:** _não informado_
**Status:** Em documentação (registro histórico: item já implementado e validado)

---

## Problema / Oportunidade

No Android, ao tocar "Buscar mesas na rede" com a X32 ligada na mesma rede/sub-rede, a busca ficava em "Procurando..." por 45s ou mais e nunca listava a mesa. No iOS (já publicado) a descoberta funcionava. Afetados: operadores e músicos que usam o Tacimix em Android.

## Solução Proposta

Registro documental do que foi entregue em 2026-10-15 (nada novo será implementado):

1. O Android deixa de chamar `setBroadcast` (iOS inalterado).
2. Limites de tempo: bind 4s, consultas nativas 1,5s e watchdog global de 9s, este apenas no Android.
3. Varredura unicast da sub-rede em paralelo ao broadcast no Android.
4. MulticastLock do Wi-Fi e vínculo do processo à rede Wi-Fi durante o scan, sempre liberados ao final.
5. Diagnósticos visíveis no logcat (tag `TacimixDiscovery`).
6. Mensagem de "mesa não encontrada" específica do Android (en, pt-BR, es), sem citar iPhone/Rede Local.

**Causa raiz (provada com logs nativos temporários, já removidos):** a chamada `setBroadcast()` do react-native-udp 4.1.7 no Android nunca retorna (issue upstream #82) e prende uma das apenas 2 threads do pool nativo da biblioteca. O app fazia duas chamadas (nativa + fallback JS), esgotando o pool; nenhum envio/bind posterior executava e nenhum pacote saía do celular (envios expiravam em 5s; a segunda busca estourava o bind em 4s). Hipótese descartada: rota via rede móvel (o Wi-Fi era a rede padrão validada).

**Por que a correção de junho/2026 falhou:** a spec global `android-console-discovery-hardening` apenas limitava a espera da confirmação e continuava chamando `setBroadcast`; nunca foi testada com mesa real no Android.

**Evidência de sucesso:** no Redmi Note 9S (Android 12), Wi-Fi 192.168.1.36, a tela lista o console "osc-server", modelo X32, em 192.168.1.250:10023 em ~3,5s. Antes, um Mac na mesma rede recebia resposta da X32 normalmente (mesa saudável).

**Qualidade:** `tsc` limpo; 28 suites / 117 testes Jest passando (10 testes novos: bind que nunca resolve, consultas nativas penduradas, watchdog, mesa achada por varredura unicast, liberação de recursos nativos, UdpTransport não chama `setBroadcast` no Android, helpers nativos Android/no-op iOS); compilação Kotlin OK.

**Pendente (UAT manual, fora do escopo desta entrega):** mesa desligada (deve terminar em até 9s com mensagem), Wi-Fi sem internet e regressão no iPhone antes de publicar.

## Regras de Negócio

As regras de negócio desta feature estão documentadas no PBI que cada uma governa —
veja a seção `Regras de Negócio` de cada `pbis/*/pbi.md`.

## Escopo

### IN — O que esta feature entrega
- Registro histórico da correção da descoberta de consoles no Android, já implementada e validada.

### OUT — O que NÃO está incluído nesta feature
- Nova implementação.
- UI de IP manual.
- Patch/PR na biblioteca react-native-udp.

## Critérios de Sucesso

Esta feature não tem métrica de sucesso definida.

## Premissas e Decisões de Produto

| # | Decisão / Premissa | Justificativa |
| --- | --- | --- |
| 1 | Registro local-only, sem item no tracker | DEC-04 |
| 2 | Texto em nível de negócio; detalhes técnicos ficam na spec referenciada | DEC-05 (exceção consciente: o usuário pediu artefato técnico/histórico) |

## Decisões Chave

> Resumo das principais escolhas de abordagem desta feature. Detalhamento completo em `decisions.md`.

| # | Decisão | Alternativas descartadas | Motivo da escolha |
| --- | --- | --- | --- |
| 1 | DEC-01 Escopo: apenas documentar o que foi feito | Nenhuma avaliada | Item já implementado; nada novo |
| 2 | DEC-02 Não chamar `setBroadcast` no Android; confiar em varredura unicast + broadcast sem confirmação | Apenas limitar a espera da confirmação (tentada em junho, insuficiente) | `setBroadcast` bloqueia o pool de 2 threads no Android |
| 3 | DEC-03 Manter proteções em camadas (timeouts, watchdog, MulticastLock, vínculo Wi-Fi) | _não informado_ | Defesa mesmo após a causa provada |
| 4 | DEC-04 Registro local-only | Criar item no tracker | Sem tracker |
| 5 | DEC-05 Texto de negócio no PRD/PBI | Detalhar código no PRD | Detalhes na spec referenciada |

## Alternativas Consideradas e Rejeitadas

Não houve avaliação de alternativas: análise express sobre item já decidido. Como contexto, a abordagem de apenas limitar a espera da confirmação foi tentada em junho/2026 e rejeitada por insuficiente.

## Dependências

- Nenhuma informada.

## Referências

- Decisões detalhadas: `.doninha/docs/modules/module_001_console-discovery/feature_001_android-discovery-setbroadcast-hang/decisions.md`
- Sessão: `.doninha/docs/modules/module_001_console-discovery/feature_001_android-discovery-setbroadcast-hang/sessao.md`
- Spec técnica: `repos/x32-control/src/features/consoleDiscovery/.specs/feature/android-discovery-field-failure/`
- Log técnico: `logs/2026-10-15_21-05-00-android-discovery-fix-setbroadcast.txt`
- Evidências: logs nativos (temporários, removidos) e screenshot da tela com o console listado
- Mockups: sem imagens de card

---

Próximo passo rode `doninha-analisar` (passo 05) para decompor a feature em PBIs.
