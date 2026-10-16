---
stage: pbi
feature: master-fader-drag-stability
pbi: fader-master-gesto-osc-medidor
created_at: 2026-10-15
status: done
---

# PBI: Endurecimento do master (proteção remota, OSC, medidor e gesto)

**ID:** pbi-002-fader-master-gesto-osc-medidor
**Feature pai:** feature_001_master-fader-drag-stability
**Data:** 2026-10-15
**Status:** implementado e validado pelo usuário (registro histórico); review pendente

---

## O que entrega

O fader Bus Master fica robusto durante o arrasto em `useBusGroups.ts`, `MasterStrip`, `VerticalGroupFader` e `BusGroupsScreen`: janela de proteção de 250 ms contra valores remotos; envio OSC coalescido a 1 por 40 ms com envio final garantido; medidor `/meters/2` movido para store externo (`src/shared/utils/valueStore.ts`, `useSyncExternalStore`) para que só o `MasterStrip` re-renderize; filhos do fader com `pointerEvents: none` (`locationX/Y` relativo ao container) e captura de move só quando `|dy| > |dx|` (horizontal rola a faixa).

## Regras de Negócio

- RN-01: Valor remoto não sobrescreve o fader durante ou logo após o arrasto (janela de 250 ms).
- RN-02: O envio OSC durante o arrasto é limitado a 1 por 40 ms, com envio final garantido.
- RN-03: O medidor não re-renderiza a tela inteira.
- RN-04: A captura de move acontece só quando `|dy| > |dx|`; swipe horizontal sobre o master rola a faixa.

## Critérios de Aceite

- CA-01: Valor remoto não sobrescreve o fader durante ou logo após o arrasto.
- CA-02: Envios OSC limitados (coalescidos a 1 por 40 ms, com envio final garantido).
- CA-03: O medidor não re-renderiza a tela.
- CA-04: Swipe horizontal sobre o master rola a faixa.
- CA-05: Gates: `yarn tsc` (somente erros i18n pré-existentes) e Jest busGroups 16/16, com 2 testes novos em `useBusGroups.test.ts` (coalescência, janela de proteção).

## Validação INVEST

| Critério    | Status | Justificativa |
| ----------- | ------ | -------------- |
| Independent | ✅ | _não informado_ |
| Negotiable  | ✅ | _não informado_ |
| Valuable    | ✅ | _não informado_ |
| Estimable   | ✅ | _não informado_ |
| Small       | ✅ | _não informado_ |
| Testable    | ⚠️ | Medidor com sinal real não testado; UAT sem timestamps. |

## Notas

- Item já entregue em 2026-10-15 (commit 4d05743); nada será implementado a partir deste PBI.
- Follow-ups opcionais: medidor com sinal real não testado; UAT sem timestamps.
- Referências: `rca.md`; spec técnica em `repos/x32-control/src/features/busGroups/.specs/feature/master-fader-drag-stability/`; log `logs/2026-10-15_22-40-00-busgroups-master-fader-drag-stability-implementation.txt`.

---

Próximo passo rode `doninha-code-review` para o review deste PBI (pendente).
