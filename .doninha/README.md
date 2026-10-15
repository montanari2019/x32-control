# Doninha

O Doninha é um framework para desenvolvimento assistido por IA, projetado para facilitar fases de especificação, planejamento e codificação, focando em qualidade das entregas.

## DONINHA.md

O arquivo `./DONINHA.md` é o **ponto de entrada do workspace**: índice dos repositórios + configuração/políticas dos agentes (`analise.aprovador`, `research.referencias`). Ele **não** guarda síntese do projeto.

O contexto de cada repositório fica em `.doninha/docs/codebase/`, gerado pelo `doninha-project-research`. O `doninha init` sempre cria a pasta `repos/` na raiz do workspace, então a existência dela não diz nada: o workspace é multi-repo quando `repos/` tem ao menos uma sub-pasta de repositório, e aí o contexto vive em `repos/<nome>/.doninha/docs/codebase/`. Com `repos/` sem nenhuma sub-pasta (só o `README.md`), o contexto fica na raiz.

- `OVERVIEW.md` — papel do repo no negócio, apelidos e status, quem consome o quê, e o **mapa de módulos**. É por aqui que os agentes começam.
- `modules/<slug>.md` — capacidades de negócio de cada módulo (quando o repo tem 4+ módulos separáveis).
- `stack.md`, `structure.md`, `architecture.md`, `conventions.md`, `integrations.md`, `concerns.md`, `testing.md`, `risks.md` — o detalhe técnico.

## Estrutura do pacote

O pacote do Doninha entrega os seguintes diretórios em `./`:

