---
name: Drift
status: final
sources:
  - ../pbi-012-drift/pbi.md
updated: 2026-04-02
---

# Drift — Espinha Dorsal de Experiência

> Exemplo ilustrativo. Web responsiva de superfície única. shadcn/ui no Next.js + Tailwind. Vinculado a `design-example-shadcn.md` (Drift DESIGN.md). Demonstra: herança de biblioteca de componentes, primitivas de interação keyboard-first, o padrão "shadcn + camada de marca" que cobre a maioria dos SaaS web modernos. Referência cruzada de token: veja `{typography.display-sm}` e `{colors.accent}` usados nas seções abaixo.

## Fundação

Web responsiva de superfície única. shadcn/ui no Next.js 15+ com Tailwind CSS. A biblioteca de componentes faz a maior parte do trabalho; a disciplina de marca é "respeitar os padrões exceto onde a camada de marca os sobrescreve." `DESIGN.md` é a referência de identidade visual e nomeia a superfície de sobrescrita; esta espinha dorsal é a experiência. Single-tenant por projeto; usuários podem pertencer a múltiplos projetos, mas cada projeto é um workspace independente.

## Arquitetura de Informação

| Superfície | Acessada de | Objetivo |
|---|---|---|
| Hoje | App aberto / `g t` | Foco atual, tarefas em andamento extraídas de todos os projetos |
| Projetos | Barra lateral / `g p` | Lista de projetos ativos e arquivados |
| Detalhe do projeto | Linha em Projetos / `g 1`–`g 9` | Tarefas neste projeto, organizadas por lane |
| Busca | `⌘K` / `Ctrl+K` | Command palette — navegar, acessar, agir |
| Configurações | Menu do avatar | Conta, tema, atalhos de teclado, faturamento |

A barra lateral colapsa para ícones em `md`; torna-se um `Sheet` em `sm`. Modais empilham um único nível (ex.: abrir `Dialog` sobre uma superfície, nunca sobre outro dialog).

→ Referência de composição: `mockups/today.html`, `mockups/project-detail.html`, `mockups/command-palette.html`. Esta espinha dorsal prevalece em caso de conflito.

## Voz e Tom

Microcopy. Voz de marca e postura estética residem no `DESIGN.md`.

| Faça | Evite |
|---|---|
| "No que você está trabalhando?" | "Vamos ser produtivos! 🚀" |
| "3 tarefas em andamento" | "Você tem 3 itens ativos." |
| "Concluído. Bom trabalho." | "Tarefa concluída com sucesso ✓" |
| "Nada em andamento. Escolha algo." | "Sem tarefas ativas. Clique abaixo para começar!" |
| Para gestores: contagens e verbos. Para colaboradores: o mesmo. | Tom diferente por audiência — Drift fala com todos da mesma forma. |

## Padrões de Componentes

Comportamentais. Especificações visuais residem em `DESIGN.md.Components` (ou nos padrões do shadcn, quando herdados).

| Componente | Uso | Regras comportamentais |
|---|---|---|
| Linha de tarefa | Projetos, Hoje | Clicar em qualquer ponto da linha abre o dialog de edição. Checkbox alterna o estado de conclusão com atualização otimista. Hover revela ações rápidas (`focus`, `defer`, `archive`). |
| Cartão de foco | Hoje, Detalhe do projeto | No máximo um cartão de foco por superfície — a tarefa ou projeto marcado com estado `focus`. Atalho `f` define o foco na linha ativa. Preenchimento `{colors.accent}`. |
| Command palette | Global (⌘K) | Busca fuzzy em todos os projetos, tarefas e comandos. `Enter` executa o resultado destacado. `→` pré-visualiza um resultado. Esc fecha. |
| Cabeçalho do projeto | Detalhe do projeto | Título editável inline (clicar para editar, blur para salvar). Pill de status: ativo / arquivado / concluído. |
| Estado vazio | Em qualquer lugar | Padrão empty do shadcn + uma frase específica do Drift. `{typography.display-sm}` para o título, corpo abaixo, única ação primária. |

