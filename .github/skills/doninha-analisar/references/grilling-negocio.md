# Business Grilling — decision tree, rounds, and the skepticism that makes them worth asking

Reference loaded by [`../steps/step-02b-solucao.md`](../steps/step-02b-solucao.md) (SOLUÇÃO) when the questioning starts. Not used by DESCOBERTA, which explores with techniques from `brain-methods.csv` instead — a nebulous opportunity has no tree to walk yet.

SOLUÇÃO exists for the case where the problem is already understood and what's missing is the decided, written form of the solution. Offering a catalogue of creative techniques there asks the wrong thing: the person does not need help *having* ideas, they need someone extracting from them what they already know and will otherwise leave implicit in the PRD.

---

## The three ideas this file combines

1. **A decision tree with a frontier.** Decisions branch into the decisions that hang off them. The **frontier** is every question whose prerequisites are already settled — the ones askable *now* without guessing at an answer you have not heard. A question that depends on another question still open belongs to a **later round**.
2. **Skeptical facilitation.** Never accept the first answer as sufficient. Push for specificity — who, when, how often, since when. Be direct and a little skeptical, always respectful. No empty praise.
3. **Finding facts is your job; deciding is theirs.** When a frontier question needs a fact about the product or the codebase, go get it yourself and bring it back as a finding. Only *decisions* go to the user.

---

## The tree

The backbone is fixed; the frontier is derived from it plus what is already settled.

```
                  ── ASKED ──
L0  prerequisites — problem, who's affected, constraints        (step-02b §1)
      ↓
L1  the pain — who feels it, how often, what they do today (workaround), what it costs
      ↓
L2  the main flow — the happy path, in business steps
      ↓
L3  business rules — conditions, exceptions, special cases, conflict with an existing rule
      ↓
L4  boundaries — out of scope · pre-mortem · edge cases
      ↓
                  ── DERIVED, NEVER ASKED ──
D1  functional requirements — the capabilities the rules imply
D2  acceptance criteria — how each requirement is verified
D3  size — count D1 × D2, and only if it overshoots, one split question
```

**Dependencies that shape the frontier:** L1 and L2 are independent of each other and can share a round. L3 needs L2 (you cannot name the exception to a flow nobody described). L4 needs L2+L3.

**The tree is a backbone, not a script.** A feature may settle L3 in one answer and spend three rounds on L4. An answer that re-opens a settled node (a rule that contradicts the flow described in L2) pushes that node back to `open` — say so out loud and re-ask it, rather than carrying a contradiction into the PRD.

<critical>THE FRONTIER IS L1-L4 AND NOTHING ELSE. Requirements and acceptance criteria are your OUTPUT, produced from the answers — never questions you put to the user, and never a round of their own. Asking "quais requisitos o sistema precisa ter?" hands back the work the person came here to have done: they described the pain, the flow and the rules precisely so that the requirements would fall out of them. Derive them (see "Derivation" below), write them into the PRD, and let the PRD's own review be where they get corrected.</critical>

<critical>NEVER ask about success metrics — indicator, baseline, target, deadline. Not every feature has a number behind it, and a metric extracted under pressure is invented, which is worse than an absent one. If the person volunteers one, record it; otherwise the PRD's success section says the feature has no metric, and that is a complete answer.</critical>

---

## Round format

A round is **3 to 5 numbered questions**, each with your recommended answer. Then stop and wait.

```
❓ **Q1 — {título curto}**: {pergunta, em PT-BR, específica ao caso; pode incluir alternativas}

➡️ {sua recomendação, com o motivo em uma linha}

---

❓ **Q2 — {título curto}**: {...}

➡️ {...}
```

**Why 3-5 and not the whole frontier, and not one at a time.** One question per message turns a ten-node tree into forty round-trips. The whole frontier at once turns the conversation into a form, and a form gets skimmed. Between three and five, the person answers in one message and still reads every question.

**The `➡️` is mandatory on every question.** It forces you to have an opinion, and correcting a wrong recommendation is far cheaper for the user than composing an answer from nothing. A recommendation you cannot justify in one line is a sign the question is not yet on the frontier.

**Closed decision → `AskUserQuestion`. Justification → always free text.** A justification that becomes a button becomes copy-paste, which is exactly the content the PRD most needs to be real.

---

## Skepticism — what to push back on

- **Vague answers.** "Melhorar a experiência", "tratar o erro adequadamente", "deixar mais rápido" — ask which error, shown to whom, what gets recorded, how much faster than what.
- **The first answer.** Ask once more for the concrete case: "me dá um exemplo real e recente disso acontecendo". Someone who cannot produce one is describing a supposed pain, not an observed one — record it as a supposition, do not promote it to a fact.
- **Numbers with no basis.** A target of "80%" that came from nowhere goes in as `[definir meta]`, never as a number you helped invent.
- **Silent scope.** When an answer implies something is included that nobody stated, name it and ask.

Never decide for the user, and never close a node on your own initiative — you investigate, they conclude.

---

## The inviolable boundary: rule × requirement

- A **business rule** is the domain's **LOGIC**: "when X happens, the system must behave as Y", exceptions and special cases included. It is expected behavior, independent of any screen.
- A **functional requirement** is the concrete **CAPABILITY** the system needs for that logic to exist: "the system must allow/show/calculate X".

