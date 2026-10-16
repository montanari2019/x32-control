---
stage: structure
feature: master-fader-drag-stability
created_at: 2026-10-15
status: done
---

# Estrutura — Estabilidade do fader Bus Master ao arrastar (BusGroups)

## Objetivo da feature

Registrar historicamente a investigação e a correção do tremor do fader Bus Master na tela BusGroups, para que o usuário ajuste o volume do BUS com precisão sem o fader pular. A entrega, já implementada e validada pelo usuário em 2026-10-15, está dividida em 2 PBIs.

## PBIs

### fader-master-altura-estavel — Fader master com altura estável (rótulo dB com lineHeight fixo)

**Descrição:** Rótulo dB do master com `lineHeight` fixo em `GroupStrip.tsx`, eliminando a oscilação de altura do `faderSlot` no Android. Status: implementado (registro histórico). Pasta: `pbis/pbi-001-fader-master-altura-estavel/`.
**Depende de:** nenhum

### fader-master-gesto-osc-medidor — Endurecimento do master (proteção remota, OSC, medidor e gesto)

**Descrição:** Janela de proteção de 250 ms, envio OSC coalescido, medidor em store externo e gesto direcional no master. Status: implementado (registro histórico). Pasta: `pbis/pbi-002-fader-master-gesto-osc-medidor/`.
**Depende de:** nenhum

## Justificativa da decomposição

Decisão DEC-05: separar a causa raiz confirmada (altura do rótulo) do endurecimento das demais hipóteses (eco remoto, flood OSC, medidor, gesto).

---

Próximo passo ambos os PBIs já estão implementados e validados pelo usuário; rode `doninha-code-review` para o review (pendente).
