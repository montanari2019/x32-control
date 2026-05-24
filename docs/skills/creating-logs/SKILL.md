---
name: creating-logs
description: "Documents the project log protocol for compact technical logs optimized for future AI and developer review. Use when creating logs in /logs after technical changes, debugging sessions, validations, or implementation work."
---

# Log Economy Protocol

## Summary

Esta skill define o padrão para criação de logs técnicos otimizados para consumo por IA, com foco em alta densidade de informação, baixa verbosidade e redução de ruído.

Todo log criado manualmente ou por agentes de IA deve ser salvo em `/logs`, usando estrutura previsível, texto objetivo e foco no delta técnico da implementação.

## Goal

Criar registros técnicos que ajudem futuras análises da IA sem gerar excesso de tokens, repetição ou logs brutos desnecessários.

O log deve responder rapidamente:

- qual problema foi tratado;
- qual causa foi identificada;
- qual ação técnica foi tomada;
- qual resultado foi obtido;
- quais pontos ainda exigem atenção.

## Storage Rules

### Local

Salvar obrigatoriamente na pasta:

```txt
/logs
```

na raiz do projeto.

### File Name Pattern

Usar o padrão:

```txt
YYYY-MM-DD_HH-mm-SS-desc-curta.txt
```

Exemplos:

```txt
2026-05-09_18-42-10-fix-mca-fader-reset.txt
2026-05-09_19-03-22-sync-mca-mute-state.txt
2026-05-09_19-30-01-toast-pointer-events.txt
```

### Extension

Usar sempre:

```txt
.txt
```

Evitar `.md`, `.json` ou outros formatos quando o objetivo for apenas registro técnico simples.

Motivo: `.txt` reduz overhead visual e mantém leitura direta para IA.

## Content Template

Todo log deve seguir este template:

```txt
[TÍTULO EM CAIXA ALTA]

Contexto: [problema/tarefa em 1 frase curta]
Causa: [causa técnica identificada]
Ação: [alterações feitas, arquivos tocados, comandos úteis]
Resultado: [OK | Erro | Pendente + síntese curta]
Arquivos: [lista curta dos arquivos principais]
Validação: [lint/typecheck/test/manual]
Pontos atenção: [riscos, pendências ou próximos passos]
```

## Required Writing Style

Use formato chave-valor.

Evite parágrafos longos.

Prefira frases curtas.

Escreva para leitura rápida por IA e por devs.

## Token Compression Rules

### 1. Technical Abbreviations

Usar abreviações técnicas conhecidas quando não prejudicar entendimento.

Exemplos permitidos:

```txt
v = versão
p/ = para
ref = referência
dep = dependência
config = configuração
auth = autenticação
impl = implementação
ctx = contexto
err = erro
svc = service/serviço
fn = função
comp = componente
env = ambiente
msg = mensagem
cmd = comando
```

Exemplo:

```txt
Ação: ajuste svc MCA p/ recalcular baseline após seleção canais.
```

### 2. Remove Low-Value Words

Remover artigos e termos que não agregam precisão técnica.

Evitar:

```txt
O problema aconteceu porque a função estava usando uma lista antiga dos canais.
```

Preferir:

```txt
Causa: fn usava lista antiga canais via closure.
```

### 3. Short Dates Inside Body

Dentro do conteúdo do log, usar data curta quando necessário:

```txt
DD/MM/YY
```

Não repetir timestamp completo dentro do corpo, pois o nome do arquivo já contém data/hora.

### 4. Avoid Internal Timestamps

Não registrar:

```txt
Iniciado às 18:30
Finalizado às 18:42
```

Exceto se duração for relevante p/ debug.

### 5. Focus on Delta

Registrar apenas mudança real de estado, decisão técnica ou correção.

Evitar histórico narrativo longo.

Bom:

```txt
Ação: add pointerEvents="box-none" no root ToastProvider; manter auto no toast card.
```

Ruim:

```txt
Analisei vários arquivos e percebi que talvez o problema estivesse no container principal...
```

## Noise Reduction Rules

### 1. Stack Traces

Não colar stack trace completo.

Extrair somente:

```txt
Erro: [mensagem principal]
Origem: [arquivo:linha]
```

Exemplo:

```txt
Erro: Socket is closed
Origem: src/services/osc/UdpTransport.ts:144
```

### 2. Hashes and Long IDs

