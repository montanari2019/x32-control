---
stage: documentation
feature: master-fader-drag-stability
pbi: fader-master-altura-estavel
created_at: 2026-10-16
status: done
---

# Learnings: Fader master com altura estável (rótulo dB com lineHeight fixo)

## O que foi implementado

O rótulo dB do Bus Master em `GroupStrip.tsx` ganhou `lineHeight` fixo (`masterLabelPlateText`: `lineHeight` 16, `includeFontPadding: false`, em retrato; o modo compacto mantém o seu). Com isso o `faderSlot` deixou de mudar de altura durante o arrasto no Android: 60 eventos `onLayout` em ~8 s caíram para 0, e a régua dB e o trilho pararam de tremer. Usuário confirmou Android e iOS.

## Decisões tomadas

| Decisão | Alternativa considerada | Motivo da escolha |
| ------- | ----------------------- | ----------------- |
| Estilo próprio `masterLabelPlateText` com `lineHeight` fixo, aplicado ao master em retrato | Alterar o `labelPlateText` compartilhado | Mesmo mecanismo do MCA (`mcaLabelPlateText`, `lineHeight` 12) e não sobrescreve o `lineHeight` do modo compacto |

## Desvios do planejado

Nenhum desvio significativo. O PBI é um registro retroativo: implementado em 2026-10-15 (commit 4d05743) fora do fluxo doninha-desenvolver; a review rodou depois e aprovou na rodada 1 sem achados.

## Problemas encontrados

A causa não era óbvia: `adjustsFontSizeToFit` sem `lineHeight` fixo fez a altura do rótulo seguir a fonte encolhida; o `onLayout` do `faderSlot` alimentava `setMeasuredFaderHeight`, alterando `trackHeight`/`availableHeight` (462↔466 dp, ~6 eventos/s) durante o arrasto. O MCA não sofria porque já fixava `lineHeight`. Foi provada com instrumentação temporária de `onLayout` (removida) e teste A/B com o mesmo swipe via adb no Redmi Note 9S.

## O que ficou fora do escopo

- O rótulo ainda corta o "B" em valores como "-21.5dB" (cosmético, registrado no rca/pbis).

## Documentação atualizada

| Arquivo | O que mudou |
| ------- | ----------- |
| `repos/x32-control/.doninha/docs/codebase/concerns.md` | Nova armadilha: `adjustsFontSizeToFit` sem `lineHeight` fixo faz o layout oscilar no Android durante o arrasto |
| `repos/x32-control/.doninha/docs/codebase/modules/busGroups.md` | Guia de mudança para o rótulo dB em `GroupStrip.tsx` (`lineHeight` do master 16 e do MCA 12) |

## Aprendizados para próximos PBIs

- Todo rótulo dinâmico com `adjustsFontSizeToFit` ao lado de um elemento medido por `onLayout` precisa de `lineHeight` fixo (e `includeFontPadding: false` no Android).
- O iOS não revela esse tipo de oscilação: validar no Android com contagem de `onLayout` (A/B com o mesmo swipe) em vez de só olhar a tela.
- Quando um componente "irmão" não sofre do bug (aqui, o MCA), compare os estilos dele primeiro: costuma apontar a causa.

---

Próximo passo Todos os stages desse PBI estão completos.
