---
stage: documentation
feature: master-fader-drag-stability
pbi: fader-master-gesto-osc-medidor
created_at: 2026-10-16
status: done
---

# Learnings: Endurecimento do master (proteção remota, OSC, medidor e gesto)

## O que foi implementado

O fader Bus Master ficou robusto durante o arrasto: o envio OSC é coalescido a 1 por 40 ms com envio final garantido; valores remotos são adiados durante e 250 ms após a interação; o medidor `/meters/2` saiu da árvore de estado da tela para um `ValueStore` lido só pelo `MasterStrip`; e o gesto só captura quando `|dy| > |dx|`. Após o review (4 rodadas), a lógica de sincronização foi extraída para o hook `useMasterFaderSync` e o gesto para helpers puros em `faderGesture.ts`.

## Decisões tomadas

| Decisão | Alternativa considerada | Motivo da escolha |
| ------- | ----------------------- | ----------------- |
| Hook `useMasterFaderSync` (throttle 40 ms, proteção 250 ms, remoto adiado, flush no unmount) | Manter a lógica dentro de `useBusGroups.ts` (747 linhas) | Isola timers e refs testáveis; reduz duplicação do throttle do MCA |
| Remoto adiado e reaplicado ao fim da proteção (e descartado quando um envio local mais novo o torna obsoleto) | Descartar o remoto durante a janela | Evita o app divergir da mesa (achados F-04 e N-01) |
| `sendSeqRef`: só o último envio restaura o remoto se falhar | Restaurar em qualquer rejeição | Rejeição tardia do envio A após o B restauraria um remoto obsoleto (N-04) |
| Flush do valor pendente no unmount e `onInteractionEnd` ao desmontar o fader | Apenas `clearTimeout` | Garante "envio final" (RN-02) e não deixa `isInteractingRef` preso |
| `ValueStore` + `useValueStore` (`useSyncExternalStore`) em `shared/utils` e `shared/hooks` | `useState` na tela / Context | Só o `MasterStrip` re-renderiza na taxa do medidor (~20 Hz) |
| Helpers puros `shouldClaimVerticalDrag`, `isTouchOnThumb`, `getDragPosition` | Predicados inline em `VerticalGroupFader` | Testáveis; `getDragPosition` desconta o `dy` do grant, sem pulo do thumb na captura tardia |
| `pointerEvents: none` nos filhos do fader | Compensar offsets de `locationX/Y` | Torna `locationX/Y` relativo ao container |

## Desvios do planejado

A implementação original (commit 4d05743) colocou a lógica em `useBusGroups.ts`. O review da rodada 1 (5 achados minor) levou à extração para `useMasterFaderSync` e a testes novos (1106282); as rodadas 2 a 4 encontraram e corrigiram N-01 (major), N-02, N-03 e N-04 (minor) mais um achado pré-existente (`disabled` no meio do arrasto). O comportamento do CA-04 foi ajustado: o toque que começa no thumb agora é reivindicado só se o X cai no thumb (`isTouchOnThumb`), e o filtro vertical vale no move.

## Problemas encontrados

- Rodada 2: remoto adiado era aplicado depois do envio local final, ficando obsoleto (N-01, major).
- Reagendamento do timer a cada ~1 ms com o dedo parado e `isInteractingRef` preso se o fader desmontasse no meio do gesto (N-02).
- Falha no envio final deixava o app divergente da mesa (N-03), e a restauração tardia podia reaplicar um remoto obsoleto (N-04).
- `disabled` virando true no meio do arrasto removia os `panHandlers` e travava o scroll (pré-existente, só MCAs); corrigido encerrando o arrasto no efeito de `disabled`.
- Sem testes em `valueStore`/`useValueStore` na rodada 1; criados `__tests__/shared/utils/valueStore.test.ts` e `__tests__/shared/hooks/useValueStore.test.ts`.

## O que ficou fora do escopo

- UAT com dedo real no iOS e no Android após as correções das rodadas 2 a 4.
- Medidor com sinal real não testado.
- `scheduleDeferredRemote()` do `.catch` sem teste isolado.
- Duplicação residual com o throttle do MCA em `useBusGroups.ts` e constante de proteção de 250 ms (`LOCAL_PROTECTION_WINDOW_MS`) ainda usada nos dois lugares.
- 3 falhas pré-existentes em `NetworkScanner.test.ts`.

## Documentação atualizada

| Arquivo | O que mudou |
| ------- | ----------- |
| `repos/x32-control/.doninha/docs/codebase/modules/busGroups.md` | Capacidades do master (OSC coalescido, proteção/remoto adiado, medidor em store, gesto vertical), evidência e linhas no guia de mudança (`useMasterFaderSync`, `faderGesture`/`VerticalGroupFader`, rótulo do `GroupStrip`) |
| `repos/x32-control/.doninha/docs/codebase/architecture.md` | Gerência de estado: `createValueStore`/`useValueStore` como segundo mecanismo para valores de alta frequência |
| `repos/x32-control/.doninha/docs/codebase/testing.md` | Matriz: busGroups cobre utils e timers com fake timers; `shared` cobre utils/hooks do ValueStore |

## Aprendizados para próximos PBIs

- Valor de alta frequência (medidor) em store externo com `useSyncExternalStore` evita re-render da tela inteira.
- Em sincronização otimista com eco remoto, um valor adiado precisa de regras de obsolescência (envio local mais novo, falha de envio, unmount); trate cada transição de estado com teste de fake timers.
- Reviews incrementais pegaram bugs introduzidos pelas próprias correções (N-03 e N-04): re-revisar o diff da correção vale o custo.
- Extraia predicados de gesto para funções puras; gestos reais só se validam com dedo, mas a matemática se testa em Jest.

---

Próximo passo Todos os stages desse PBI estão completos.