"Se o estoque zerar, ocultar o produto" is a rule. "O sistema deve permitir ocultar produtos sem estoque" is the requirement. When the user mixes them — they will — separate them in the synthesis and **show the separation**, so the distinction is learned rather than silently applied.

---

## Drafting — an offer, never an imposition, and only where there is a base

| Node | May you draft? |
| --- | --- |
| L1 pain, L2 flow | No. This is what they observed; a draft tells them what they saw. |
| **L3 business rules** | **No.** There is no solid base yet, and a draft anchors the person on a path they never chose. This is where they think from scratch. |
| L4 out of scope | Offer candidates, explicitly as candidates. Naming a limit is always their judgement. |

A draft is built **only** from what was already said. Inventing a rule inside a draft is the same failure as inventing one directly, with a disguise.

---

## Derivation — what you produce once the frontier empties

The asked part of the tree ends at L4. What follows is **work you do**, silently, from the answers already given. It is not presented as a round, not confirmed item by item, and not turned back into questions: the PRD is where the user sees it, and the PRD's own review is where they correct it.

**D1 — Functional requirements.** Read each business rule and name the concrete capability it implies: "o sistema deve permitir/exibir/calcular X". Every requirement must trace back to something the person actually said — a rule, a step of the flow, a constraint. A requirement with no source in the conversation is an invented one; leave it out.

**D2 — Acceptance criteria.** For each requirement, how it is verified, in terms someone from the business can check. A criterion is nearly derivable from a well-written requirement; where it is not, the requirement is vague and should be rewritten rather than covered by a vague criterion.

**D3 — Size.** Arithmetic, below.

If the derivation runs into something the answers genuinely do not settle — a rule whose exception nobody named, a flow that stops halfway — that is a **node that was not actually closed**. Put it back on the frontier and ask it. Deriving over a hole produces a confident requirement resting on a guess, which is exactly what the PRD review will not catch.

---

## Facts you fetch yourself — never ask

Before putting a question to the user, check whether it is a **fact** rather than a decision. Facts come from the project, not from the person:

- Does the product already do part of this? → `.doninha/docs/codebase/OVERVIEW.md` and the `modules/<slug>.md` docs, which are already written at capability level.
- Was this already decided somewhere? → `.doninha/STATE.md`, the feature folder's own artifacts.
- What vocabulary does this project use — personas, affected dimensions, item types? → `DONINHA.md` / `doninha-product-context`.

Bring the finding back as a finding, not as a question, and let it reshape the round:

> "Achei que o módulo X já faz {capacidade} — isso muda a sua resposta sobre {nó}?"

**Do not block the round on a lookup.** Only the questions downstream of the fact wait; ask the rest of the frontier now.

<critical>Read code and docs silently, speak business. Reuse is expressed as a CAPABILITY ("já existe um fluxo de criação de nota e uma regra de validação que dariam para reaproveitar"), never as a code artifact (`validateNoteInput`, `PUT /api/notes/[id]`, `422`, a file path). This step may be run by someone from analysis or product.</critical>

---

## Questions you must never ask

Technical questions do not belong in this step — not because they don't matter, but because they are `doninha-desenvolver`'s (F3), asked with the code in front of it. Asked here, they produce a generic answer that then looks like a decision.

Never ask about: architecture or layering · endpoints, routes or contracts · schema, migration or data model · framework, library or version · integration protocol · performance budget · deployment, infrastructure or feature-flagging mechanics · test strategy.

**When the user volunteers technical detail anyway** — they will, and often — record it as a **constraint** in their own words and move on. Do not pull the thread, do not ask the follow-up question it invites.

---

## Size — counted once, raised once

After the derivation, count: how many functional requirements came out (D1), and how many acceptance scenarios they imply (D2). The house ruler is **3 to 8 scenarios per PBI**.

If the count overshoots it with room to spare, raise it **once**, with the numbers in hand and a concrete cut line:

> "A partir do que você descreveu, cheguei a {N} requisitos e uns {M} cenários. A régua é 3-8 por PBI — isso normalmente indica dois ou três PBIs em vez de um. Uma quebra que faria sentido: [grupo A] num PBI e [grupo B] noutro. Quer quebrar, ou seguir com um só?"

This is the **only** question the derivation may produce, it is asked **once**, and it is about splitting the delivery — never about the requirements themselves.

**"Seguir com um só" is a legitimate answer and closes the subject** — record the decision and do not return to it. A big PBI by conscious choice is a different thing from a big PBI by inattention.

Record the count either way (`requisitos: N`, `cenarios_previstos: M`, `quebra: aceita|recusada`): it is what lets step-05 start from a decision already made instead of re-deriving the breakdown from scratch.

**Why here and not during the breakdown:** deciding to split costs one question now and costs rework later — proposing PBIs that get rejected, then consolidating criteria that were already written.

---

## Done

The step is done when the **asked frontier (L1-L4) is empty** and the derivation has run: every branch visited, nothing left silently assumed, requirements and criteria written from what was said.

Present the synthesis — including the derived requirements and criteria, so nothing arrives at the PRD unannounced — and move on. Do not open a confirmation round per item: the PRD assembled in step-04 is presented for review in one piece, and that is where corrections land. Asking the user to approve the same content twice is the friction this design exists to remove.
