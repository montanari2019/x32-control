# Tasks (dev) — registro retroativo

Nenhuma task foi executada por este fluxo; todas descrevem trabalho já feito em 2026-10-15.

- [x] task-01 Janela de proteção de 250 ms contra valores remotos do master — CA-01, RN-01
- [x] task-02 Envio OSC coalescido a 1/40 ms com envio final — CA-02, RN-02
- [x] task-03 `ValueStore` externo para o medidor e `MasterStrip` com `useSyncExternalStore` — CA-03, RN-03
- [x] task-04 `VerticalGroupFader`: `pointerEvents="none"` nos filhos e captura de move só vertical — CA-04, RN-04
- [x] task-05 2 testes novos em `useBusGroups.test.ts`; tsc e Jest busGroups — CA-05
- [x] task-06 F-03/F-04/F-05: novo `useMasterFaderSync` (envio final no unmount antes do disconnect, valor remoto adiado e reaplicado ao fim da janela, proteção durante a interação, constante de janela única `LOCAL_PROTECTION_WINDOW_MS`); `masterMeterDbfsRef` removido; `useValueStore` movido para `shared/hooks`
- [x] task-07 F-01: testes novos (`valueStore`, `useValueStore`, `faderGesture`, `useMasterFaderSync`)
- [x] task-08 F-02: toque no thumb restrito ao X do thumb (+8 dp) e predicado puro `shouldClaimVerticalDrag`; `grantDy` evita salto quando a captura ocorre no meio do gesto
- [x] task-09 Verificação no Redmi (adb): arrasto do thumb ok; varredura vertical que passa pelo thumb não salta mais; swipe horizontal fora do thumb rola a faixa
- [ ] pendente: re-review (rodada 2) da correção; UAT com dedo real no iOS e Android; medidor com sinal real
