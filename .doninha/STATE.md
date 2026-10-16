# STATE — memória do workspace Doninha

## Decisões
- 2026-10-15 (feature_001_android-discovery-setbroadcast-hang): no Android o app não chama `setBroadcast` do react-native-udp — a chamada trava e esgota o pool de 2 threads nativas. Descoberta depende de envio broadcast sem confirmação + varredura unicast da sub-rede. iOS inalterado.
- 2026-10-15: proteções em camadas mantidas (timeouts, watchdog 9s, MulticastLock, vínculo à rede Wi-Fi) como defesa.

## Lições
- Testar descoberta de rede com mesa real em CADA plataforma antes de dar por resolvido; o fix de junho/2026 limitou a espera mas manteve a chamada que travava.
- Logs nativos temporários (Log.i em node_modules, revertidos) provaram a causa; diagnóstico agora permanente via tag TacimixDiscovery.

## Pendências / deferred
- UAT manual: mesa desligada (CA-02), Wi-Fi sem internet, regressão iPhone (CA-04).
- Review F-01..F-05 (minors): liberar recursos nativos antes de retornar após watchdog; unbind com retry; limitar espelho de logs ao __DEV__; premissa de scan único; testes do hook e Kotlin.
- Possível patch/PR no react-native-udp (issue #82).
