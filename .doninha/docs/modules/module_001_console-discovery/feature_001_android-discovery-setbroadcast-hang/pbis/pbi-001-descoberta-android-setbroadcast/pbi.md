---
stage: pbi
feature: android-discovery-setbroadcast-hang
pbi: descoberta-android-setbroadcast
created_at: 2026-10-15
status: done
---

# PBI: Descoberta de consoles no Android sem travar por setBroadcast

**ID:** pbi-001-descoberta-android-setbroadcast
**Feature pai:** feature_001_android-discovery-setbroadcast-hang
**Data:** 2026-10-15
**Status:** implementado (registro histórico)

---

## O que entrega

No Android, "Buscar mesas na rede" passa a listar a X32 ligada na mesma rede em poucos segundos e sempre termina, seja com mesa(s) encontrada(s), seja com a mensagem de mesa não encontrada específica do Android (en, pt-BR, es).

## Regras de Negócio

- RN-01: A busca nunca pode ficar indefinidamente em andamento: deve terminar com mesa(s) encontrada(s) ou com a mensagem de não encontrada.
- RN-02: Alterações para Android não podem mudar o comportamento do iOS.

## Critérios de Aceite

- CA-01: Com a X32 ligada na mesma rede, o Android lista o console (nome osc-server, modelo X32, IP:10023) em menos de 6s. **[verificado]** (Redmi Note 9S, Android 12: ~3,5s, 192.168.1.250:10023)
- CA-02: Com a mesa desligada, a busca termina em até 9s exibindo a mensagem de mesa não encontrada específica do Android. **[pendente de UAT manual]**
- CA-03: Diagnóstico da busca visível no logcat (tag `TacimixDiscovery`). **[verificado]**
- CA-04: iOS mantém preflight de Rede Local e tempos atuais. **[pendente de UAT manual]**
- CA-05: Gates: tsc e Jest passando (tsc limpo; 28 suites / 117 testes). **[verificado]**

## Validação INVEST

| Critério    | Status | Justificativa |
| ----------- | ------ | -------------- |
| Independent | ✅ | _não informado_ |
| Negotiable  | ✅ | _não informado_ |
| Valuable    | ✅ | _não informado_ |
| Estimable   | ✅ | _não informado_ |
| Small       | ✅ | _não informado_ |
| Testable    | ⚠️ | CA-02 e CA-04 dependem de UAT manual em aparelho. |

## Notas

- Item já entregue em 2026-10-15; status de PBI: implementado (registro histórico). Nada será implementado a partir deste PBI.
- Pendente (UAT manual): mesa desligada (até 9s com mensagem), Wi-Fi sem internet, regressão no iPhone antes de publicar.
- Fora do escopo: nova implementação; UI de IP manual; patch/PR na biblioteca react-native-udp.
- Referências: spec técnica em `repos/x32-control/src/features/consoleDiscovery/.specs/feature/android-discovery-field-failure/`; log `logs/2026-10-15_21-05-00-android-discovery-fix-setbroadcast.txt`; evidências: logs nativos temporários, screenshot da tela com o console listado.

---

Próximo passo este PBI já está implementado; execute o UAT manual de CA-02 e CA-04 (mesa desligada, Wi-Fi sem internet, regressão no iPhone) antes de publicar. Para novos PBIs, rode `doninha-analisar` (passo 05).
