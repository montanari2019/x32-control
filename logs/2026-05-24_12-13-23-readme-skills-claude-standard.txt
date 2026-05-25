README E SKILLS CLAUDE STANDARD

Contexto: README estava defasado e docs/skills usava arquivos .md soltos fora do formato Agent Skills.
Causa: app evoluiu p/ Tacimix RN 0.78.1 c/ BusGroups, BusMix 48 fontes, presets, meters e ajustes iOS; skills antigas nao tinham SKILL.md.
Ação: reescrito README c/ estado atual; migradas 20 skills p/ docs/skills/<skill-name>/SKILL.md; frontmatter reduzido a name/description; index atualizado.
Resultado: OK; estrutura alinhada ao padrao Claude Agent Skills.
Arquivos: README.md; docs/skills/00-skill-index.md; docs/skills/*/SKILL.md.
Validação: script Node local checou 20 skills, nomes ^[a-z0-9-]{1,64}$, frontmatter name/description e descrições <=1024 chars.
Pontos atenção: conteúdo herdado de algumas skills ainda cita padrões genéricos/antigos; estrutura e metadata ja foram normalizadas.
