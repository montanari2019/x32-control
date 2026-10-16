# Spec (dev) — Fader master com altura estável

> Registro histórico. Implementado em 2026-10-15 (commit 4d05743). Spec técnica de origem:
> `repos/x32-control/src/features/busGroups/.specs/feature/master-fader-drag-stability/`
> Laudo: `../../rca.md`. Log: `logs/2026-10-15_22-40-00-busgroups-master-label-lineheight-fix.txt`

## Critérios de aceite (imutáveis, de pbi.md)
CA-01..CA-03 — ver `pbi.md`.

## Causa raiz
O rótulo dB do master (`labelPlateText` em `GroupStrip.tsx`) não tinha `lineHeight` fixo e usa `adjustsFontSizeToFit`.
No Android a altura do texto seguia a fonte encolhida e mudava a cada valor, variando a altura do rodapé e do
`faderSlot` (flex 1). O `onLayout` chamava `setMeasuredFaderHeight`, mudando `trackHeight`/`availableHeight` durante o
arrasto (462↔466 dp, ~6 eventos/s) e fazendo régua e trilho tremerem. O MCA não tremia porque `mcaLabelPlateText` já fixa `lineHeight: 12`.

## Decisões técnicas
| # | Decisão | Motivo |
|---|---------|--------|
| 1 | `masterLabelPlateText` (`lineHeight: 16`, `includeFontPadding: false`) aplicado ao master em retrato; compacto mantém o seu | mesmo mecanismo do MCA; evita sobrescrever o `lineHeight` 12 do compacto |

## Arquivos
- repos/x32-control/src/features/busGroups/components/GroupStrip.tsx

## Verificação
Teste A/B no Redmi Note 9S com o mesmo swipe adb: estilo antigo 60 eventos `onLayout` em ~8 s; com a correção 0. Usuário confirmou Android e iOS. tsc limpo (só erros i18n pré-existentes); Jest busGroups 16/16.
