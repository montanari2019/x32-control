---
analise:
  aprovador: nenhum # papel genérico (ex.: "Head de Produto") | nome de pessoa | nenhum — nunca fixe um nome além do que o time deste projeto definir
# fontes_de_contexto: # descomente para silenciar fontes que este projeto não alcança
#   silenciadas: [context-source-base-do-time] # o nome da fonte, com ou sem o prefixo context-source-; a entrada de mesmo nome em context-sources.yml também sai
research:
  referencias: [] # docs de referência do time (ex.: ["INDEX.md"]), relativos à raiz do workspace — o doninha-project-research os reconcilia contra o código; [] = não existem
---

# DONINHA.md <!--- Índice do workspace + configuração/políticas dos agentes Doninha -->

<!-- doninha:repos:start -->

## Repositórios

- **x32-control** — `repos/x32-control` — App mobile (Tacimix) que controla mixes de monitor em consoles Behringer X32/Midas M32 via OSC sobre UDP — React Native 0.78/TypeScript, sem backend
  → docs: `repos/x32-control/.doninha/docs/codebase/OVERVIEW.md` (6 módulos)
  - consoleDiscovery — `src/features/consoleDiscovery/` — Descoberta de consoles X32/M32 reais na rede ou console Demo para teste
  - busSelection — `src/features/busSelection/` — Lista os BUS do console, com nomes/cores do desk e pares estéreo
  - busGroups — `src/features/busGroups/` — Hub do BUS: master fader/mute e 8 MCAs locais sobre DCA 1–8
  - busMix — `src/features/busMix/` — Mixagem em tempo real das 48 fontes do bus, com presets locais e meters
  - about — `src/features/about/` — Tela informativa do app
  - app, services, shared, theme, types — `src/app/`, `src/services/`, `src/shared/`, `src/theme/`, `src/types/` — Camadas transversais compartilhadas

<!-- doninha:repos:end -->
