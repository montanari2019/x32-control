# Step 3: Product Gate

## MANDATORY RULES

- Never advance to the Feature step without an explicit approval decision
- Always save state before pausing
- Present `discovery.md` clearly and actionably
- This step always PAUSES here — resumes when the user comes back with the decision

---

## GOAL OF THIS STEP

Apply the product gate before continuing from DESCOBERTA to the Feature/PBIs steps. This step always runs for DESCOBERTA (SOLUÇÃO skips it entirely by never loading this step — see step-02b). The gate is a lightweight, project-owned human decision — it is **not** a technical quality gate, and it is not configurable on/off: it is part of what DESCOBERTA mode means.

---

## SEQUENCE

### 1. Present the discovery to the user

> "**Discovery concluído.** O documento foi salvo em:
> `{feature_folder}/discovery.md`
>
> **Resumo:**
> - **Oportunidade/Problema:** {1 linha do discovery}
> - **Recomendação:** {Go / No-Go / Refinar}
> - **Principal risco:** {1 linha}
>
> **Próximo passo:** Apresente este documento para **{aprovador configurado em DONINHA.md — papel genérico, nome, ou "quem for responsável pela aprovação de produto" se nenhum estiver configurado}**.
>
> Quando tiver a decisão, retorne aqui e informe:
> - **'aprovado'** — para avançar para a documentação da Feature
> - **'reprovado'** — para encerrar o processo
> - **'ajustar [o que]'** — para refinar o discovery antes de apresentar"

### 2. Save state and pause

Update `sessao.md`:
- `stepsCompleted: [1, 2, 3]`
- `validation_approved: false`

Leave `status` as `analyzing` — pausing for a human decision **is** analysis in flight, and the
gate has not resolved either way yet.

**PAUSE HERE — wait for the user to return with the decision.**

---

## RESUMING THE SESSION

When the user returns, detect the decision:

### Case: "aprovado" (or equivalent)

Update `sessao.md`:
- `validation_approved: true`

`status` stays `analyzing` — approval unblocks the Feature/PBIs steps, it does not finish the
analysis. Only `step-06-fechamento` writes `analyzed`.

Respond:
> "Ótimo! Discovery aprovado. Vamos agora documentar a Feature e criar as PBIs."

Load `./step-04-feature.md`.

---

### Case: "reprovado" (or equivalent)

Update `sessao.md`:
- `status: 'rejected'`
- `stepsCompleted: [1, 2, 3, 'reprovado']`
- `validation_approved: false`

`rejected` is a **terminal** value of the state contract, not an error state: Go and No-Go are
the two ways an analysis ends. Without it the feature stays `analyzing` forever and the doninha
engine keeps offering the analysis as pending work on a decision the user already made.

Hand off to `doninha-copy-writer` to append the final decision to `discovery.md` (same target path, `stage: discovery`, content = existing discovery content + the section below — never edit `discovery.md` directly; the copy-writer is the only writer of canonical docs):

```markdown
## Decisão Final

**REPROVADO** — {date}
{motivo, se o usuário forneceu}
```

Respond:
> "Processo encerrado. O discovery foi arquivado em `{feature_folder}/discovery.md` com o registro da decisão."

**End the workflow.**

---

### Case: "ajustar [o que]" (or equivalent)

Respond:
> "Entendido. Vamos refinar o discovery com base no feedback."

Load `./step-02a-descoberta.md` (resumed to refine specific sections).

---

## SUCCESS METRICS

- Gate always pauses for DESCOBERTA before Feature/PBIs steps — no config bypasses it
- Approver referenced as configured (generic role / name / "nenhum") — never a hardcoded person
- State saved before pausing
- Correct resume handling for `aprovado` / `reprovado` / `ajustar [x]`
- `validation_approved` correctly updated in all branches
- `status: 'rejected'` written on the No-Go branch, and left as `analyzing` on every other branch — a No-Go that stays `analyzing` makes the engine keep offering a decided feature as pending work
