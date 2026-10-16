# Context - Android Discovery Field Failure

Date: 2026-10-15

## Reproduction (this session)

- adb device: Redmi Note 9S, Android 12, app `com.tacimix.app` (develop debug, Metro on 8081).
- `dumpsys connectivity`: default network = WIFI "SOM 2.4G", VALIDATED, wlan0 192.168.1.36/24, route 192.168.1.0/24 dev wlan0. Not the cellular-default case right now (mobile_data=1 though).
- Mac on 192.168.1.40 probe (/info to 192.168.1.255, 255.255.255.255 and every .1-.254): only `192.168.1.250` replied (X32, fw 4.02). So network + console are healthy.
- App: tap "Buscar mesas na rede" -> spinner "Procurando consoles via /info..." still showing 45s+ later; UI thread alive (spinner animates), JS promise `scanForConsoles()` unresolved.
- `adb logcat --pid` showed no JS output at all: diagnostics (`console.info` in __DEV__) are not usable to locate the step. The stall step is therefore still UNPROVEN.

## Code facts

- `UdpTransport.bind()` resolves only on the socket `listening` event, then `configureBroadcastOnce`. The `listening` listener is attached before `socket.bind()`, but if the event never fires `bind()` never settles and nothing bounds it. The earlier fix only bounded the broadcast-confirm step (250ms), not bind itself.
- `NetworkScanner.scanForConsoles()` awaits `transport.bind()`, `getNativeBroadcastAddresses()` and `getNativeNetworkInterfaces()` (native promises) with no timeout. Any unresolved native promise freezes the scan.
- `react-native-udp` 4.1.7 Android acquires a `WifiManager.MulticastLock` only inside `addMembership` (multicast join). Tacimix never joins a group, so no lock is ever held although the manifest declares CHANGE_WIFI_MULTICAST_STATE.
- Sockets are not bound to the Wi-Fi `Network`; they follow the process default network.
- `LocalNetworkPermission` is a no-op on Android (correct through Android 15).
- Error copy `errors.discoveryFailure`/no-console text mentions iPhone/Local Network.

## Hypotheses (ranked) - to be proven by T-001/T-002

H1 (primary): scan promise stalls before the wait windows (bind `listening` never fires, or a native bridge promise never resolves). Matches 45s+ spinner.
H2: replies never reach the socket because Wi-Fi power-save/filter drops packets without a MulticastLock (some devices need it even for broadcast discovery).
H3: sockets go out the wrong network when Wi-Fi is not the default (X32 networks usually have no internet; Android keeps cellular default). Not the case in today's snapshot, but real for venue routers.
H4 (future): Android 16+ local-network permission (`NEARBY_WIFI_DEVICES`/local network access) for apps targeting 36+/37; app targets SDK 35 today, so not the cause now.

## External references

- MulticastLock needed on some devices to receive discovery broadcasts; may degrade if lock lifecycle is wrong: https://b4x.com/android/forum/posts/626423 , https://chainfire.eu/articles/742/_dev_Android_Datagrams_UDP_Broadcast_and_Multicast_. , https://discuss.kotlinlang.org/t/udp-broadcast-packets-being-blocked/16549
- Bind socket to Wi-Fi Network (Network.bindSocket) instead of relying on default route; KDE Connect fixed the same class of bug: https://invent.kde.org/network/kdeconnect-android/-/merge_requests/391
- react-native-udp README (dgram semantics, bind/listening): https://cdn.jsdelivr.net/npm/react-native-udp@4.1.7/README.md
- Android MulticastLock API: https://developer.android.com/reference/android/net/wifi/WifiManager.MulticastLock
- No public report found of `listening` never firing in react-native-udp on Android: H1 is unverified.

## Findings (T-002)

- Native logs (`TacimixDiscovery`): `setBroadcast run` x2 (native + library fallback), never `done`; all `send_timeout` at 5s; Mac listener received 0 packets; second scan `discovery_bind_timeout`.
- H1/H2-like starvation confirmed as the cause (blocked `setBroadcast` wedges the 2-thread executor). H3 (cellular routing) not the cause on this device; guards kept as defense.
- After fix: `broadcast_enable_skipped_android`, `bind_ready`, `discovery_scan_complete deviceCount=1`.
