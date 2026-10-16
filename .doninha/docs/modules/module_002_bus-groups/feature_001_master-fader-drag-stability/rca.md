---
stage: rca
feature: master-fader-drag-stability
created_at: 2026-10-15
status: done
---

# RCA: [BusGroups] Fader Bus Master treme ao arrastar no Android

**Data:** 2026-10-15
**Investigado por:** Claude (sessão doninha-analisar, modo INVESTIGAÇÃO; registro histórico)
**Commit fixado:** 457329c — todo `arquivo:linha` abaixo vem deste ponto (correção commitada em 4d05743, branch `feature/android-discovery-setbroadcast-fix`)
**Confiança na causa raiz:** Alta (para a oscilação de altura, medida com dedo real)

---

## Sintoma e objetivo

| | |
| --- | --- |
| **Sintoma** | Na tela Personal Mix Grupos (BusGroups) do app Tacimix, o fader Bus Master tremia no Android (botão central e régua dB) ao arrastar o volume, como se "adivinhasse" o valor. Os MCAs não tremiam. No iOS o master era sensível demais a toque/scroll. |
| **Objetivo do usuário** | Ajustar o volume do BUS com precisão ao tocar/ensaiar, sem o fader pular. |

Aparelho de teste: Redmi Note 9S (Android), mesa X32 real em 192.168.1.250.

## Causa raiz

O rótulo dB do GroupStrip do master (`labelPlateText`) não tinha `lineHeight` fixo e usa `adjustsFontSizeToFit`. No Android, a altura do texto segue a fonte encolhida e mudava a cada valor, alterando a altura do rodapé e do `faderSlot` (`flex: 1`). O `onLayout` chamava `setMeasuredFaderHeight`, que mudava `trackHeight`/`availableHeight` do `VerticalGroupFader` durante o arrasto (462 <-> 466 dp, cerca de 6 eventos/s; `availableHeight` 406/402/405), fazendo a régua dB (`FaderDbScale` posiciona as marcas por `height`) e o trilho tremerem.

**Onde:** `GroupStrip.tsx:189-195`, `:276-290`, `:374-379`; `VerticalGroupFader.tsx:117`, `:187-197`; `FaderDbScale.tsx` (commit 457329c)
**Desde:** anterior ao histórico varrido
**Por que só apareceu agora:** `LACUNA` (não investigado)

Os MCAs não tremem porque `mcaLabelPlateText` fixa `lineHeight` 12 e `includeFontPadding: false`.

## Cadeia até o sintoma

| # | Elo | Evidência | Confiança |
| - | --- | --------- | --------- |
| 1 | Rótulo dB do master sem `lineHeight` fixo e com `adjustsFontSizeToFit` | `GroupStrip.tsx:189-195`, `:276-290`, `:374-379` (457329c) | Alta |
| 2 | Altura do rodapé e do `faderSlot` (`flex: 1`) muda a cada valor no Android | 57 eventos `faderSlot.onLayout` em ~10 s com arrasto real | Alta |
| 3 | `onLayout` -> `setMeasuredFaderHeight` altera `trackHeight`/`availableHeight` (462<->466 dp; 406/402/405) | `VerticalGroupFader.tsx:117`, `:187-197` | Alta |
| 4 | Régua dB e trilho tremem | Relato do usuário; A/B com mesmo swipe: estilo antigo 60 eventos onLayout em 8 s (28x462, 32x466), com a correção 0 | Alta |

## Hipóteses concorrentes

| Hipótese | Evidência a favor | Evidência contra | Como falsificar | Estado |
| -------- | ----------------- | ---------------- | --------------- | ------ |
| H1 [BusGroups] Re-render por medidor | Medidor atualiza estado da tela | Medidor sem sinal no teste | Repetir com sinal real | não totalmente testada (medidor com sinal não testado; mitigada movendo o medidor para store externo) |
| H2 [BusGroups] Eco OSC sobrescreve o fader | Possível valor remoto durante arrasto | 0 eco remoto, 0 TERMINATE na instrumentação | Instrumentar eco durante arrasto real | descartada neste teste |
| H3 [OSC] Flood de mensagens | 26-39 moves/s | Throttle ok: ~12-16 msg/s para 26-39 moves/s | Medir taxa de envio | mitigada |
| H4 [VerticalGroupFader] Hit test com `locationX/Y` | Filhos do fader capturavam o toque | — | `pointerEvents: none` nos filhos | corrigida |
| H5 [BusGroupsScreen] Captura de gesto não direcional (iOS) | Sensibilidade a toque/scroll no iOS | Deriva sintética de 61 px não rolou a faixa | Gesto com deriva sintética | corrigida; iOS confirmado só pelo usuário |
| H6 [GroupStrip] Rótulo sem `lineHeight` fixo altera a altura | Ver cadeia acima | — | A/B com mesmo swipe adb | CONFIRMADA |

