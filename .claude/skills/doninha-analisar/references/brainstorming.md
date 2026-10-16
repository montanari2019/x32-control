# Brainstorming — Anti-Bias Protocol & Selection Modes

Reference used by `step-02a-descoberta.md` (**DESCOBERTA only**). Techniques live in `../assets/brain-methods.csv` (61 techniques, 10 categories) and are loaded **on demand** — read the CSV only when a technique needs to be presented or executed, never preload it wholesale into the conversation.

**SOLUÇÃO does not use this file.** A mode that starts from an already-understood problem has no need to *have* ideas — it needs the decided solution extracted from the person before it turns into a PRD. That is a decision tree walked in rounds of questions, not a creative technique: see [`grilling-negocio.md`](grilling-negocio.md), loaded by `step-02b-solucao.md`.

## Categories in `brain-methods.csv`

| Category | Focus |
| --- | --- |
| `collaborative` | Building together, role playing, relay race |
| `creative` | What-if, analogies, inversion, first principles |
| `deep` | Five whys, morphological analysis, constraint mapping |
| `introspective_delight` | Inner child, values, future wisdom |
| `structured` | SCAMPER, Six Hats, mind mapping, solution matrix |
| `theatrical` | Time machine, alien anthropologist, universe fusion |
| `wild` | Chaos engineering, pirate code, quantum superposition |
| `biomimetic` | Nature's solutions, ecosystems, evolutionary pressure |
| `quantum` | Observer effect, entanglement, superposition collapse |
| `cultural` | Indigenous wisdom, cultural fusion, mythic frameworks |

## Selection modes — DESCOBERTA (4 modes)

Presented to the user at the start of the brainstorming session:

1. **Usuário escolhe** — read `brain-methods.csv`, present the 10 categories, let the user pick a category then a technique.
2. **IA recomenda** — pick 3 techniques from the CSV suited to exploring a vague opportunity. Prioritize: 1 `deep` (e.g. Cinco Porquês, Mapeamento de Restrições) + 1 `creative` (e.g. Cenários E Se, Reversão/Inversão) + 1 `wild` (to break pattern-matching).
3. **Aleatória** — read the CSV, pick 1 random technique (vary category each round). Offer a new random technique once the current one is exhausted.
4. **Fluxo progressivo** — run techniques in this fixed order:
   1. Divergente amplo (`creative` or `wild`) — no constraints
   2. Aprofundamento (`deep`) — drill into the most promising hypotheses
   3. Estruturação (`structured`) — organize what emerged
   4. Validação (`deep` → Análise de Falhas or Mapeamento de Restrições)

## Anti-bias protocol

Applies to DESCOBERTA's exploration. LLMs tend toward semantic clustering — ideas drift into the same lane after a few rounds. Every **~10 ideas/angles**, consciously rotate the creative domain being explored:

**Generic rotation axis (reusable as-is):** técnico → experiência do usuário (UX) → viabilidade de negócio → casos extremos (edge cases) → mercado.

**Persona axis (project-specific — do NOT hardcode):** who is affected rotates through the personas defined in `DONINHA.md` / `doninha-product-context` for this project (e.g. "cliente → operador → time interno" or whatever roles the project's config defines). If no personas are configured, ask the user for the minimal vocabulary before starting (see step-01 config resolution) — never default to a fixed persona set from another domain.

After every ~10 ideas, ask the user: "Quer continuar explorando este ângulo ou mudar para uma nova dimensão/técnica?"

## Loading `brain-methods.csv` on demand

- Do not read the full CSV at skill load time — only when a step needs to present categories/techniques to the user or pick one.
- When presenting a category, filter the CSV rows by `category` and show `technique_name` + `description`.
- When executing a technique, follow its `description` field as the facilitation guide, applied to the actual problem/opportunity being discussed — never to a placeholder domain.
