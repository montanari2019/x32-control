---
name: doninha-skill-creator
description: Create new skills, modify and improve existing skills. Use when users want to create a skill from scratch, edit or optimize an existing skill, or improve a skill's description for better triggering accuracy.
---

# Skill Creator

A skill for creating new skills and iteratively improving them.

The process of creating a skill:

1. Understand what the user wants the skill to do
2. Write a draft of the skill
3. Review the draft with the user and gather feedback
4. Improve the skill based on feedback
5. Repeat until the user is satisfied

Your job is to figure out where the user is in this process and help them progress. Maybe they want to create a skill from scratch, or maybe they already have a draft they want to improve. Be flexible — adapt to what the user needs.

> **IMPORTANT: All skills must be written in English.** Regardless of the language the user communicates in, the SKILL.md content — including the name, description, instructions, examples, and any bundled resources — must always be authored in English. This ensures skills are portable, maintainable, and usable across teams and tooling. You may communicate with the user in their preferred language, but the skill artifact itself is always English.

## Communicating with the user

Adapt your communication to the user's technical level. Pay attention to context cues — if the user seems less technical, explain terms briefly. If they're experienced, keep things concise.

---

## Creating a skill

### Capture Intent

Start by understanding the user's intent. The current conversation might already contain a workflow the user wants to capture (e.g., they say "turn this into a skill"). If so, extract answers from the conversation history first — the tools used, the sequence of steps, corrections the user made, input/output formats observed. The user may need to fill the gaps, and should confirm before proceeding.

1. What should this skill enable the AI to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?

### Identify Project Context

Using root directory context, for identifying project name. Using project name for create skill name. If project name is unavailable, ask user for a short name to use in the skill name. The skill name should be in the format `[project-name]-[skill-name]` (ex: `my-project-api-design`). Ignore the already existing skills in the project when creating the skill.

### Interview and Research

Proactively ask questions about edge cases, input/output formats, example files, success criteria, and dependencies. Research available tools and documentation to come prepared with context and reduce burden on the user.

### Write the SKILL.md

Based on the user interview, fill in these components:

- **name**: Skill identifier, format `[project-name]-[skill-name]` (ex: `my-project-api-design`)
- **description**: When to trigger, what it does. This is the primary triggering mechanism — include both what the skill does AND specific contexts for when to use it. All "when to use" info goes here, not in the body. Make the description a little "pushy" to avoid under-triggering. For instance, instead of "How to build a dashboard.", prefer "How to build a dashboard. Use this skill whenever the user mentions dashboards, data visualization, metrics, or wants to display any kind of data, even if they don't explicitly ask for a 'dashboard.'"
- **compatibility**: Required tools, dependencies (optional, rarely needed)
- **the rest of the skill**

### Skill Writing Guide

#### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### Progressive Disclosure

Skills use a three-level loading system:

1. **Metadata** (name + description) - Always in context (~100 words)
2. **SKILL.md body** - Loaded when skill triggers (<500 lines ideal)
3. **Bundled resources** - Loaded as needed (unlimited)

**Key patterns:**
- Keep SKILL.md under 500 lines; if approaching this limit, add hierarchy with clear pointers to referenced files
- Reference files clearly from SKILL.md with guidance on when to read them
- For large reference files (>300 lines), include a table of contents

**Domain organization**: When a skill supports multiple domains/frameworks, organize by variant:
```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```
The AI reads only the relevant reference file.

#### Principle of Lack of Surprise

Skills must not contain malware, exploit code, or any content that could compromise system security. A skill's contents should not surprise the user in their intent if described. Don't go along with requests to create misleading or malicious skills.

#### Writing Patterns

Prefer using the imperative form in instructions.

**Defining output formats:**
```markdown
## Report structure
Use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**Examples pattern:**
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### Writing Style

Explain to the model **why** things are important instead of using heavy-handed MUSTs. LLMs are smart — they have good theory of mind and when given reasoning can go beyond rote instructions. If you find yourself writing ALWAYS or NEVER in all caps, that's a yellow flag — reframe and explain the reasoning instead. Make skills general and not overly narrow to specific examples.

---

## Improving the skill

This is the heart of the loop. The user has reviewed the skill or its outputs and now you need to make it better.

### How to think about improvements

1. **Generalize, don't overfit.** Skills should work across many different prompts, not just the examples you've been iterating on. Rather than adding fiddly constraints, try different approaches, metaphors, or patterns of working.

2. **Keep the prompt lean.** Remove things that aren't pulling their weight. If the skill is making the model waste time on unproductive steps, cut those parts out.

3. **Explain the why.** Explain the reasoning behind instructions so the model understands _why_ something is important. This is more effective than rigid rules.

4. **Bundle repeated work.** If every invocation ends up writing similar helper scripts, bundle that script into `scripts/` so future invocations don't reinvent the wheel.

### The iteration loop

1. Apply improvements to the skill
2. Review the changes with the user
3. Gather feedback and improve again
4. Repeat until the user is satisfied or no meaningful progress is being made

---

## Description Optimization

The description field in SKILL.md frontmatter is the primary mechanism that determines whether an AI invokes a skill. After creating or improving a skill, offer to optimize the description for better triggering accuracy.

### Tips for good descriptions

- Include both **what** the skill does and **when** to use it
- List specific trigger phrases and contexts the user might mention
- Be "pushy" — mention related keywords so the skill triggers even when the user doesn't explicitly name it
- Keep it under ~100 words — this metadata is always loaded in context
- Think about near-miss scenarios where a similar skill might compete, and clarify boundaries
