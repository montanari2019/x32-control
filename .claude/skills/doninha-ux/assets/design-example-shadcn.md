---
name: Drift
description: Rastreador de tarefas focado para fundadores solo e times assíncronos pequenos. shadcn/ui no Next.js + Tailwind; este DESIGN.md especifica apenas o delta da camada de marca.
colors:
  # Sobrescritas de marca sobre os padrões shadcn. Todos os tokens não listados herdam
  # do shadcn (background, foreground, muted, muted-foreground, popover,
  # popover-foreground, card, card-foreground, border, input, ring, destructive).
  primary: '#0F4C81'
  primary-foreground: '#FFFFFF'
  accent: '#F59E0B'
  accent-foreground: '#1A1208'
  primary-dark: '#5C8AC2'
  primary-foreground-dark: '#0A1A2A'
  accent-dark: '#FBC470'
  accent-foreground-dark: '#1A1208'
typography:
  # Body, label e muted herdam do shadcn (Geist Sans). Somente display é sobrescrito.
  display:
    fontFamily: 'Instrument Serif'
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1.15'
    letterSpacing: -0.01em
  display-sm:
    fontFamily: 'Instrument Serif'
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.2'
rounded:
  # Mais fechado que os padrões shadcn — Drift tem leitura mais nítida.
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  # Padrões shadcn / Tailwind herdados; sem sobrescritas.
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  focus-card:
    background: '{colors.accent}'
    foreground: '{colors.accent-foreground}'
    radius: '{rounded.md}'
    border: 'none'
  command-palette-result-active:
    background: '{colors.accent}'
    foreground: '{colors.accent-foreground}'
---

## Marca & Estilo

Drift é um rastreador de tarefas focado para fundadores solo e times assíncronos pequenos. A premissa do produto é que *o trabalho é algo em movimento* — o momentum importa mais do que backlogs perfeitamente organizados, e a ferramenta certa mostra o que você está fazendo *agora* sem exigir que você administre um sistema para encontrá-lo. A expressão de marca segue esse princípio: um momento tipográfico em serif em uma superfície predominantemente sóbria em sans-serif, um único acento quente que significa *isso está ativo*, e contenção visual em todo o resto.

Drift herda integralmente os padrões do shadcn/ui. Este DESIGN.md especifica apenas os deltas da camada de marca — cor primária, cor de acento, tipografia display, cantos ligeiramente mais fechados e um punhado de componentes específicos de marca. Os 80% dos componentes que vêm do shadcn (Button, Card, Dialog, Sheet, Command, Popover, Toast) herdam as especificações visuais do shadcn como estão. Personalizar esses componentes é *explicitamente* contrário à disciplina de marca — os padrões do shadcn são o contrato.

## Cores

A paleta Drift tem duas cores de camada de marca, mais os padrões do shadcn para todo o restante.

- **Primary Navy (`#0F4C81` claro / `#5C8AC2` escuro)** é a cor de marca. Usada em botões primários, itens de nav ativos, sublinhados de link e o indicador de "semana atual". Substitui o `primary` padrão do shadcn.
- **Focus Amber (`#F59E0B` claro / `#FBC470` escuro)** é o acento. Usado exclusivamente para indicar a tarefa ou projeto atualmente em foco — aquele em que você está trabalhando *agora*. Nunca usado para chrome, nunca usado decorativamente, nunca usado em badges de estado. Amber significa "ativo."
- **Todos os outros tokens** (`background`, `foreground`, `muted`, `muted-foreground`, `border`, `input`, `ring`, `card`, `popover`, `destructive`) herdam os padrões do shadcn. Se a marca não justifica sobrescrever um token, ele não é sobrescrito.

Evite: floreios cromáticos, superfícies com gradiente, cores destrutivas customizadas (use as do shadcn), mais de duas cores de marca. A disciplina é duas-cores-e-parar.

## Tipografia

Body / label / caption herdam a escala Geist Sans do shadcn. Somente o papel `display` é sobrescrito pela marca, definido em **Instrument Serif** a 36px (variante pequena em 24px). O momento em serif aparece em:

- Texto hero de empty state nas superfícies de Hoje e de projeto
- Títulos de projeto no cabeçalho de detalhe do projeto
- A saudação "Bem-vindo de volta, {name}" na primeira sessão do dia

Todo o restante permanece em Geist Sans. O serif é uma marca de pontuação, não uma voz padrão.

## Layout & Espaçamento

Escala de espaçamento shadcn / Tailwind herdada como está (escala baseada em 4: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Largura máxima de conteúdo: `max-w-3xl` (768px) — Drift não é um produto de tabelas largas, e forçar uma leitura em coluna única mantém a superfície focada.

Layout de coluna única. Nav lateral em `lg` (1024px+); em viewports menores, a sidebar se torna um sheet acionado pela barra superior.

## Elevação & Profundidade

Herdada do shadcn — sombra sutil em estados hover/active, sem elevação como dispositivo de hierarquia visual. Drift não adiciona nada sobre isso; a disciplina de marca é "as sombras do shadcn estão corretas."

## Formas

Mais fechado que os padrões shadcn: `rounded/sm` (4px) para inputs, `rounded/md` (6px) para cards e botões, `rounded/lg` (8px) para diálogos e o command palette. A nitidez transmite "ferramenta" em vez de "app de consumo." Formas em pílula (`rounded/full`) aparecem apenas em badges de estado.

## Componentes

Drift usa os seguintes componentes do shadcn como estão, sem alterações: `Button`, `Card`, `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Toast`, `Tabs`, `Avatar`, `Separator`. O contrato: não customizar esses.

Componentes com sobrescrita de camada de marca:

- **Button (variante primary)** — preenchimento `{colors.primary}`, texto `{colors.primary-foreground}`, canto `{rounded.md}`. Outras variantes (secondary, outline, ghost, destructive) herdam os padrões do shadcn.
- **Focus card** — Componente customizado Drift. O card "isso é no que você está trabalhando agora" nas superfícies de Hoje e de detalhe do projeto. Preenchimento `{colors.accent}`, sem borda, ligeiramente elevado. Aparece no máximo uma vez por superfície.
- **Command palette result (active)** — Sobrescrita no componente `Command` do shadcn: a linha de resultado destacada/selecionada por teclado usa `{colors.accent}` em vez do token `accent` padrão do shadcn. Reforça "isso é o que vai disparar se você pressionar Enter."

## O que Fazer e o que Evitar

| Fazer | Evitar |
|---|---|
| Herdar os padrões do shadcn para tudo que não está na camada de marca | Sobrescrever tokens de cor do shadcn além de `primary` e `accent` |
| Usar `{colors.accent}` apenas para "ativo / agora / em foco" | Usar accent para estado, chrome ou affordances de hover |
| Tipografia `display` com parcimônia — empty states, saudações hero | Definir texto de corpo em `display` para "deixar mais bonito" |
| Cantos mais fechados que o shadcn (4 / 6 / 8) | Usar os padrões 6/8/12 do shadcn (Drift tem leitura mais nítida) |
| Layouts de coluna única dentro de `max-w-3xl` | Tabelas largas de múltiplas colunas (Drift não é uma planilha) |
