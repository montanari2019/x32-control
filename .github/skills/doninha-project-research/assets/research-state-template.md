# Estado da pesquisa — <repo>

Estado de trabalho do `doninha-project-research` para este repositório. Regenerável, nunca um contrato: nenhum leitor a jusante depende dele, e a ausência é normal. Leia-o **primeiro** quando existir, e retome a partir dele em vez de recomeçar.

```yaml
repo: <nome do repo, ou '.' em workspace single-repo>
commit: <o commit capturado no Step 0.4 desta passagem, nunca rederivado aqui>
pass: <n>
inventory:
  tracked_files: <n>
  top_dirs: []
  extensions: []
  declared_units: []
  units_source: <pom.xml <modules> | settings.gradle | package.json workspaces | pnpm-workspace.yaml | listagem>
done: []
adopted: []
pending: []
completed: []
modules:
  done: []
  pending: []
  skipped: []
claims_pending: []
index_updated: false
caps_hit: []
```

## Campos

- **commit** — o `HEAD` da passagem, vindo do Step 0.4. É o que permite um refresh barato: quando o `HEAD` atual difere, rode um diff limitado e reprocesse só o que ele tocou (ver `SKILL.md` § Retomada), em vez de invalidar tudo. Na retomada, o Step 0.4 roda de novo e este campo passa a valer a passagem que gravou os arquivos — o rastro no cabeçalho de cada arquivo é o da passagem que o escreveu, e os dois só coincidem quando a passagem foi uma só.
- **inventory** — o resultado do Step 0.5, inline. Existe para que uma retomada **não repita a varredura**. `declared_units` é a fonte do mapa de módulos e da verificação de existência de módulo na reconciliação.
- **done** / **pending** — nomes de arquivo de saída (`stack.md`, `OVERVIEW.md`, …). Um arquivo em `done` para o `commit` corrente é *fresh* e é pulado **sem ser lido**.
- **adopted** — arquivos que já estavam no disco quando este estado foi criado, sem passagem registrada que os explique (o caso de um repositório pesquisado por uma versão anterior da skill). Contam como *fresh*, mas ninguém verificou: a skill diz quais são ao fechar a passagem e um refresh de qualquer um deles fica disponível sob demanda.
- **completed** — arquivos que estavam `desatualizado` e tiveram as seções ausentes derivadas e inseridas, depois de a oferta ser aceita (ver `SKILL.md` § Retomada). Cada entrada carrega o arquivo **e** as seções que foram preenchidas (`testing.md: [Matriz de cobertura]`) — só o nome do arquivo não responde o que foi completado, que é a pergunta que uma passagem seguinte faz. A partir daí o rastro do arquivo é o da passada de completação, não o da passagem que escreveu o resto: é o que impede a detecção de reclassificá-lo como desatualizado na passagem seguinte.
- **modules.skipped** — cada entrada carrega o motivo (`core: biblioteca compartilhada`, `common-data: agrupado em core.md`). Sem o motivo, uma passagem futura repesquisa o que já foi deliberadamente descartado.
- **modules.pending** — os módulos que ficaram com `Doc = —` no mapa. É a lista que a skill imprime ao fechar a passagem.
- **claims_pending** — claims dos docs de referência que ficaram fora do orçamento de 20 por passagem.
- **index_updated** — a passagem não está concluída enquanto for `false`. Torna o check de conclusão do Step 10 verificável em vez de apenas escrito.
- **caps_hit** — qual teto foi batido, quando foi. Vale tanto para um cap de entrada quanto para o **teto de tamanho** de um arquivo que, já reduzido, ainda ficou acima do limite do template — a regra é que nada chegue ao disco no tamanho original, não que caiba a qualquer preço. É uma constatação, não uma falha: registra e segue. Um teto nunca é elevado durante a passagem.
