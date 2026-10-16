---
stage: feature
feature: master-fader-drag-stability
created_at: 2026-10-15
status: done
---

# Log de Decisões — Estabilidade do fader Bus Master ao arrastar (BusGroups)

> Decisões detalhadas desta feature. Para resumo, veja `feature.md#Decisões Chave`.

## DEC-01 Modo INVESTIGAÇÃO

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** O item chegou como defeito já observado (tremor do fader Bus Master).

**Opções avaliadas:** Não houve avaliação de alternativas.

**Escolha:** Modo INVESTIGAÇÃO do doninha-analisar.

**Motivo:** Escolhido pelo usuário.

**Impactos:** O primeiro artefato da feature é o `rca.md`.

## DEC-02 Tracker local-only

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** Não há tracker configurado.

**Opções avaliadas:** Não houve avaliação de alternativas.

**Escolha:** Registro local-only.

**Motivo:** Sem tracker.

**Impactos:** Nenhuma sincronização externa.

## DEC-03 Novo módulo module_002_bus-groups

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** A feature pertence à tela BusGroups, distinta do módulo de descoberta de consoles.

**Opções avaliadas:** Não houve avaliação de alternativas.

**Escolha:** Criar `module_002_bus-groups`.

**Motivo:** Domínio distinto de `module_001_console-discovery`.

**Impactos:** Feature em `module_002_bus-groups/feature_001_master-fader-drag-stability`.

## DEC-04 Exceção à regra de não editar na investigação

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** Swipes sintéticos adb não reproduziram o tremor; era preciso medir com arrasto real.

**Opções avaliadas:**
- A) Investigar apenas por leitura: não obtém a medição do `onLayout`.
- B) Instrumentação temporária: permite medir o arrasto real.

**Escolha:** B, com autorização explícita do usuário.

**Motivo:** Medir os eventos `onLayout` durante o arrasto com dedo real.

**Impactos:** A tese passou de "causa provável (Média)" para "confirmada". A instrumentação foi removida depois.

## DEC-05 Dividir em 2 PBIs

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** A causa raiz confirmada (altura do rótulo) é distinta das hipóteses de endurecimento (eco remoto, flood OSC, medidor, gesto).

**Opções avaliadas:**
- A) PBI único.
- B) Dois PBIs: causa raiz (PBI-001) e endurecimento (PBI-002).

**Escolha:** B.

**Motivo:** Separar a causa raiz do endurecimento.

**Impactos:** `fader-master-altura-estavel` e `fader-master-gesto-osc-medidor`.

## DEC-06 T-008 (sensibilidade em retrato) não aplicada

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** O master era sensível demais a toque/scroll no iOS.

**Opções avaliadas:**
- A) Aplicar a T-008.
- B) Não aplicar.

**Escolha:** B.

**Motivo:** iOS confirmado OK pelo usuário.

**Impactos:** Fora do escopo desta feature.

## DEC-07 Achado lateral: toast send_error na descoberta

**Data:** 2026-10-15
**Status:** Em aberto

**Contexto:** Toast `[Tacimix UDP] send_error` observado na descoberta de consoles.

**Opções avaliadas:** Não houve avaliação de alternativas.

**Escolha:** Registrar como achado lateral.

**Motivo:** Não relacionado ao tremor do fader; confiança baixa.

**Impactos:** Nenhum nesta feature.