- **agents/**: As 3 definições de agente (`*.agent.md`) de apoio ao fluxo (veja a seção [Agentes](#agentes)).
- **skills/**: Skills especializadas carregadas sob demanda — formatação de cada artefato (`doninha-artifact-*`), passes de review (`doninha-reviewer-*`), práticas de código/testes/UX e geração de diagramas. Inclui também as três skills orquestradoras autônomas, que conduzem o trabalho de ponta a ponta: `doninha-analisar` (análise → PRD + PBIs), `doninha-desenvolver` (PBI → código commitado) e `doninha-code-review` (mudança pronta → `review.md` + veredito). Veja [Fluxo das skills](#fluxo-das-skills).
- **templates/**: Templates de artefato (`task-template`, `spec-template`, `status-template.yml`, checklists) para que as skills e agentes gerem arquivos em formato padronizado.
- **prompts/**: Prompt pré-pronto para montar a base de conhecimento do projeto (`start-doninha`).
- **mcp/**: Configurações de MCP por ferramenta (`claude/` e `vscode/`).

### Estrutura de saída (artefatos no seu projeto)

Conforme você executa as skills, os artefatos são gravados na pasta `.doninha/` do **seu** projeto:

```
.doninha/
├── docs/
│   ├── modules/module_NNN_<nome>/feature_NNN_<nome>/
│   │   ├── status.yml          # fonte da verdade do fluxo (estágios + estado dos PBIs)
│   │   ├── structure.md        # decomposição da feature em PBIs
│   │   └── pbis/{slug}/
│   │       ├── business.md  technical.md  spec.md  plan.md
│   │       ├── review.md  learnings.md
│   │       └── tasks/task-NN.md
│   ├── discovery/explorations/discovery_<slug>.md
│   ├── codebase/   # contexto do repo: OVERVIEW.md, modules/<slug>.md, arquitetura,
│   │               # convenções, stack, integrações, concerns, testes
│   │               # (multi-repo: em repos/<nome>/.doninha/docs/codebase/)
│   │               # veja repos/README.md na raiz do workspace
│   ├── architecture/  # ADRs, C4, ERDs
│   └── product/    # contexto de negócio
├── quick/NNN-<slug>/{TASK.md, SUMMARY.md}   # artefatos do Quick Mode
└── STATE.md        # log de quick tasks concluídas + lições aprendidas
```

> O `status.yml` é a **fonte da verdade** do fluxo e permite retomar o trabalho entre sessões (session handoff). Apenas o agente `doninha-copy-writer` escreve nele.

## Agentes

O Doninha possui **3 agentes**, e você não invoca dois deles: o `doninha-copy-writer` e o `doninha-documentation` são acionados pelas skills. O trabalho de ponta a ponta é conduzido pelas três **skills orquestradoras** (ver [Fluxo das skills](#fluxo-das-skills)).

| Agente | Para que serve | Resultado esperado | Tier de modelo | Modelo Claude sugerido |
|---|---|---|---|---|
| **doninha-copy-writer** | Acionado pelas skills ao final de uma etapa: formata o artefato, persiste com o frontmatter obrigatório e atualiza o `status.yml`. É o **único** que escreve no `status.yml`. Você não o invoca. | Artefato formatado + `status.yml` atualizado | Rápido | Haiku 4.5 |
| **doninha-documentation** | Acionado pelo `doninha-code-review` quando o veredito é APROVADO: compara o implementado com a documentação atual, atualiza só o que mudou e captura aprendizados. Você não o invoca. | `learnings.md` + docs do projeto atualizadas | Equilibrado | Sonnet 4.6 |
| **doninha-quick** | Express lane para mudanças pequenas (≤3 arquivos, ≤1h, causa conhecida, sem novas deps/arquitetura). Pula o fluxo completo. | `quick/NNN-<slug>/{TASK.md, SUMMARY.md}` + commit atômico | Equilibrado | Sonnet 4.6 |

> **Agentes removidos.** `doninha-discovery`, `doninha-structure`, `doninha-business-analyst`, `doninha-technical-analyst`, `doninha-specify`, `doninha-plan`, `doninha-codegen` e `doninha-reviewer` foram removidos: as três skills orquestradoras cobrem as mesmas etapas e passaram a ser o único caminho. Os artefatos e o `status.yml` não mudaram — os mesmos stages continuam sendo gravados, pelas skills. Quem tinha esses agentes instalados os perde no próximo `doninha init`; o substituto de cada um está na tabela do [Fluxo das skills](#fluxo-das-skills).

> **Sobre os modelos:** hoje todos os agentes são entregues com `model: inherit` no frontmatter (`agents/*.agent.md`), ou seja, herdam o modelo da sua sessão. A tabela acima é uma **recomendação** de como configurá-los conforme o equilíbrio entre custo e qualidade. Os tiers genéricos ("raciocínio avançado", "equilibrado", "rápido") servem para mapear em qualquer ferramenta (Claude, Copilot, etc.); a coluna Claude indica o equivalente sugerido na família Anthropic.

## Unidades

Temos configurações específicas com arquivos por unidade, para que os agentes possam adaptar suas entregas e se especializar de acordo com as necessidades de cada unidade.

## Gates de qualidade (opcional — desligados por padrão)

Os agentes sempre rodam o gate local rápido: build, lint e testes do próprio projeto, antes de cada commit e no fechamento da PBI. Dois gates extras — **SonarQube** e **complexity check** — usam o servidor MCP `doninha-mcp` com Docker e costumam duplicar o que o pipeline do time já faz. Por isso vêm **desligados** e são ligados por projeto.

**Como ligar**

- No `doninha init`, responda **sim** à pergunta "Habilitar gates de qualidade nos agentes?". A CLI grava `.doninha/integrations/quality-gate.yml`.
- Ou crie o arquivo depois, à mão:

  ```yaml
  sonar: true        # Gate 5 — SonarQube no fechamento da PBI
  complexity: true   # Gate 3 — complexity-check por task, antes do commit
  # sonar_project_key: meu-projeto   # opcional; padrão: sonar.projectKey do sonar-project.properties
  ```

Arquivo ausente ou chave em `false` = gate **desativado**: os agentes o listam como `DESATIVADO` no relatório e seguem. A presença de `sonar-project.properties` **não** liga o gate; só o arquivo acima liga.

**Requisitos só quando ligado**

- Docker em execução (os dois tools rodam em contêiner).
- Para o Sonar: `SONAR_URL` e `SONAR_TOKEN` (User Token) no ambiente do MCP — `.claude/settings.local.json` (`env`) no Claude Code, `.env` no VSCode — e um `sonar-project.properties` na raiz do repositório.

O `doninha-mcp` continua instalado mesmo com os gates desligados: ele também renderiza os diagramas PlantUML dos agentes.

## Configurar o MCP do Azure DevOps

A integração com Azure DevOps é **opcional** — sem ela, o Doninha opera 100% local-only. Ela usa o server oficial `@azure-devops/mcp` (Microsoft), com autenticação diferente por ferramenta.

### Fluxo assistido (`doninha init`)

Ao rodar `doninha init`, responda **"sim"** para "Usa Azure DevOps?" e informe:

1. **Projeto**
2. **Personal Access Token (PAT)** — perguntado apenas se o VSCode estiver entre as ferramentas selecionadas (o Claude não precisa de PAT)

A **organização** não é perguntada: ela vem com um valor padrão fixo no fluxo de
`init`. Para apontar para outra organização, edite `org:` em
`.doninha/integrations/azure-devops.yml` e o argumento da org nos `mcp.json`
(`.mcp.json` e/ou `.vscode/mcp.json`).

O `init` já grava:

- `.doninha/integrations/azure-devops.yml` com `org`/`project` preenchidos (nomes de work-item, estados e custom fields ficam comentados — são descobertos em runtime, ou você pode mapeá-los manualmente depois)
- o server `azure-devops` no `.mcp.json` (Claude, autenticação interativa) e/ou `.vscode/mcp.json` (VSCode, `--authentication pat` + `envFile`)
- (somente se VSCode) `PERSONAL_ACCESS_TOKEN=<base64>` no `.env`, garantindo que `.env` está no `.gitignore`

Responder **"não"** não cria nenhum arquivo relacionado ao Azure DevOps — o Doninha segue local-only.

### Autenticação por ferramenta

- **Claude Code**: autenticação **interativa** — a primeira chamada de uma tool do Azure DevOps abre o login pelo navegador (MSAL). Não precisa de AZ CLI nem de PAT.
- **VSCode + Copilot / ambientes headless / CI**: autenticação via **PAT**, enviado como `PERSONAL_ACCESS_TOKEN` (base64 de `email:pat`) via `.env`.

### Configuração manual do PAT (sem passar pelo `init`, ou para CI/headless)

1. Crie um PAT no Azure DevOps (**User Settings → Personal Access Tokens**) com o escopo mínimo recomendado: **Work Items (Read & Write)**.
2. Gere o `base64` de `email:pat` (qualquer e-mail não vazio serve — só o PAT importa):

   - **Linux/macOS**: `echo -n "seu-email@exemplo.com:SEU_PAT" | base64`
   - **Windows (PowerShell)**: `[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("seu-email@exemplo.com:SEU_PAT"))`

   ⚠️ Garanta que o comando **não quebra linha** no resultado — um token com quebra de linha corrompe a autenticação.

3. Adicione ao `.env` do projeto (nunca versionado — confirme que `.env` está no `.gitignore`):

   ```
   PERSONAL_ACCESS_TOKEN=<base64 gerado acima>
   ```

4. No `.vscode/mcp.json`, o server `azure-devops` deve apontar `envFile: "${workspaceFolder}/.env"` e usar `--authentication pat`.

> O segredo (PAT/base64) **nunca** deve ir para um arquivo versionado. Sempre em `.env`, sempre no `.gitignore`.

## Fontes de contexto do projeto

O projeto pode apontar as bases de conhecimento que o time já mantém — um servidor MCP, uma pasta de arquivos no disco, um endereço web — e os agentes passam a consultá-las durante os passos.

Há dois caminhos. Nenhum guarda segredo: quem clona o projeto herda as fontes e providencia o próprio acesso na máquina dele.

| Caminho | Quando usar |
| --- | --- |
| **Skill publicada no Hub** | A base é mantida por uma unidade e serve a vários projetos. **É o caminho preferido.** |
| **Declaração no arquivo do projeto** | A fonte só interessa a este projeto. Segue valendo, e não foi depreciada. |

### Publicar uma fonte como skill (caminho preferido)

Publique no Hub uma skill cujo **nome comece com `context-source-`** — por exemplo `context-source-base-do-time`. A `description` diz **para que a base serve**: é dela que sai a escolha de qual fonte consultar. O **corpo** da skill diz **como se pergunta** àquela base, com o espaço que a explicação precisar — vocabulário, exemplos de pergunta, o que ela cobre e o que não cobre.

Escrita uma vez, por quem conhece a base, ela chega sozinha aos projetos da unidade pela entrega que já existe, e `doninha unit sync` propaga a correção. Não há gerador nem esqueleto: é uma skill como qualquer outra.

A origem não importa, só o prefixo: uma fonte publicada por **outra unidade** — ou escrita à mão dentro deste projeto — conta igual.

> **A convenção não é validada em lugar nenhum.** Nome fora do prefixo faz a fonte não ser reconhecida **em silêncio** — nenhum aviso, nem no Hub nem na CLI. Confira o nome antes de publicar.

### Silenciar uma fonte neste projeto

Fonte que ninguém aqui alcança entra na lista do frontmatter do `DONINHA.md`:

```yaml
fontes_de_contexto:
  silenciadas: [context-source-base-do-time] # `base-do-time` nomeia a mesma fonte
```

Cada item é o **nome da fonte**, com ou sem o prefixo `context-source-` — as duas formas valem, e é o que permite silenciar também uma fonte que só existe no arquivo de declaração, sem skill publicada.

O nome sai por inteiro: a skill deixa de ser aberta, e a entrada de mesmo nome no arquivo de declaração também deixa de ser consultada — esta a própria CLI já tira do bloco que injeta. Como está no `DONINHA.md`, a decisão fica versionada e visível no diff.

### Fluxo assistido (`doninha init`)

Responda **"sim"** para "Declarar uma fonte de contexto do projeto?" e informe nome, tipo (`mcp`, `pasta` ou `web`), localização, para que a fonte serve e como se pergunta a ela. Os cinco campos são obrigatórios.

Responder **"não"** não cria arquivo nenhum e não bloqueia nada — o projeto segue funcionando exatamente como antes.

### Declarar depois, ou declarar várias

Crie ou edite `.doninha/integrations/context-sources.yml`:

```yaml
sources:
  - name: base-do-time
    type: mcp
    location: base-do-time
    purpose: 'Regras de negócio e glossário do produto.'
    usage: 'Pergunte em português, uma pergunta por vez, citando o módulo.'
  - name: docs-negocio
    type: pasta
    location: ./docs/negocio
    purpose: 'Decisões históricas do produto.'
    usage: 'Procure pelo nome do módulo no título do arquivo.'
```

Editar ou remover uma declaração vale no **passo seguinte**, sem reiniciar a CLI. Declaração incompleta é ignorada com aviso, e as demais seguem valendo.

Uma skill publicada e uma entrada do arquivo com o mesmo nome são a mesma fonte, e **prevalece a skill**: declare no arquivo enquanto a unidade não publica, e a skill assume quando publicar, sem ninguém apagar nada.

O Doninha **não** instala a fonte, **não** guarda credencial, **não** escreve nela e **não** confere se ela está no ar antes de usar. As regras de consulta — qual fonte escolher, o que vale quando o código e a fonte discordam, o que fazer quando a fonte não responde, como o conteúdo entra no artefato — valem igual para os dois caminhos e estão na skill `doninha-context-sources`.

## Fluxo das skills

O trabalho é conduzido por três **skills orquestradoras autônomas**. Você as invoca direto no chat, elas conduzem o próprio fluxo em etapas e mantêm o próprio estado de sessão — não é preciso escolher agente a cada passo. Use **um chat por sessão** para preservar a janela de contexto; o `status.yml` registra o estado e permite retomar de onde parou.

| Skill | Entrada | Saída |
|---|---|---|
| **doninha-analisar** | Uma oportunidade vaga (modo DESCOBERTA), um problema já entendido (modo SOLUÇÃO) ou um card/requisitos já escritos (modo EXPRESS) | `feature.md` (PRD) + `decisions.md` + PBIs validados por INVEST — no express, um único PBI a partir do card |
| **doninha-desenvolver** | Um PBI pronto (local ou work-item do Azure DevOps) | `spec.md` + `task.md` + código implementado em commits atômicos, com gate local de testes e qualidade (Sonar/complexity só se habilitados) **e review aprovado** — ou o relatório do que ficou aberto após 2 rodadas |
| **doninha-code-review** | Uma mudança pronta — o PBI recém-implementado, ou uma branch/PR/working tree avulsa | `review.md` (ou `.doninha/reviews/`) + veredito APROVADO / NECESSITA CORREÇÕES |

```
doninha-analisar → doninha-desenvolver ──► doninha-code-review ──► doninha-documentation
                         ▲                        │
                         └── NECESSITA CORREÇÕES ─┘   (máx. 2 rodadas, depois volta pra você)
```

O ciclo do meio roda sozinho: o `doninha-desenvolver` chama o review no fechamento, aplica as
correções nas tasks apontadas e manda revisar de novo. A PBI só é marcada como concluída — e o
card só é finalizado — depois do veredito.

### Nível Feature (uma vez por feature)

1. **doninha-analisar** — traga a ideia crua ou o problema já entendido. A skill valida se faz sentido, explora o problema, produz o PRD e decompõe em PBIs atômicos validados por INVEST.

### Nível PBI (repetir o ciclo abaixo para cada PBI)

2. **doninha-desenvolver** — antes de escrever a spec, junta numa rodada só as dúvidas técnicas que o código não decide sozinho (ou decide de dois jeitos diferentes) e pergunta, com as opções citando `arquivo:linha`; as respostas ficam registradas em `spec.md`. Depois gera `spec.md` + `task.md` e implementa task por task (RED → GREEN → VERIFY → COMMIT), com gate local de qualidade antes de cada commit (Sonar e complexity só quando habilitados em `.doninha/integrations/quality-gate.yml`). No fechamento, dispara o review e conduz o ciclo até o veredito.
3. **doninha-code-review** — roda os 7 passes → `review.md` + veredito. Você não precisa chamá-lo ao fim do desenvolvimento; ele continua invocável direto para revisar uma branch, um PR ou um diff avulso.
4. **doninha-documentation** — o `doninha-code-review` o aciona automaticamente quando aprova: atualiza a documentação do projeto e registra `learnings.md`. Não é um passo que você dispara.

O `doninha-code-review` dimensiona a revisão antes de começar: mudança pequena e sem sinal de risco roda no perfil leve; qualquer sinal de risco — autenticação, entrada externa, segredo, dinheiro, migração, deleção — sobe o perfil por menor que seja o diff, e o perfil escolhido vai declarado no relatório. Ele executa os passes 1–2 e despacha os passes 3–5 para subagentes em paralelo, e **nunca altera código** — os achados voltam para o `doninha-desenvolver`. Em modo PBI ele grava `review.md` pelo `doninha-copy-writer` e atualiza o `status.yml`; em modo diff avulso grava direto em `.doninha/reviews/`, sem tocar no `status.yml`. Rodadas de review se acumulam no mesmo arquivo, então o histórico do que foi achado e corrigido fica preservado.

**O relatório traz o que bloqueia, não um inventário.** Achado `suggestion` não é emitido por padrão e `minor` tem teto — nos reviews antigos dois terços do volume era ruído que não reprovava nada e enterrava os dois achados que importavam. Peça o relatório completo quando quiser o resto.

**A partir da segunda rodada, o que reprova é mais estreito** — de propósito. Só bloqueiam os achados que ficaram abertos, os que a correção introduziu, e `critical` novo em qualquer lugar. Um `major` novo em código que a rodada anterior já tinha revisado é registrado como observação, não devolve o trabalho: sem isso cada correção compra uma lista nova de motivos para corrigir, e o ciclo nunca fecha. O teto é de **2 rodadas automáticas**; se ainda houver achado aberto, a PBI fica pausada com o relatório do que faltou e a decisão volta para você.

> Ao final de **cada** etapa que produz artefato canônico, o `doninha-copy-writer` formata o artefato e atualiza o `status.yml` — você não o invoca manualmente, a skill o aciona.
>
> **Dica:** após cada geração de código, crie um chat novo, apague o antigo e dê reload no VSCode. O VSCode usa memória em cache, e isso pode fazê-lo perder o contexto do projeto. Um chat novo + reload limpa esse cache e garante que ele use o contexto atualizado.

## Workflow Simplificado (cenários simples)

Nem toda mudança precisa do fluxo completo. Escolha o fluxo pelo tamanho e risco da mudança:

| Cenário | Critério | Fluxo |
|---|---|---|
| **Quick Mode** | ≤3 arquivos, ≤1h, causa conhecida, sem novas deps/arquitetura | `doninha-quick` |
| **Pipeline completo** | Feature com múltiplos PBIs, regras de negócio ou decisões de arquitetura | discovery → structure → estimate → (por PBI) business → technical → specify → plan → codegen → reviewer → documentation |

### Quick Mode (`doninha-quick`)

Para alterações cirúrgicas — bug fix com causa conhecida, ajuste de config, bump de dependência, pequeno tweak de UI. Selecione o agente `doninha-quick` e escreva o prompt seguindo boas práticas de prompt engineering. O agente:

1. Reformula a tarefa em uma frase e checa os guardrails (≤3 arquivos, ≤1h, sem novas deps/arquitetura, causa conhecida).
2. Apresenta um **bloco de pré-implementação** (Arquivos / Abordagem / Verificação) e **aguarda sua aprovação**.
3. Faz a mudança cirúrgica (sem refactor, sem novas abstrações, casando com o estilo existente).
4. Verifica (gate `quick` + testes dos arquivos tocados) e propõe um commit atômico.
5. Persiste em `.doninha/quick/NNN-<slug>/` e registra a tarefa no `.doninha/STATE.md`.

Se durante a execução o escopo crescer (mais de 3 arquivos, surge decisão de arquitetura ou nova dependência), o agente **para** e recomenda migrar para o fluxo completo via `doninha-analisar`.
