---
status: 'analyzed'
stepsCompleted: [1, '2c', 6]
feature_id: 'feature_001'
feature_title: 'Descoberta de consoles no Android travada por setBroadcast'
feature_slug: 'android-discovery-setbroadcast-hang'
feature_folder: '.doninha/docs/modules/module_001_console-discovery/feature_001_android-discovery-setbroadcast-hang/'
mode: 'express'
source_ref: 'requisitos'
attachments_read: '0/0'
rn_placement: 'pbi'
business_rules: []
initial_answers:
  contexto: 'Registro histórico/documental. Android não achava a X32 na mesma rede; iOS (publicado) funcionava. Correção já implementada e validada em 2026-10-15.'
  afetado: 'Operadores/músicos usando o Tacimix em Android.'
  criterio_sucesso: 'Console osc-server/X32 em 192.168.1.250 listado no Redmi Note 9S em ~3,5s; mesa desligada termina em até 9s com mensagem de não encontrada.'
  fora_escopo: 'Implementar qualquer coisa nova. UI de IP manual. Patch na biblioteca react-native-udp. UAT de mesa desligada, Wi-Fi sem internet e iPhone ainda pendentes.'
  restricoes: 'Não regredir o iOS (Local Network preflight, timings). Sem tracker: local-only.'
validation_approved: true
pbis_created:
  - {n: 1, id_local: 'pbi-001', slug: 'descoberta-android-setbroadcast', invest_ok: false}
---
