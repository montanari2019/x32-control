# Spec (dev) — Endurecimento do master (proteção remota, OSC, medidor e gesto)

> Registro histórico. Implementado em 2026-10-15 (commit 4d05743). Spec técnica de origem:
> `repos/x32-control/src/features/busGroups/.specs/feature/master-fader-drag-stability/`
> Laudo: `../../rca.md`. Log: `logs/2026-10-15_22-40-00-busgroups-master-fader-drag-stability-implementation.txt`

## Critérios de aceite (imutáveis, de pbi.md)
CA-01..CA-05 — ver `pbi.md`.

## Decisões técnicas
| # | Decisão | Motivo |
|---|---------|--------|
| 1 | Janela de proteção de 250 ms (e envio pendente) descarta valor remoto do master em `handleRemoteMasterFader` | espelha o MCA; evita eco/atraso sobrescrever o valor local |
| 2 | `setMasterFader` coalesce o envio OSC a 1 por 40 ms com envio final por timer trailing | taxa limitada sem perder o valor final |
| 3 | Medidor do master em `ValueStore` externo (`shared/utils/valueStore.ts`) lido com `useSyncExternalStore` no `MasterStrip` | só o strip re-renderiza a ~20 Hz, não a tela |
| 4 | `pointerEvents="none"` nos filhos do fader e `onMoveShouldSet` só com `\|dy\| > \|dx\|` | `locationX/Y` relativo ao container; swipe horizontal rola a faixa |

## Arquivos
- repos/x32-control/src/features/busGroups/{hooks/useBusGroups.ts,components/{MasterStrip,VerticalGroupFader}.tsx,screens/BusGroupsScreen.tsx}
- repos/x32-control/src/shared/utils/valueStore.ts
- repos/x32-control/__tests__/features/busGroups/hooks/useBusGroups.test.ts

## Verificação
tsc limpo (só i18n pré-existente); Jest busGroups 16/16 com 2 testes novos (coalescência, janela de proteção). Validado pelo usuário no Android e iOS. Medidor com sinal real não testado.
