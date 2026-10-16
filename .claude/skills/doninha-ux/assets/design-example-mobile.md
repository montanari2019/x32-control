---
name: Quill
description: Companheiro diário de escrita. Calmo, intencional, dark-mode por padrão. Sem sequências, sem gamificação.
colors:
  surface-base: '#FAF9F7'
  surface-raised: '#FFFFFF'
  ink-primary: '#1A1B1F'
  ink-secondary: '#6B655A'
  ink-disabled: '#B5AFA5'
  accent: '#A87434'
  border-hairline: '#E8E4DD'
  surface-base-dark: '#1A1B1F'
  surface-raised-dark: '#23252B'
  ink-primary-dark: '#F0EDE8'
  ink-secondary-dark: '#A39E94'
  ink-disabled-dark: '#5E5A53'
  accent-dark: '#D4A574'
  border-hairline-dark: '#2E3036'
typography:
  title:
    note: 'Nativo de plataforma — iOS Title 1 · Android Headline Small'
  body:
    note: 'Nativo de plataforma — iOS Body · Android Body Large'
  meta:
    note: 'Nativo de plataforma — iOS Footnote · Android Body Small'
rounded:
  sm: 6px
  md: 12px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
---

## Marca & Estilo

O Quill foi concebido na contramão dos aplicativos de hábito contemporâneos. Onde a maioria dos produtos usa o calendário do usuário como arma — com contadores de sequência e notificações de reengajamento —, o Quill insiste em algo mais silencioso: um prompt diário, um lugar para escrever e a garantia implícita de que o registro de hoje é suficiente. Aparecer é o ponto, não a sequência.

A linguagem visual segue o mesmo princípio. Superfícies calmas em branco quente (light) ou tinta profunda (dark, o padrão). Espaço generoso para respirar. Nenhuma cor cromática disputando atenção, exceto um único tabaco quente que sinaliza salvar-e-enviar. O texto em primeiro lugar. Mão no papel, não vibração na tela.

## Cores

A paleta é contida por escolha — uma superfície de escrita não deve competir com o que está sendo escrito.

- **Branco Quente (`#FAF9F7`)** é a tela principal no modo claro. Levemente aquecido para reduzir a fadiga visual e evitar que a superfície pareça clínica.
- **Tinta Profunda (`#1A1B1F`)** é a tela no modo escuro e a cor primária do texto no modo claro. O Quill assume dark mode por padrão porque a maior parte da escrita acontece à noite.
- **Tabaco (`#A87434` claro / `#D4A574` escuro)** é a única cor cromática. Usada exclusivamente para o indicador de salvamento e a ação primária — nunca como decoração, nunca para badges de estado.
- **Hairline (`#E8E4DD` claro / `#2E3036` escuro)** separa itens de lista com o menor contraste possível. Qualquer peso maior parece UI, não papel.

Evite: preenchimentos vermelhos para erro (Quill é um diário, não um formulário), gradientes (a superfície é papel) e variantes de destaque saturadas — um único accent, usado com parcimônia.

## Tipografia

As convenções de plataforma são a especificação. iOS usa Title 1 / Body / Footnote; Android usa Headline Small / Body Large / Body Small. Dynamic type respeitado em todos os níveis — a maior configuração de acessibilidade ainda deve renderizar de forma legível, sem truncamento.

Títulos são raros. O prompt de hoje é definido em `title`; todo o restante é `body` ou `meta`. Sem tamanhos de display, sem rótulos em caixa alta.

## Layout & Espaçamento

Escala: 4 / 8 / 12 / 16 / 24 / 32 px. Os maiores espaçamentos ficam entre superfícies principais; os menores, entre elementos estreitamente relacionados. O ritmo vertical segue uma regra rígida: o compositor respira, os itens de lista não.

As margens para mobile seguem as convenções de plataforma (iOS 16pt, Android 16dp). Coluna única sempre; pilhas modais com um único nível de profundidade, nunca dois.

## Elevação & Profundidade

O Quill evita elevação como recurso visual. Cartões e superfícies do compositor ficam em `surface-raised`, distinguidos de `surface-base` apenas pelo tom. Sombras são reservadas para o raro momento de metáfora física literal — nunca para hierarquia. A hierarquia vem do layout e da tipografia, não da sombra.

## Formas

`rounded/sm` (6px) para inputs, linhas de lista e superfícies pequenas. `rounded/md` (12px) para cartões e o compositor. Nada totalmente arredondado; sem pílulas, sem círculos perfeitos para superfícies. A estética é papel-com-cantos-suaves, não pílula-de-botão-iOS.

Imagens seguem exatamente os cantos do contêiner.

## Componentes

- **Cartão de prompt** — `surface-raised`. Um por dia. O prompt de hoje em `title`. Toque para abrir o compositor. Sem ícone, sem decoração; o próprio prompt é o affordance.
- **Compositor** — Visualização de texto em tela cheia. Campo de texto limpo, preenchimento vertical generoso, indicador de salvamento em linha única no cabeçalho.
- **Indicador de salvamento** — Somente texto. Usa `ink-secondary`, nunca um ícone de marca de verificação, nunca um badge colorido.
- **Linha de registro** (Biblioteca) — Data em `meta`, primeira linha do corpo em `body` (truncada a uma linha). Apenas divisor hairline, sem preenchimento.
- **Linha de configurações** — Rótulo à esquerda, valor ou chevron à direita. Accent tabaco apenas em confirmações destrutivas.

## O que Fazer e o que Evitar

| Fazer | Evitar |
|---|---|
| Cor de destaque única, usada com parcimônia em salvar e ação primária | Codificar por cor sentimento, humor ou categoria |
| Indicadores de estado apenas em texto (`Salvo.`) | Iconografia para estado (✓, ⚠, ●) |
| Divisores hairline no menor contraste legível | Sombras em cartões, preenchimentos com gradiente, preenchimentos com accent atrás do texto |
| Ritmo vertical generoso no compositor | Comprimir para caber mais conteúdo na tela |
| Respeitar as convenções de navegação da plataforma | Substituir a navegação nativa por drawer ou hambúrguer customizado |