## Falsificadores

| # | O que decide | Executado? | Resultado |
| - | ------------ | ---------- | --------- |
| F1 | Swipes sintéticos adb (lento/rápido) reproduzem o tremor? | sim, nesta sessão | Não reproduziu visualmente (gfxinfo 5% janky, p50 14 ms, p99 28 ms) |
| F2 | Instrumentação temporária com arrasto real: há mudança de altura do `faderSlot`? | sim, nesta sessão (instrumentação removida depois) | 57 eventos `onLayout` em ~10 s, 0 TERMINATE, 0 eco remoto, throttle OSC ok |
| F3 | A/B com mesmo swipe adb: estilo antigo vs correção | sim, nesta sessão | Antigo: 60 eventos onLayout em 8 s (28x462, 32x466); com a correção: 0 |
| F4 | Medidor com sinal real causa re-render da tela? | não executado | Medidor sem sinal; não testado |

## Estágio adversarial

**Eixos:** lógica CAI · log CAI · janela SOBREVIVE · contrato SOBREVIVE

| Eixo | Veredito | O que mudou na tese |
| ---- | -------- | ------------------- |
| lógica | CAI | Sem laço de realimentação; mas a tese subestimou a magnitude (1 dp estimado vs 4 dp medido) |
| log | CAI | Não havia `onLayout` medido na época |
| janela | SOBREVIVE | — |
| contrato | SOBREVIVE | — |

A tese foi reescrita: antes "causa provável (confiança Média)"; depois da instrumentação, "confirmada". Detalhes em `refutacao.md`.

## Sonda

Achado lateral fora do roteiro: toast `[Tacimix UDP] send_error` na descoberta de consoles, não relacionado ao tremor (confiança baixa).

## Capacidades e lacunas

| Papel | Estado | Impacto no laudo |
| ----- | ------ | ---------------- |
| source | consultado (repositório local) | — |
| logs | sem log JS em release | Evidência vem de instrumentação temporária removida depois |
| metrics | gfxinfo consultado | Não reproduz o tremor com swipes sintéticos |

Lacunas declaradas:
- Sem log JS em release.
- Outro agente reinstalou o app no aparelho às 21:16:08, o que pode ter interferido na linha do tempo das medições.
- iOS sem medição (confirmado só pelo usuário).
- O rótulo ainda corta o "B" em "-21.5dB" (cosmético).
- Medidor com sinal real não testado (H1).

## Handoff

### Requisitos

| # | Requisito | Módulo/serviço | Camada que fecha |
| - | --------- | -------------- | ---------------- |
| RF-01 | Rótulo dB do master com `lineHeight` fixo para que o `faderSlot` não mude de altura durante o arrasto | BusGroups / GroupStrip | UI (PBI-001) |
| RF-02 | Endurecer o master: janela de proteção contra valor remoto, envio OSC coalescido, medidor em store externo, gesto direcional | BusGroups / useBusGroups, MasterStrip, VerticalGroupFader, BusGroupsScreen | Estado, OSC e gesto (PBI-002) |

Nenhum requisito de handoff pendente.

### Critérios de aceite

| # | Dado | Quando | Então |
| - | ---- | ------ | ----- |
| CA-01 | Arrasto do master no Android | O dedo move o fader | O `faderSlot` não muda de altura (0 eventos onLayout no A/B); régua e trilho estáveis |
| CA-02 | Valor remoto chega durante ou logo após o arrasto | Dentro da janela de proteção de 250 ms | O valor remoto não sobrescreve o fader |

### Mesa-test

_não informado_

### Regressão

2 testes novos em `useBusGroups.test.ts` (coalescência de envio e janela de proteção). Não há teste automatizado de layout para a classe do defeito (oscilação de altura por rótulo sem `lineHeight`); a verificação foi manual com A/B via adb.

### Remediação de dados

N/A (sem dados persistidos afetados).

---

Próximo passo: `doninha-analisar` segue para a Feature e os PBIs de correção; a implementação é do `doninha-desenvolver`.
