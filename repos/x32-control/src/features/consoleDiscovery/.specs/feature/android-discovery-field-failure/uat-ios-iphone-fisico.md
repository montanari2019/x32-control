# UAT iOS — simulador e iPhone físico (via cabo)

Objetivo: provar que a correção do Android NÃO regrediu o iOS (descoberta, preflight de Rede Local, tempos).
Rodar com a X32 ligada na mesma rede Wi-Fi do Mac e do iPhone.

## A. Simulador (iPhone 17) — build já instalada em 2026-10-15
1. `cd repos/x32-control && yarn ios` (Metro em 8081).
2. Tocar em "Buscar mesas na rede".
3. Esperado: console `osc-server` / `X32` / IP da mesa listado (o simulador usa a rede do Mac).
4. Sem a mesa: termina com a mensagem iOS ("verifique ... iPhone ... Rede Local"), sem spinner infinito.
Status 2026-10-15: build instalada e app carregou; o toque em "Buscar" não pôde ser automatizado (macOS sem permissão de acessibilidade) → executar manualmente.

## B. iPhone físico via cabo
Pré: iPhone desbloqueado, confiável no Mac, mesmo Wi-Fi/sub-rede da X32, Wi-Fi com Rede Local permitida; Xcode com Team de assinatura configurado.
1. Conectar o cabo; `xcrun xctrace list devices` deve listar o aparelho (`iPhone de Ikaro`).
2. `cd repos/x32-control && yarn ios:device` (usa `--device "iPhone de Ikaro"`; Metro ativo em 8081).
3. Primeira abertura: aceitar o prompt de Rede Local. Se negado antes: Ajustes > Privacidade > Rede Local > Tacimix.
4. Tocar "Buscar mesas na rede". Esperado: `osc-server` / `X32` / IP:10023 em poucos segundos (pode levar mais na 1ª vez por causa do prompt).
5. Repetir 3x seguidas (sem travar, sem duplicar).
6. Mesa desligada/fora da rede: scan termina com a mensagem iOS, sem spinner infinito.
7. Wi-Fi do iPhone desligado: scan termina com erro/mensagem, sem travar.
8. Logs: Console.app → dispositivo → filtrar por `Tacimix UDP` (eventos bind_*, discovery_*). Não deve aparecer `broadcast_enable_skipped_android` no iOS.
9. Resultado: registrar data, modelo/iOS, tempos e prints em `context.md` (seção UAT iOS).

## Critério de aceite
- iOS lista a X32 e mantém o preflight de Rede Local; nenhuma mudança de comportamento em relação ao app publicado.
