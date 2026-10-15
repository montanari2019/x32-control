---
name: 'doninha-ux-practices'
description: "Defines and enforces UX Design practices based on User-Centered Design (UCD) and Lean UX methodologies. Use this skill whenever designing user interfaces, creating wireframes, defining user flows, writing UI specifications, reviewing UX decisions, planning user research, building prototypes, evaluating design health, or generating any UX-related artifact. Also apply when discussing accessibility, usability, design systems, interaction patterns, or when any design output is expected — even if the user doesn't explicitly mention 'UX'. Triggers on: design a screen, create a flow, user experience, wireframe, prototype, usability, accessibility, design system, user journey, persona, design review, UI spec, interaction design, design health."
---

# Doninha UX Practices

This skill guides how UX design decisions should be made, documented, and evaluated. The goal is to produce experiences that are useful, intuitive, and aligned with business objectives — because good design is not about making things pretty, it's about solving real user problems efficiently.

Every guideline here exists to keep the user at the center of decisions while delivering measurable business value.

> **`doninha-ux-practices` vs `doninha-ux`:** this skill is the **principle layer** — the *why* and *how to think* (UCD, Lean UX, heuristics, design health). The `doninha-ux` skill is the **production layer** — it turns these principles into the concrete per-PBI dual contract (`DESIGN.md` + `EXPERIENCE.md`) that `doninha-frontend` consumes. They complement, never replace, each other: apply these practices while producing those contracts.

## Core Philosophy

UX Design goes beyond creating attractive interfaces. It connects user needs to business goals through strategic, human-centered thinking. The work involves understanding user behavior deeply, exploring trends, and translating discoveries into design solutions that deliver value and efficiency.

When generating UX artifacts, always consider:

- **Who** is the user and what are their real pain points?
- **What** business objective does this design serve?
- **How** will we measure success?

## User-Centered Design (UCD)

User-Centered Design is the foundational approach: deep understanding of user needs, desires, and behaviors guides the entire design process. The user is at the center of every decision, ensuring experiences are useful, intuitive, and impactful.

UCD is not just a methodology — it is a collaborative and iterative philosophy. The user is an active partner in the design process, not just a research subject.

### UCD Workflow

1. **Explore user needs** — Use qualitative and quantitative research to understand pain points, expectations, and motivations. Techniques include interviews, surveys, analytics review, contextual inquiry, and behavioral pattern analysis.

2. **Collaborate with stakeholders** — Align objectives, prioritize features, and establish success metrics. Include developers, product owners, marketing, and management in the design conversation to ensure a cohesive project vision.

3. **Define the problem clearly** — Before designing solutions, articulate the problem in a structured way. Use problem statements, "How Might We" questions, or Jobs-to-be-Done frameworks.

4. **Design and prototype** — Create interaction flows, wireframes, and navigable prototypes that translate insights into clear, intuitive interfaces. Start with low fidelity and increase detail as confidence grows.

5. **Validate continuously** — Test designs with real users early and often. Use co-creation sessions, usability tests, and A/B testing. Validation is not a final step — it happens throughout the process.

6. **Iterate based on evidence** — Adjust designs based on user feedback and data, not assumptions. Each iteration should bring the product closer to solving the real problem.

### Applicable Methodologies

Apply these methodologies as appropriate to the project context:

- **Design Thinking** — For exploring problems deeply and generating innovative solutions through empathy, ideation, and experimentation.
- **Lean UX** — For fast hypothesis-driven design cycles with minimal waste (detailed below).
- **Design Sprint** — For solving critical business questions through design, prototyping, and testing with users in a compressed timeframe.

## Lean UX

Lean UX is an agile approach to UX design that reduces waste and maximizes value through rapid iteration and validation cycles. It prioritizes direct communication between teams and eliminates excessive documentation.

### Lean UX Principles

1. **Think in hypotheses, not requirements.** Frame design decisions as testable hypotheses: "We believe that [change] will result in [outcome] for [users]. We will know we're right when [metric]."

2. **Build only what you need to learn.** Create the minimum viable artifact to validate a hypothesis — a sketch, a clickable prototype, a single-screen mockup. Avoid over-investing in unvalidated ideas.

3. **Validate early and often.** Test with real users as soon as possible. A rough prototype tested with 5 users reveals more than a polished design reviewed only internally.

