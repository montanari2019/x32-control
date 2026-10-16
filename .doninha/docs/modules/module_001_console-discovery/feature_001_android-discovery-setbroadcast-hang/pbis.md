---
stage: structure
feature: android-discovery-setbroadcast-hang
created_at: 2026-10-15
status: done
---

# Estrutura — Descoberta de consoles no Android travada por setBroadcast

## Objetivo da feature

Registrar historicamente a correção da descoberta de consoles X32 no Android, que ficava em "Procurando..." por 45s ou mais sem listar a mesa. A entrega, já implementada e validada em 2026-10-15, faz a busca sempre terminar e listar a mesa em poucos segundos.

## PBIs

### descoberta-android-setbroadcast — Descoberta de consoles no Android sem travar por setBroadcast

**Descrição:** Android deixa de chamar `setBroadcast`, passa a usar varredura unicast com limites de tempo e recursos de rede liberados ao final, com mensagem de não encontrada específica. Status: implementado (registro histórico).
**Depende de:** nenhum

## Justificativa da decomposição

O item chegou já delimitado como entrega única, e não houve divisão: 1 PBI. Pasta: `pbis/pbi-001-descoberta-android-setbroadcast/`.

---

Próximo passo este PBI já está implementado; faça o UAT manual pendente (CA-02 e CA-04) e, se necessário, rode `doninha-desenvolver` no PBI.
