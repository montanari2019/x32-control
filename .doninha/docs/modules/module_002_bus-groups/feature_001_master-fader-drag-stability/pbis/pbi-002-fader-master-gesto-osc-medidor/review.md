---
stage: review
feature: feature_001_master-fader-drag-stability
pbi: fader-master-gesto-osc-medidor
created_at: 2026-10-15
status: done
---

# Review — fader-master-gesto-osc-medidor

## Rodada de revisão 1 — 2026-10-15

**Veredicto:** APROVADO
**Tasks revisadas:** _não se aplica_ (modo PBI, local-only; sem spec.md/task.md retroativos)

**Perfil de revisão:** `profundo`
**Motivo do perfil:** sinal de risco de concorrência/timers e corrida com valores remotos (proteção remota de 250 ms, throttle OSC de 40 ms, atualização do medidor).
**Passes executados:** 1 a 5, nenhum SKIP. Passes 1 e 2 pelo orquestrador; passe 3 em subagente opus; passe 4 em subagente sonnet; passe 5 em subagente haiku.
**Escopo:** `git diff 9224d5c HEAD` nos 7 arquivos de `repos/x32-control` (~218 linhas): `src/features/busGroups/components/{GroupStrip,MasterStrip,VerticalGroupFader}.tsx`, `hooks/useBusGroups.ts`, `screens/BusGroupsScreen.tsx`, `src/shared/utils/valueStore.ts` e `__tests__/features/busGroups/hooks/useBusGroups.test.ts`. Código no commit 4d05743 (base 457329c).
**Conformidade (passe 1):** feita contra os critérios de aceite do `pbi.md` (CA-xx) e a spec técnica `repos/x32-control/src/features/busGroups/.specs/feature/master-fader-drag-stability/spec.md`.

## Resumo

0 critical e 0 major bloqueantes após consolidação. CA-01 (proteção remota), CA-02 (OSC coalescido, envio final no caminho feliz) e CA-03 (medidor só re-renderiza o MasterStrip) atendidos; CA-04 parcial (achado 2); CA-05 com gates ok (tsc só com erros de i18n pré-existentes; jest busGroups 16/16; os 2 testes novos mordem por análise estática, pré-correção não verificado). Há 5 achados minor, consolidados por causa, nenhum bloqueante.

## Achados

| #   | Severidade | Arquivo | Linha | Categoria | Descrição | Recomendação |
| --- | ---------- | ------- | ----- | --------- | --------- | ------------ |
| 1 | minor (CONFIRMED) | `src/shared/utils/valueStore.ts` | L1-33 | testes | Testes ausentes: `createValueStore`/`useValueStore` sem teste, embora o testing.md do projeto declare "Unidade — hooks, services e utils"; `__tests__/shared/utils/` já tem padrão (clamp, faderDb). Também sem teste o gesto direcional (`VerticalGroupFader` L207-209) e `pointerEvents`. O passe 5 propôs `major`; rebaixado a minor na consolidação (cobertura insuficiente é minor pela tabela de severidade). | Cobrir `createValueStore`/`useValueStore` com testes; extrair o predicado puro `shouldClaimVerticalDrag(dx, dy)` e testá-lo. |
| 2 | minor (CONFIRMED) | `src/features/busGroups/components/VerticalGroupFader.tsx` | L205-211 | correção / CA-04 | O filtro `\|dy\| > \|dx\|` só existe em `onMoveShouldSet`; `onStartShouldSet` reivindica já no touch-down quando o toque cai em `isInsideInteractiveArea` (`isOnThumb` não confere X; faixa de 24 px do trilho). Um swipe horizontal que COMEÇA sobre o thumb/trilho não rola a faixa e a deriva vertical muda o valor. O passe 3 propôs `major`; rebaixado a minor: é o comportamento padrão de agarrar o thumb, o usuário validou em iOS e Android e o relato de sensibilidade foi resolvido. | Alinhar o texto do CA-04 ("swipe horizontal fora do thumb/trilho") ou adiar a captura para o move e restringir `isOnThumb` ao X do thumb. |
| 3 | minor (CONFIRMED) | `src/features/busGroups/hooks/useBusGroups.ts` | L606-614 | concorrência / RN-02 | Envio final perdido ao desmontar: o cleanup faz `clearTimeout` e descarta `masterPendingValueRef` sem enviar; soltar o fader menos de 40 ms após o último envio e sair da tela deixa a mesa no penúltimo valor (RN-02 "envio final garantido"). | Fazer flush do valor pendente no cleanup antes do disconnect. |
| 4 | minor (PLAUSIBLE) | `src/features/busGroups/hooks/useBusGroups.ts` | L708-714 e L620 | concorrência / valores remotos | Janela de proteção sem reconciliação: valor remoto descartado nos 250 ms após o último toque local nunca é reaplicado (o app diverge da mesa até a próxima mudança remota); e, com o dedo parado por mais de 250 ms, valores remotos voltam a entrar em `masterFaderRaw` (o rótulo dB mostra o remoto enquanto o thumb mostra o local). | Guardar o último valor remoto e aplicá-lo ao fim da janela; proteger também enquanto a interação estiver ativa (ref em `onFaderInteractionStart/End`). |
| 5 | minor (CONFIRMED) | `src/features/busGroups/hooks/useBusGroups.ts` (e `src/shared/utils/valueStore.ts`) | 747 linhas (arquivo) | design / duplicação | `useBusGroups.ts` (747 linhas) reimplementa o throttle trailing do MCA (`MCA_FADER_SEND_INTERVAL_MS`) e duplica a constante de janela de proteção (250 ms); `masterMeterDbfsRef` é redundante com `masterMeterStore.get()`; `valueStore.ts` mistura factory e hook em `shared/utils` (convenção: utils = funções puras; stores como serviços PascalCase). | Helper de throttle compartilhado ou `useMasterFader`; ler a store no limiar; separar o hook em `shared/hooks` ou registrar a exceção em architecture.md. |

