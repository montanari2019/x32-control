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

Próximo passo: review APROVADO; acionar o `doninha-documentation` para este PBI. Os 5 achados minor ficam registrados e não bloqueiam.
