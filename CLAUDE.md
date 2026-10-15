# x32-control

## Layout do workspace

- Raiz (workspace): `.claude/`, `.doninha/`, `.github/`, `.vscode/`, `.specs/`, `docs/`, `logs/`, `CLAUDE.md`, `DONINHA.md`.
- App React Native: `repos/x32-control/` (src, android, ios, package.json, node_modules, etc.). Rodar yarn/npm/tsc/jest/eslint a partir daí.
- `logs/` fica na raiz do workspace, não dentro do app.

## Logs (obrigatório)

Ao fim de TODA execução de task (implementação, fix, debug, validação), registrar um log técnico em `logs/` na raiz do projeto, seguindo a skill `creating-logs` (`.claude/skills/creating-logs/SKILL.md`).

- Arquivo: `logs/YYYY-MM-DD_HH-mm-SS-desc-curta.txt`
- Formato chave-valor, frases curtas, sem stack trace bruto nem hashes longos:

```txt
TÍTULO EM CAIXA ALTA

Contexto: [problema/tarefa em 1 frase]
Causa: [causa técnica]
Ação: [mudanças feitas]
Resultado: [OK | Erro | Pendente + síntese]
Arquivos: [principais]
Validação: [lint/typecheck/test/manual]
Pontos atenção: [riscos/pendências, só se houver]
```

Criar o log antes de dar a task por encerrada. Não logar perguntas simples nem leituras sem mudança de estado.

## Memória

Para gravar/consultar exemplos, decisões, feedbacks e referências persistentes, usar o agente `memories` (`.claude/agents/memories.md`).
