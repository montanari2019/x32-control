---
stage: feature
feature: master-fader-drag-stability
created_at: 2026-10-15
status: done
---

# Feature: Estabilidade do fader Bus Master ao arrastar (BusGroups)

**ID:** feature_001_master-fader-drag-stability (local, sem tracker)
**Data:** 2026-10-15
**Responsável:** _não informado_
**Status:** Em documentação (registro histórico: item já investigado, corrigido e validado pelo usuário)

---

## Problema / Oportunidade

Na tela Personal Mix Grupos (BusGroups) do app Tacimix, o fader Bus Master tremia no Android (botão central e régua dB) ao arrastar o volume, como se "adivinhasse" o valor. Os MCAs não tremiam. No iOS o master era sensível demais a toque/scroll. Afetados: músicos e operadores que ajustam o volume do BUS ao tocar/ensaiar e precisam de precisão sem o fader pular.

## Solução Proposta

Registro documental do que foi investigado e corrigido em 2026-10-15 (nada novo será implementado):

1. Causa raiz: o rótulo dB do master recebe `lineHeight` fixo, para que a altura do `faderSlot` não mude durante o arrasto no Android (PBI-001).
2. Endurecimento do master: janela de proteção de 250 ms contra valores remotos, envio OSC coalescido, medidor em store externo e gesto direcional (PBI-002).

Detalhes da investigação em `rca.md`.

## Escopo

### IN — O que esta feature entrega
- Fader Bus Master estável ao arrastar no Android (régua dB e trilho sem oscilar).
- Master sem sensibilidade excessiva a toque/scroll no iOS (confirmado pelo usuário).
- Valor remoto não sobrescreve o fader durante ou logo após o arrasto.
- Envio OSC limitado durante o arrasto, com envio final garantido.
- Medidor sem re-renderizar a tela inteira.

### OUT — O que NÃO está incluído nesta feature
- Sensibilidade em retrato (T-008): não aplicada, pois o iOS foi confirmado OK.
- Correção do corte do "B" em "-21.5dB" (cosmético).
- Teste do medidor com sinal real e UAT com timestamps.
- Toast `[Tacimix UDP] send_error` na descoberta (achado lateral, não relacionado).

## Critérios de Sucesso

Esta feature não tem métrica de sucesso definida.

## Premissas e Decisões de Produto

| # | Decisão / Premissa | Justificativa |
| --- | --- | --- |
| 1 | Validação em aparelho real: Redmi Note 9S (Android) e mesa X32 real em 192.168.1.250 | Evidência medida com dedo real |
| 2 | iOS confirmado apenas pelo usuário, sem medição | Lacuna declarada no RCA |

## Decisões Chave

> Resumo das principais escolhas de abordagem desta feature. Detalhamento completo em `decisions.md`.

| # | Decisão | Alternativas descartadas | Motivo da escolha |
| --- | --- | --- | --- |
| 1 | Modo INVESTIGAÇÃO | Outros modos do doninha-analisar | Escolhido pelo usuário |
| 2 | Tracker local-only | Tracker externo | Sem tracker configurado |
| 3 | Novo módulo `module_002_bus-groups` | Reaproveitar `module_001_console-discovery` | Domínio distinto (BusGroups) |
| 4 | Exceção à regra de não editar na investigação (instrumentação temporária, removida) | Investigar só por leitura | Autorizada pelo usuário; swipes sintéticos não reproduziram |
| 5 | Dividir em 2 PBIs (causa raiz x endurecimento) | PBI único | Entregas verificáveis isoladamente |
| 6 | T-008 não aplicada | Reduzir sensibilidade em retrato | iOS confirmado OK |

## Alternativas Consideradas e Rejeitadas

| Alternativa | Por que foi considerada | Por que foi descartada |
| --- | --- | --- |
| H2 eco OSC como causa | Valor remoto poderia sobrescrever o fader | 0 eco remoto na instrumentação (rejeitada neste teste) |
| H3 flood OSC como causa | 26-39 moves/s | Throttle já ok (~12-16 msg/s); mitigada |
| T-008 sensibilidade em retrato | Master sensível demais no iOS | iOS confirmado OK pelo usuário |

## Dependências

- Nenhuma pendente.

## Referências

- RCA: `rca.md`
- Sessão: `sessao.md`; refutação adversarial: `refutacao.md`
- Decisões detalhadas: `decisions.md`
- Spec técnica: `repos/x32-control/src/features/busGroups/.specs/feature/master-fader-drag-stability/{spec,tasks,context}.md`
- Logs: `logs/2026-10-15_22-10-00-busgroups-master-fader-investigacao-onlayout.txt`, `logs/2026-10-15_22-40-00-busgroups-master-label-lineheight-fix.txt`, `logs/2026-10-15_22-40-00-busgroups-master-fader-drag-stability-implementation.txt`

---

Próximo passo rode `doninha-analisar` (passo 05) para decompor a feature em PBIs.