## Cobertura dos critérios de aceite

| Critério | Task | Status |
| -------- | ---- | ------ |
| CA-01 (proteção remota) | n/a (sem tasks retroativas) | Verificado |
| CA-02 (OSC coalescido; envio final no caminho feliz) | n/a (sem tasks retroativas) | Verificado (ver achado 3 para o caso de desmontagem) |
| CA-03 (medidor só re-renderiza MasterStrip) | n/a (sem tasks retroativas) | Verificado |
| CA-04 (gesto) | n/a (sem tasks retroativas) | Parcial (ver achado 2) |
| CA-05 (gates) | n/a (sem tasks retroativas) | Verificado: tsc só com erros de i18n pré-existentes; jest busGroups 16/16; 2 testes novos mordem por análise estática, pré-correção não verificado |

---

## Rodada de revisão 2 — 2026-10-16

**Veredicto:** NECESSITA CORREÇÕES
**Tasks revisadas:** _não se aplica_ (modo PBI, local-only; sem spec.md/task.md retroativos)

**Tipo:** re-review de correção (escopo incremental: apenas o passe 3 de correção sobre o diff da correção + verificação dos achados da rodada 1).
**Perfil de revisão:** `profundo` (mantido).
**Base:** 4d05743.

### Resumo

Dos achados da rodada 1: F-02, F-03 e F-05 CORRIGIDOS; F-01 e F-04 PARCIAIS. Dois achados novos, ambos confirmados pelo orquestrador lendo o código: N-01 (major) e N-02 (minor). O veredicto NECESSITA CORREÇÕES decorre somente do N-01 major (corrigido na sequência, antes da rodada 3).

### Verificação dos achados anteriores

| Achado | Estado |
| ------ | ------ |
| F-01 | PARCIAL |
| F-02 | CORRIGIDO |
| F-03 | CORRIGIDO |
| F-04 | PARCIAL |
| F-05 | CORRIGIDO |

### Achados novos

| #   | Severidade | Arquivo | Linha | Categoria | Descrição | Recomendação |
| --- | ---------- | ------- | ----- | --------- | --------- | ------------ |
| N-01 | major (CONFIRMED) | `src/features/busGroups/hooks/useMasterFaderSync.ts` | L95-99 / L131 | concorrência / valores remotos | O valor remoto adiado era aplicado depois do envio local final, ficando obsoleto. | _não informada_ (corrigido na sequência; ver rodada 3) |
| N-02 | minor (CONFIRMED) | `src/features/busGroups/hooks/useMasterFaderSync.ts` | L84-92 | concorrência / ciclo de vida | Reagendamento do timer em ~1 ms com o dedo parado (polling); além disso, `isInteractingRef` ficava preso se o fader desmontasse no meio do gesto. | _não informada_ (corrigido na sequência; ver rodada 3) |

