# Design - BusMix AUX/FX Meter Stability

Last updated: 2026-05-24

## Design Goal

Fix AUX/FX Return meter flicker by isolating X32 meter streams according to their documented payloads, while preserving the CH 01..32 meter implementation exactly as the visual baseline.

## Current Flow

```txt
ChannelVuMeter
  -> registerMeterListener(channelId)
      -> useMeterSubscription.listenersRef[channelId]

X32 /meters/1
  -> decodeMeter1BlobForChannel(blob, channelId)
  -> currently iterates all listeners

X32 /meters/13
  -> decodeMeter13BlobForChannel(blob, channelId)
  -> currently filters channelId 33..48
```

## Proposed Flow

```txt
X32 /meters/1
  -> only channelId 1..32
  -> decodeMeter1BlobForChannel
  -> CH 01..32 listeners

X32 /meters/13
  -> only channelId 33..48
  -> decodeMeter13BlobForChannel
  -> AUX 01..08 + FX Return 01..08 listeners
```

This is the smallest likely fix and should be implemented before exploring alternate meter IDs.

## Meter Source Decision

Initial source for AUX/FX should remain `/meters/13` because:

- it includes 32 input channels, 8 aux returns, and 4x2 stereo FX returns;
- the current code already subscribes to `/meters/13`;
- current tests already assume AUX 01 is index 32 and FX Return 01 is index 40 within that 48-float blob;
- it avoids introducing a new meter source before proving the dispatch bug is fixed.

`/meters/3` remains a research-backed fallback if real hardware proves `/meters/13` is not the right UX source for BusMix AUX/FX. `/meters/3` has a different layout: 6 aux sends, 8 aux returns, and 4x2 stereo FX returns. It must not be swapped in without tests because AUX and FX offsets would change.

## Code-Level Plan

1. Extract the stream routing decision from `useMeterSubscription` into small pure helpers, for example:

```ts
export const isChannelMeterId = (channelId: number): boolean => channelId >= 1 && channelId <= 32;
export const isAuxFxMeterId = (channelId: number): boolean => channelId >= 33 && channelId <= 48;
```

2. Apply those helpers symmetrically:

- `/meters/1` handler must ignore IDs outside 1..32.
- `/meters/13` handler must ignore IDs outside 33..48.
- initial request and renewal logic can keep the same split.

3. Add focused tests for dispatch isolation. If hook tests are too heavy, extract a small dispatcher helper:

```ts
dispatchMeterBlob({
  blob,
  listeners,
  stream: 'meters1' | 'meters13',
});
```

4. Keep `ChannelVuMeter` unchanged unless the tests prove UI smoothing is also needed.

## Decoder Notes

`decodeMeter1BlobForChannel`:

- valid BusMix IDs: 1..32 only;
- `/meters/1` payload has 96 floats:
  - 0..31 input channel meter values;
  - 32..63 gate gain reductions;
  - 64..95 dynamics gain reductions.

`decodeMeter13BlobForChannel`:

- valid BusMix IDs: 33..48 for this feature;
- `/meters/13` payload has 48 floats:
  - 0..31 input channels;
  - 32..39 aux returns;
  - 40..47 stereo FX returns.

The code may keep index `channelId - 1` for `/meters/13`, but the tests and function comments must make the meaning clear.

## Testing Strategy

Unit tests:

- Existing CH tests remain unchanged.
- Add tests that `/meters/1` does not dispatch to channel IDs 33..48.
- Add tests that `/meters/13` does not dispatch to channel IDs 1..32.
- Add tests for AUX 01, AUX 08, FX Return 01, FX Return 08 offsets.
- Add regression test that reproduces flicker cause:
  - register AUX 01 listener;
  - dispatch `/meters/1` with a high value at index 32;
  - assert AUX listener is not called;
  - dispatch `/meters/13` with AUX 01 value;
  - assert AUX listener receives only the correct value.

Gate commands:

```sh
yarn jest __tests__/features/busMix/utils/meterDecoder.test.ts --runInBand
yarn jest __tests__/features/busMix --runInBand
yarn tsc
```

Manual UAT:

- Required with physical X32/M32 later.
- CH 01..32 must be compared before/after and should look identical.
- AUX and FX Return channels should stop blinking between unrelated levels.

## Performance Constraints

- Do not add another always-on meter stream unless necessary.
- Do not request `/meters/3` and `/meters/13` simultaneously for AUX/FX without proof.
- Do not increase renew frequency beyond current 8000 ms unless hardware proves it is needed.
- Do not dispatch meter updates to invisible channels.
- Do not introduce React state changes per packet outside currently visible meter components.

## Real Hardware Questions

To answer during UAT:

- Does `/meters/13` produce stable AUX/FX Return values on the target console firmware?
- If `/meters/13` remains unstable after dispatch isolation, does `/meters/3` better represent AUX/FX page behavior?
- Do FX returns need stereo-pair display treatment, or is the current one-strip-per-return model correct for this app?
- Are AUX returns and FX returns visually equivalent to CH meters after the stream isolation fix?