Remover hashes, UUIDs, tokens e IDs longos, exceto quando forem essenciais p/ debug.

Evitar:

```txt
commit 9f7a8c6d4e321...
```

Preferir:

```txt
Commit: omitido, não necessário p/ debug.
```

### 3. Raw Logs

Não colar logs brutos grandes.

Resumir por padrão:

```txt
Logs: 3 ocorrências socket closed após MCA fader move; sem err antes interação.
```

### 4. Repeated Errors

Agrupar erros repetidos.

Exemplo:

```txt
Erro recorrente: setBroadcast em socket fechado após navegação BusGroups.
Qtd: múltiplas ocorrências em sequência.
```

### 5. Avoid Generic Statements

Evitar frases genéricas como:

```txt
Foi feita correção no código.
```

Preferir:

```txt
Ação: update handleMcaFaderChange p/ persistir localValue antes sync externo.
```

## Recommended Log Sections

### Contexto

Uma frase explicando problema/tarefa.

```txt
Contexto: Fader MCA voltava p/ posição inicial após drag.
```

### Causa

Causa técnica objetiva.

```txt
Causa: useEffect sincronizava localValue c/ externalValue durante drag.
```

### Ação

Lista curta das mudanças relevantes.

```txt
Ação: add isDraggingRef; bloquear sync externo durante drag; persistir valor no store.
```

### Resultado

Status final.

```txt
Resultado: OK; fader mantém posição após release.
```

### Arquivos

Listar apenas arquivos principais.

```txt
Arquivos: BusGroupsScreen.tsx; McaFader.tsx; mcaStore.ts.
```

### Validação

Informar validações realizadas.

```txt
Validação: npm run lint OK; teste manual mock OK.
```

### Pontos atenção

Usar somente se houver risco ou pendência.

```txt
Pontos atenção: validar c/ X32 real após teste mock.
```

## Optimized Log Example

```txt
FIX: MCA FADER RESET

Contexto: Fader MCA movia pouco e retornava p/ valor origem.
Causa: sync externo sobrescrevia localValue durante drag.
Ação: add isDraggingRef; bloquear sync durante gesture; persistir valor MCA no store.
Resultado: OK; fader mantém posição após release.
Arquivos: src/features/busGroups/BusGroupsScreen.tsx; src/features/busGroups/services/mcaProportionalityService.ts.
Validação: lint OK; manual mock OK.
Pontos atenção: testar c/ X32 real.
```

## Another Example

```txt
FIX: TOAST BLOCKING TOUCHES

Contexto: Toast visível bloqueava cliques app inteiro.
Causa: root absoluto interceptava touches em tela cheia.
Ação: add pointerEvents="box-none" no root; manter pointerEvents="auto" no toast card.
Resultado: OK; toast visível sem bloquear UI.
Arquivos: src/shared/toast/ToastProvider.tsx.
Validação: manual Android OK.
Pontos atenção: validar iOS.
```

## Anti-Patterns

Não criar logs assim:

```txt
Hoje foi analisado um problema no fader e depois de verificar algumas possibilidades foi percebido que talvez existisse uma função causando o problema...
```

Prefira:

```txt
Causa: fn syncMcaValue executava após cada render e resetava fader.
```

Não colar saída completa de terminal quando bastar:

```txt
Validação: npm run lint OK.
```

Se houver erro:

```txt
Validação: npm run typecheck Erro.
Erro: Cannot find module '@/features/busGroups/types'
Origem: src/features/busGroups/BusGroupsScreen.tsx:12
```

## Checklist

- Arquivo salvo em `/logs`
- Nome segue `YYYY-MM-DD_HH-mm-SS-desc-curta.txt`
- Extensão `.txt`
- Título em caixa alta
- Conteúdo em chave-valor
- Sem stack trace bruto
- Sem hashes/IDs longos desnecessários
- Sem timestamp interno redundante
- Foco em causa, ação e resultado
- Arquivos principais listados
- Validações registradas
- Pendências documentadas quando existirem

## Prompt Seed

Crie um log técnico otimizado em `/logs` seguindo a skill Log Economy Protocol. Use nome `YYYY-MM-DD_HH-mm-SS-desc-curta.txt`, formato `.txt`, estrutura chave-valor, frases curtas, sem stack trace bruto, sem hashes longos e com foco em contexto, causa, ação, resultado, arquivos, validação e pontos de atenção.