## Padrões de Estado

| Estado | Superfície | Tratamento |
|---|---|---|
| Carregamento inicial | Hoje | Linhas `Skeleton` do shadcn (4–6) correspondendo ao layout esperado. Resolvido ao receber dados. |
| Sem foco | Hoje | `{typography.display-sm}`: "Nada em andamento. Escolha algo." Abaixo: lista de tarefas em andamento de todos os projetos. |
| Projeto vazio | Detalhe do projeto | `{typography.display-sm}`: "{Project title} está vazio." Corpo: "Adicione uma primeira tarefa para começar." Único botão primário. |
| Command palette sem resultados | ⌘K | "Nenhum resultado. Digite o nome de uma tarefa ou projeto, ou escolha uma ação abaixo." Seguido de 4–5 comandos comuns. |
| Offline | Global (barra de status) | `Toast` do shadcn uma vez: "Você está offline. As alterações serão sincronizadas quando a conexão retornar." Escritas locais continuam. |
| Acesso negado | Projetos (privados de outros) | Superfície oculta da barra lateral. Sem tela de "bloqueado". |
| Dados desatualizados | Detalhe do projeto | Se a atualização em segundo plano detectar mudanças, `Toast` do shadcn: "Atualizado por {user_name}. Recarregar." Atualização manual, sem atualização automática. |

## Primitivas de Interação

**Keyboard-first.** O público principal do Drift são desenvolvedores e usuários avançados; o teclado é o produto, o mouse é o fallback.

- `⌘K` / `Ctrl+K` — Command palette (universal)
- `g t` / `g p` — Ir para Hoje / Projetos (estilo vim)
- `g 1`–`g 9` — Ir para projeto pela posição na barra lateral
- `f` — Definir foco na tarefa/projeto destacado
- `c` — Criar nova tarefa (contextual: no projeto ativo)
- `Esc` — Fechar dialogs, sair do modo de edição, limpar command palette
- `/` — Focar busca na superfície atual

**Mouse:** clicar para agir; arrastar adiado para v2. Hover revela ações de linha em `md+` (usuários touch tocam para revelar).

**Proibido em qualquer lugar:** scroll infinito (somente paginação), arrastar para reordenar na v1, affordances apenas por hover em viewports `sm`, modais empilhados em mais de 1 nível.

## Piso de Acessibilidade

Comportamental. Contraste visual reside no `DESIGN.md` (herda os padrões compatíveis com WCAG AA do shadcn; sobrescritas de marca verificadas para manter as proporções).

- WCAG 2.2 AA em toda a superfície web responsiva.
- O leitor de tela anuncia a superfície da página na navegação: "Hoje, superfície de foco" / "Projeto: {name}, lista de tarefas, {N} tarefas."
- Atalhos de teclado disponíveis sem modificador na maioria das superfícies (estilo vim `g t` etc.) — usuários com limitações motoras têm acesso à mesma superfície que usuários avançados.
- Ordem de `Tab` segue a ordem de leitura em cada superfície. `Esc` sempre fecha o modal/popover do nível mais alto.
- Command palette é totalmente operável por teclado; resultados são anunciados conforme atualizam via `aria-live`.
- Anéis de foco herdam o token `ring` do shadcn — visíveis com contraste AA contra `background`.

## Responsivo e Plataforma

| Breakpoint | Comportamento |
|---|---|
| `≥ lg` (1024px+) | Barra lateral visível. Hoje é um layout de 2 colunas: foco + lista em andamento. |
| `md` (768–1023px) | Barra lateral colapsa para ícones. Hoje passa para coluna única. |
| `< md` (`sm`) | Barra lateral torna-se um `Sheet` acionado pela barra superior. Command palette abre em tela cheia. |

