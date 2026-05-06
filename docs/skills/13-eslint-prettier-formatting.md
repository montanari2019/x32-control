# 13 - ESLint, Prettier e formatacao

## Objetivo
Padronizar configuracoes e uso de ESLint/Prettier, incluindo regras gerais de identacao e estilo, para manter o codigo consistente no projeto.

## Configuracao base
- ESLint deve ser a fonte principal de regras de qualidade e padrao de codigo.
- Prettier deve cuidar apenas da formatacao (espacos, quebras de linha, identacao).
- Evite conflitos: desative regras do ESLint que conflitem com o Prettier usando `eslint-config-prettier`.

## Padroes de formatacao
- Use 2 espacos para identacao.
- Use LF como fim de linha.
- Use aspas simples em JS/TS e aspas duplas apenas quando necessario.
- Sempre inclua trailing commas em multiplas linhas.
- Mantenha linhas com no maximo 100 caracteres quando possivel.

## Regras recomendadas (geral)
- `semi`: sempre usar ponto e virgula.
- `quotes`: `single` com `avoidEscape`.
- `comma-dangle`: `always-multiline`.
- `object-curly-spacing`: `always`.
- `array-bracket-spacing`: `never`.
- `indent`: 2 espacos com `SwitchCase: 1`.

## Integracao ESLint + Prettier
- Garanta `prettier/prettier` ligado para falhar no lint quando formatacao estiver errada.
- Rode `eslint --fix` antes de commits.
- Rode `prettier --check` apenas em CI, quando necessario.

## Boas praticas
- Use editorconfig e format on save no editor.
- Evite formatacao manual: sempre rode o formatter.
- Se precisar excecao, use `// eslint-disable-next-line` com justificativa curta.

## Onde configurar
- ESLint: `.eslintrc.js`
- Prettier: `.prettierrc` ou `prettier.config.js`
- EditorConfig: `.editorconfig`