## Rodada de revisão 3 — 2026-10-16

**Veredicto:** APROVADO
**Tasks revisadas:** _não se aplica_ (modo PBI, local-only)

**Tipo:** re-review de correção (escopo incremental, só passe 3 de correção sobre o diff da correção + verificação dos achados anteriores).
**Perfil de revisão:** `profundo` (mantido).
**Base:** 1106282 + alterações.

### Resumo

0 critical e 0 major em aberto. N-01, N-02 e F-01 CORRIGIDOS. Um achado novo minor e um achado extra fora de escopo (pré-existente).

### Verificação dos achados anteriores

| Achado | Estado | Como foi corrigido |
| ------ | ------ | ------------------ |
| N-01 | CORRIGIDO | `sendNow` e `setMasterFader` zeram o valor remoto adiado. |
| N-02 | CORRIGIDO | `scheduleDeferredRemote` não agenda com o dedo pressionado e o release agenda; piso de espera de 10 ms; `VerticalGroupFader` chama `onInteractionEnd` no unmount. |
| F-01 | CORRIGIDO | Helpers puros `isTouchOnThumb` e `getDragPosition`, com testes. |

### Achados novos

| #   | Severidade | Arquivo | Linha | Categoria | Descrição | Recomendação |
| --- | ---------- | ------- | ----- | --------- | --------- | ------------ |
| N-03 | minor | `src/features/busGroups/hooks/useMasterFaderSync.ts` | L53 | concorrência / tratamento de erro | `sendNow` zerava o remoto adiado antes de saber se o envio deu certo; se o envio rejeitasse, o app ficava divergente da mesa. O teste só cobria a limpeza de `setMasterFader`. | _não informada_ (corrigido na rodada 4) |

### Achado extra fora de escopo (pré-existente)

`disabled` virando true no meio do arrasto remove os `panHandlers` e o release não chega (só MCAs): `isDragging` fica preso e o scroll fica travado. Pré-existente, fora do escopo desta correção (tratado na rodada 4).

## Rodada de revisão 4 — 2026-10-16 (final)

**Veredicto:** APROVADO
**Tasks revisadas:** _não se aplica_ (modo PBI, local-only)

**Tipo:** re-review de correção (escopo incremental, só passe 3 de correção sobre o diff da correção + verificação dos achados anteriores).
**Perfil de revisão:** `profundo` (mantido).

### Resumo

Sem achados abertos. Os dois pontos da rodada 3 estão CORRIGIDOS. Um achado novo minor foi encontrado e corrigido na própria rodada.

### Verificação dos achados anteriores

| Achado | Estado | Como foi corrigido |
| ------ | ------ | ------------------ |
| N-03 | CORRIGIDO | Restauração do valor remoto adiado no `.catch` do envio; teste novo `restores the deferred remote value when the trailing local send fails`. |
| Extra (`disabled` no meio do arrasto) | CORRIGIDO | O efeito de `disabled` encerra o arrasto em andamento. |

### Achados novos

| #   | Severidade | Arquivo | Linha | Categoria | Descrição | Recomendação |
| --- | ---------- | ------- | ----- | --------- | --------- | ------------ |
| N-04 | minor (corrigido) | `src/features/busGroups/hooks/useMasterFaderSync.ts` | _não informada_ | concorrência | A restauração no `.catch` não verificava se um envio local posterior já saiu: a rejeição tardia do envio A depois do envio B restauraria um remoto obsoleto. | Corrigido com o contador `sendSeqRef` (só o último envio restaura). |

### Validação

- `tsc` limpo (apenas os erros de i18n pré-existentes).
- Jest busGroups + busMix + shared utils/hooks: 85/85.
- Observação: o `scheduleDeferredRemote()` do `.catch` não é testado isoladamente.

### Pendentes não bloqueantes

- UAT com dedo real no iOS e no Android.
- Medidor com sinal real.
- 3 falhas pré-existentes em `NetworkScanner.test.ts`, fora do escopo.

---

Próximo passo: review APROVADO (rodada 4 final, sem achados abertos); acionar o `doninha-documentation` para este PBI. Os achados minor da rodada 1 e as correções das rodadas 2 a 4 ficam registrados e não bloqueiam.
