---
stage: pbi
feature: master-fader-drag-stability
pbi: fader-master-altura-estavel
created_at: 2026-10-15
status: done
---

# PBI: Fader master com altura estável (rótulo dB com lineHeight fixo)

**ID:** pbi-001-fader-master-altura-estavel
**Feature pai:** feature_001_master-fader-drag-stability
**Data:** 2026-10-15
**Status:** implementado e validado pelo usuário (registro histórico); review pendente

---

## O que entrega

Ao arrastar o fader Bus Master na tela BusGroups, o fader, a régua dB e o trilho ficam estáveis no Android: o rótulo dB do master tem `lineHeight` fixo (`masterLabelPlateText` com `lineHeight` 16 e `includeFontPadding: false`, em retrato; o modo compacto mantém o seu), em `GroupStrip.tsx`.

## Critérios de Aceite

- CA-01: Durante o arrasto do master no Android, o `faderSlot` não muda de altura (0 eventos `onLayout` no A/B com o mesmo swipe; antes: 60 eventos em 8 s).
- CA-02: Régua dB e trilho ficam estáveis durante o arrasto.
- CA-03: O usuário confirmou o resultado no Android e no iOS.

## Validação INVEST

| Critério    | Status | Justificativa |
| ----------- | ------ | -------------- |
| Independent | ✅ | _não informado_ |
| Negotiable  | ✅ | _não informado_ |
| Valuable    | ✅ | _não informado_ |
| Estimable   | ✅ | _não informado_ |
| Small       | ✅ | _não informado_ |
| Testable    | ✅ | _não informado_ |

## Notas

- Item já entregue em 2026-10-15 (commit 4d05743); nada será implementado a partir deste PBI.
- Cosmético fora do escopo: o rótulo ainda corta o "B" em "-21.5dB".
- Referências: `rca.md`; spec técnica em `repos/x32-control/src/features/busGroups/.specs/feature/master-fader-drag-stability/`; log `logs/2026-10-15_22-40-00-busgroups-master-label-lineheight-fix.txt`.

---

Próximo passo rode `doninha-code-review` para o review deste PBI (pendente).
