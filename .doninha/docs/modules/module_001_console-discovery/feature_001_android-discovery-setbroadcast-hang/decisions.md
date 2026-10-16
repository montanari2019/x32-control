---
stage: feature
feature: android-discovery-setbroadcast-hang
created_at: 2026-10-15
status: done
---

# Log de Decisões — Descoberta de consoles no Android travada por setBroadcast

> Decisões detalhadas desta feature. Para resumo, veja `feature.md#Decisões Chave`.

## DEC-01 Escopo

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** O item chegou já implementado e validado; a análise é express documental.

**Opções avaliadas:** Não houve avaliação de alternativas.

**Escolha:** Apenas documentar o que foi feito; nada novo.

**Motivo:** Registro histórico de entrega já realizada.

**Impactos:** Nenhuma implementação nesta feature.

## DEC-02 Causa raiz e solução

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** `setBroadcast()` do react-native-udp 4.1.7 no Android nunca retorna (issue upstream #82) e prende uma das 2 threads do pool nativo; com duas chamadas (nativa + fallback JS) o pool se esgota e nenhum envio/bind posterior executa.

**Opções avaliadas:**
- A) Limitar a espera da confirmação e continuar chamando `setBroadcast` (tentada em junho/2026, spec `android-console-discovery-hardening`): insuficiente, falhou; nunca foi testada com mesa real no Android.
- B) Não chamar `setBroadcast` no Android e confiar em varredura unicast + broadcast sem confirmação: escolhida e validada com mesa real.

**Escolha:** B.

**Motivo:** Causa provada com logs nativos temporários (removidos). Hipótese de rota via rede móvel descartada.

**Impactos:** iOS permanece inalterado.

## DEC-03 Proteções em camadas

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** Mesmo com a causa provada e corrigida.

**Opções avaliadas:** _não informado_

**Escolha:** Manter timeouts (bind 4s, consultas nativas 1,5s), watchdog global de 9s (Android), MulticastLock e vínculo à rede Wi-Fi.

**Motivo:** Defesa em profundidade.

**Impactos:** _não informado_

## DEC-04 Registro local-only

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** Não há tracker para este item.

**Opções avaliadas:** _não informado_

**Escolha:** Registro local, sem criar item no tracker.

**Motivo:** Item local-only.

**Impactos:** `decisions.md` e demais artefatos ficam apenas no repositório.

## DEC-05 Nível de texto no PRD/PBI

**Data:** 2026-10-15
**Status:** Aceita

**Contexto:** PRD/PBI devem ficar em nível de negócio.

**Opções avaliadas:** _não informado_

**Escolha:** Detalhes técnicos ficam na spec referenciada (`repos/x32-control/src/features/consoleDiscovery/.specs/feature/android-discovery-field-failure/`).

**Motivo:** Separação de níveis.

**Impactos:** Exceção consciente: o usuário pediu artefato técnico/histórico.
