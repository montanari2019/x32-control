# repos/

Pasta dos repositórios deste workspace Doninha.

Coloque aqui, lado a lado, os repositórios que compõem o produto — clonados pelo `doninha init` ou manualmente com `git clone`.

```
repos/
├── minha-api/
├── meu-front/
└── README.md
```

## Índice

Cada repositório é listado em `DONINHA.md`, na raiz do workspace, na seção delimitada pelos marcadores `doninha:repos:start` e `doninha:repos:end`. Essa seção pertence ao Doninha: quem escreve nela é o `doninha init` (a lista de repositórios) e a skill `doninha-project-research` (a descrição de cada um e, depois da pesquisa completa, os sub-bullets com o mapa de módulos do repositório). Não edite à mão, e não mexa nos marcadores.

Depois de adicionar um repositório manualmente:

1. Rode `doninha init` novamente para reindexar o `DONINHA.md`.
2. Rode a skill `doninha-project-research` para preencher a descrição de cada repositório.

> **Atenção ao reindexar.** `doninha init` é uma reinstalação completa, não só um reindex: ele sobrescreve as skills instaladas e repergunta as configurações. Quando ele perguntar se deseja sobrescrever o `DONINHA.md` existente, responda **não** — sobrescrever descarta as descrições já preenchidas. E não use `doninha init --force` para reindexar: `--force` sobrescreve o `DONINHA.md` sem perguntar, apagando o índice e as políticas do time.

## Workspace de repositório único

Esta pasta pode não conter nenhum repositório — só este `README.md`. Nesse caso o contexto do código vive em `.doninha/docs/codebase/` na raiz do workspace, e não em `repos/<nome>/.doninha/docs/codebase/`.