Drift é web responsiva, não um aplicativo mobile nativo. O produto funciona em celulares para leitura + edição simples, mas a superfície principal é desktop / laptop.

## Inspirações e Anti-padrões

- **Absorvido do Linear:** a disciplina keyboard-first. `⌘K` é o centro de comando; navegação estilo vim (`g t`); sem arrastar para navegação primária; vocabulário de pills de status.
- **Absorvido do Notion:** títulos editáveis inline. Clicar para editar no cabeçalho do projeto, blur para salvar. Sem alternância entre modo edição/visualização.
- **Absorvido do shadcn:** todo o vocabulário de superfície. A marca do Drift é *o que adicionamos ao shadcn*, não um design system do zero. Esta é uma postura deliberada, não um atalho.
- **Rejeitado — Sequências, badges, notificações de conquista:** Drift é uma ferramenta, não um app de hábitos. Fechar uma tarefa é sua própria recompensa; sem animação comemorativa, sem toast "🎉 5 dias seguidos!".
- **Rejeitado — Sugestões de próximas tarefas por IA:** Drift exibe o que está em andamento, não diz ao usuário o que trabalhar. O usuário define o foco; a ferramenta exibe as consequências.
- **Rejeitado — Kanban multi-colunas como visualização padrão do projeto:** listas são lineares; kanban esconde o progresso atrás de colunas. Opcional na v2; não é o padrão.

## Fluxos Principais

### Fluxo 1 — Foco matinal (Sarah, fundadora solo, 8h45 de terça-feira)

1. Sarah abre o Drift em uma aba do navegador.
2. O app carrega Hoje. `display-sm`: "Bem-vinda de volta, Sarah." O cartão de foco exibe a tarefa marcada ontem — "Finalizar copy do hero da landing page" — ainda em andamento.
3. Ela pressiona `⌘K`, digita "ship hero", vê a tarefa correspondente e pressiona Enter para abri-la.
4. Edição inline: ela atualiza a descrição da tarefa com dois novos tópicos. Tab + Tab aciona o salvamento.
5. **Clímax:** Sarah fecha o dialog. Hoje re-renderiza: o cartão de foco ainda exibe a tarefa do hero, mas agora com o corpo atualizado visível de relance. Ela não precisa navegar para lugar nenhum — a superfície que a recebeu agora reflete o trabalho que acabou de fazer. Ela pega o café e começa a escrever.

Falha: o salvamento falha → `Toast` do shadcn (variante destructive): "Não foi possível salvar. Tentando novamente." A edição inline é mantida; outro `Enter` tenta novamente.

### Fluxo 2 — Handoff assíncrono (Devon e Mara, equipe remota pequena, meio da tarde)

1. Devon termina de implementar o fluxo de autenticação e marca a tarefa como `done`.
2. Mara, três fusos horários à frente e online durante a sobreposição, abre o Drift.
3. Hoje carrega; o foco de Mara está em seu próprio trabalho de front-end, mas a lista em andamento mostra a tarefa de autenticação de Devon agora marcada como concluída e, abaixo, uma nova tarefa atribuída a ela — "Implementar redirecionamento pós-autenticação" — que Devon definiu ao fazer o checkout.
4. Ela pressiona `f` na linha para marcá-la como seu foco, depois `Enter` para abri-la.
5. **Clímax:** O cartão de foco muda. Sua superfície agora exibe a tarefa de redirecionamento pós-autenticação como o trabalho ativo; a barra lateral de projetos mostra o projeto Auth destacado; o command palette `⌘K` traz como primeiro resultado padrão "Ir para o projeto Auth." O estado do progresso da equipe está *incorporado à sua superfície* — sem thread no Slack para rolar, sem documento de status para ler.

Falha: Devon não havia atribuído a tarefa de continuidade — Mara se auto-atribuiu por engano. Ela pressiona `Esc`, `f` novamente para desfazer o foco e reatribui para Devon. Sem dialog de "tem certeza?"; Drift confia no usuário.