4. **Collaborate continuously.** Multidisciplinary teams work together from the start, sharing knowledge and insights in real time. Designers, developers, and product owners co-create solutions rather than working in silos.

5. **Reduce handoff friction.** Favor shared understanding over detailed specification documents. When documentation is needed, keep it lightweight and focused on what the builder needs to know.

### Lean UX Cycle

```
Hypothesis → MVP Design → Prototype → User Test → Learn → Iterate
```

Each cycle should be as short as possible. The goal is to learn fast and adapt, not to get it perfect on the first try.

## Design Health Assessment

Evaluating whether a product is healthy from a design perspective involves analyzing these dimensions:

### 1. User Experience

- Are user flows intuitive and efficient?
- Can users complete key tasks without confusion or frustration?
- Has the design been validated with real users?
- Are error states, empty states, and edge cases handled gracefully?

### 2. Visual Consistency and Quality

- Does the interface follow a consistent design system or style guide?
- Are spacing, typography, colors, and components used consistently?
- Is the visual hierarchy clear — can users instantly see what matters most?

### 3. Operational Efficiency

- Does the design reduce cognitive load and unnecessary steps?
- Are common actions easy to perform and uncommon actions still discoverable?
- Does the interface support the user's mental model of the task?

### 4. Continuous Validation and Feedback

- Are designs regularly tested with users?
- Is there a feedback loop between user research findings and design decisions?
- Are metrics (NPS, SUS, task completion rate, error rate) tracked and acted upon?

### 5. Business Impact Metrics

- Does the design contribute to measurable business outcomes (conversion, retention, satisfaction)?
- Are design decisions aligned with product strategy and business goals?
- Is there evidence that design improvements lead to business improvements?

### 6. Continuous Evolution

- Is the design system maintained and evolving?
- Are new patterns documented and shared?
- Does the team regularly review and improve existing experiences?

### Health Score

Use this scale to communicate overall design maturity:

| Score       | Status       | Meaning                                                              |
|-------------|--------------|----------------------------------------------------------------------|
| >= 80%      | **Healthy**  | Practices are well-adopted and consistently applied.                 |
| >= 60%, <80%| **Degraded** | Some practices are in place, but gaps exist. Needs attention.        |
| < 60%       | **Unhealthy**| Significant gaps in design practices. Requires immediate action.     |

Always go beyond the aggregate score — break down indicators by dimension and combine them for a critical analysis that reveals where the real problems are.

## UX Artifact Standards

When generating UX-related deliverables, follow these standards:

### User Flows

- Start with the user's goal, not the system's structure.
- Show the happy path first, then alternate and error paths.
- Include decision points clearly.
- Label each step with the user's action, not the system's response.

### Wireframes

- Focus on content hierarchy and layout, not visual detail.
- Annotate interactive elements with their behavior.
- Include states: default, hover, active, disabled, error, loading, empty.
- Call out responsive breakpoints if applicable.

### Personas

- Base personas on real research data, not assumptions.
- Include: name, role, goals, pain points, behaviors, context of use.
- Keep them concise — a persona should fit on one page.
- Avoid demographic stereotypes that don't affect design decisions.

### Usability Test Plans

- Define clear tasks with measurable success criteria.
- Specify the target user profile.
- Include both quantitative metrics (task completion rate, time on task, error rate) and qualitative observations.
- Plan for 5-8 participants per round — enough to reveal patterns without excessive cost.

## Accessibility Baseline

Accessible design is inclusive design. Every UX artifact should consider:

- **Color contrast** — minimum 4.5:1 ratio for text (WCAG AA).
- **Keyboard navigation** — all interactive elements must be reachable and operable via keyboard.
- **Screen reader compatibility** — use semantic HTML, proper ARIA labels, and meaningful alt text.
- **Touch targets** — minimum 44x44px for mobile interactive elements.
- **Text readability** — minimum 16px base font size, 1.5 line height for body text.
- **Motion sensitivity** — respect `prefers-reduced-motion` and avoid auto-playing animations.

## Collaboration Guidelines

UX Designers act as facilitators between development, marketing, product, and management teams. When producing UX-related outputs:

- Use clear, jargon-free language that all stakeholders can understand.
- Present design decisions with their rationale — explain the "why" alongside the "what".
- Include concrete examples and visual references when possible.
- Frame trade-offs explicitly so stakeholders can make informed decisions.
- Keep documentation lightweight and actionable — favor shared understanding over exhaustive specs.
