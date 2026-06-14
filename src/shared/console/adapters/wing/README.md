# Future WING Adapter

This folder is a placeholder for future WING support. It intentionally does not
export a runtime adapter in the console adapter factory.

Known constraints for a future implementation:

- WING OSC uses UDP port `2223`; X32/M32 uses UDP port `10023`.
- WING native discovery can use the `WING?` datagram on UDP port `2222`;
  current X32/M32 discovery uses OSC `/info`.
- WING OSC paths are not the same as X32 zero-padded paths. Future mapping must
  normalize WING data into the same UI-facing adapter DTOs.
- WING event subscriptions use WING-specific `/*s`, `/*S`, or binary
  subscription forms and must be renewed differently from X32 `/xremote`.
- WING OSC supports only one active event subscription at a time according to
  the researched remote protocol documentation, so receive multiplexing must be
  centralized inside the adapter.

Do not register a `WingAdapter` until a separate feature spec implements and
validates WING runtime behavior.

