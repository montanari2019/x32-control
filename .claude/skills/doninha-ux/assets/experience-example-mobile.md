---
name: Quill
status: final
sources:
  - ../pbi-007-quill/pbi.md
updated: 2025-09-02
---

# Quill — Espinha Dorsal de Experiência

> Exemplo ilustrativo. Superfície única mobile (paridade iOS + Android). Postura do consumidor, tom calmo por padrão. Complementa `design-example-mobile.md` (Quill DESIGN.md). Demonstra: microcopy como disciplina de validação, Inspiração & Anti-padrões justificando sua presença, Responsivo & Plataforma **omitidos** (superfície única — seção condicional não acionada). Referência cruzada de token: `{colors.accent}` e `{typography.title}` do DESIGN.md.

## Base

Superfície única mobile, iOS + Android com paridade. Nenhum sistema de UI nomeado — herda as convenções de plataforma para navegação, gestos do sistema e tipo dinâmico. `DESIGN.md` é a referência de identidade visual; esta espinha é a experiência. Modo escuro é a superfície padrão; modo claro é uma configuração.

## Arquitetura de Informação

| Superfície | Acessada de | Finalidade |
|---|---|---|
| Hoje | Abertura do app (frio) | Prompt do dia + compositor de entrada |
| Biblioteca | Barra de abas | Entradas anteriores, pesquisáveis |
| Detalhe da entrada | Toque na linha da Biblioteca | Ler / editar uma entrada |
| Configurações | Ícone de engrenagem no cabeçalho de Hoje | Conta, exportação, tema |

Barra de abas inferior (Hoje / Biblioteca / Configurações). Sem drawer. Pilhas modais com um nível de profundidade, nunca dois.

→ Referência de composição: `mockups/today-cold.html`, `mockups/composer.html`. A espinha prevalece em conflito.

## Voz e Tom

Microcopy. Voz da marca e postura estética residem em `DESIGN.md`.

| Faça | Não faça |
|---|---|
| "Prompt de hoje." | "Hora de escrever!" |
| "Salvo." | "✓ Salvo automaticamente com sucesso" |
| "Não foi possível alcançar a nuvem — seu trabalho está neste dispositivo." | "Erro de rede" |
| Frases curtas e completas. | Contadores de sequência, incentivos, pontos de exclamação. |

## Padrões de Componentes

Comportamental. Especificações visuais residem em `DESIGN.md.Components`.

| Componente | Uso | Regras comportamentais |
|---|---|---|
| Cartão de prompt | Hoje | Um por dia. Toque abre o compositor. Prompt em `{typography.title}`. |
| Compositor | Hoje + detalhe da entrada | Sem barra de formatação na v1. Salvamento automático em pausa ≥ 600ms. |
| Linha de entrada | Lista da Biblioteca | Toque → detalhe da entrada. Toque longo reservado para seleção de texto do sistema. |
| Indicador de salvamento | Cabeçalho do compositor | Alterna `Editando…` → `Salvo.` (visível por ≥ 800ms). Usa `{colors.ink-secondary}`. |
| Linha de configurações | Lista de Configurações | Toque → detalhe ou alternância. Accent `{colors.accent}` apenas em confirmações destrutivas. |

## Padrões de Estado

| Estado | Superfície | Tratamento |
|---|---|---|
| Abertura fria | Hoje | Exibe o prompt de hoje (em cache). Se não houver cache, `O prompt de hoje está carregando.` com skeleton. |
| Biblioteca vazia | Biblioteca | `Nenhuma entrada ainda — o prompt de hoje é a sua primeira.` Link para Hoje. |
| Pesquisa sem resultado | Pesquisa na Biblioteca | `Nenhum resultado.` Sem sugestões. |
| Escrita offline | Compositor | Salvar localmente. Sem banner. Sincronizar na próxima abertura. |
| Erro de sincronização | Configurações → Conta | Exibido apenas aqui. Nunca bloquear a escrita. |
| Foco | Compositor | Cursor nativo + teclado. Sem foco personalizado. |

## Primitivos de Interação

- Toque para agir. Toque longo reservado para seleção de texto do sistema.
- Deslizar para excluir nas linhas de entrada (padrão nativo, folha de confirmação).
- Puxar para atualizar apenas na Biblioteca.
- **Proibido:** carrosséis, animações hero na abertura, contadores de badge, sequências, reengajamento por notificação push.

## Piso de Acessibilidade

Comportamental. Contraste visual reside em `DESIGN.md`.

- VoiceOver / TalkBack: todo elemento interativo rotulado com função + estado. O indicador de salvamento anuncia `Salvo` na transição.
- Tipo dinâmico respeitado por meio dos tokens tipográficos de `DESIGN.md`. A UI deve permanecer legível na maior configuração — sem controles truncados.
- Reduzir Movimento: omitir o fade do indicador de salvamento; exibir `Salvo.` imediatamente.
- Alvos de toque ≥ 44pt (iOS) / 48dp (Android).
- Navegação por foco segue a ordem de leitura em todas as superfícies.

## Inspiração & Anti-padrões

- **Extraído do Day One:** o enquadramento de entrada diária única — um prompt, um compositor, sem caixa de entrada.
- **Extraído do iA Writer:** o compositor sem barra de ferramentas; formatação é uma decisão de nível de configurações, não por entrada.
- **Rejeitado — Sequências (Duolingo, maioria dos apps de hábito):** sequências transformam o calendário do usuário em arma. O valor do Quill é aparecer *hoje*, não punir dias perdidos.
- **Rejeitado — Sugestões de prompt de IA dentro do compositor:** o compositor é para escrever, não negociar com um modelo. A IA vive apenas na geração do prompt diário.

## Fluxos Principais

### Fluxo 1 — Escrita diária (Mira, fim da tarde, após o trabalho)

1. Mira abre o app.
2. A superfície Hoje exibe o prompt do dia (em cache se offline).
3. Ela toca no ponto de entrada do compositor.
4. O compositor abre com o teclado ativo.
5. Ela escreve; o salvamento automático dispara na pausa.
6. Ela toca em Voltar.
7. **Clímax:** a superfície Hoje exibe `Salvo.` e a primeira linha da entrada abaixo do prompt — prova de que o dia foi registrado.

Falha: busca fria do prompt falha → o compositor ainda abre com prompt genérico em cache; banner em Hoje apenas após Mira retornar.

### Fluxo 2 — Recuperar entrada anterior (Mira, três semanas depois, buscando o que escreveu sobre sua mãe)

1. Mira toca em Biblioteca.
2. Rola ou pesquisa.
3. Toca na linha da entrada.
4. O detalhe da entrada abre em modo de leitura.
5. Ela toca em qualquer lugar para entrar no modo de edição (cursor no ponto de toque).
6. As edições são salvas automaticamente.
7. **Clímax:** `Salvo.` visível no cabeçalho da entrada — o eu do passado e o eu do presente estão em conversa contínua.

Estado vazio: sem entradas → mensagem redireciona para Hoje.
