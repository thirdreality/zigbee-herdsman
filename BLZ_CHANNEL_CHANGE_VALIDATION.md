# BLZ Channel Change Validation

## 2026-05-13 Summary

### Code changes

- Fixed BLZ channel-change reform to preserve the current extended PAN ID.
  The adapter now passes `BigInt(currentParams.extendedPanID)` into
  `formNetwork(...)` instead of reinterpreting the value through byte buffers.
- Added `BLZFrameData.toJSON()` so debug logging can serialize frames that
  contain `bigint` fields without throwing in `JSON.stringify(...)`.
- Added unit coverage for extended PAN ID preservation during BLZ channel
  changes and JSON serialization of BLZ frame data with uint64 fields.

### Lab setup

- Adapter: BLZ dongle on `/dev/ttyUSB0`
- Zigbee2MQTT runtime test: `npm start` / source tree execution
- BLZ firmware reported by Zigbee2MQTT: `BLZ v1`, version `1.6.40`, build
  `2129`
- Initial test network: channel 11, PAN ID `0x2ea0`, extended PAN ID
  `0xb3c6675b7437d674`

### Runtime validation

- Router test device: Third Reality `3RCB01057Z` bulb,
  IEEE `0xb40ecfd257d30000`.
- The bulb joined on channel 11 and remained controllable after channel
  changes 11 -> 15 and 15 -> 11.
- After returning to channel 11, setting the bulb color to blue succeeded.
- Battery test device: SONOFF `SNZB-01P` button,
  IEEE `0x44e2f8fffe19903c`.
- The button joined and produced actions on channel 11 after returning to the
  original channel, but did not produce upstream frames on channel 15 after the
  standard BLZ channel-change broadcast.
- Re-running the normal 15-second propagation window while continuously
  pressing the button still did not produce upstream button events on channel
  15.

### Weekly validation status

- Targeted BLZ unit tests passed before commit.
- `pnpm run build` passed in `zigbee-herdsman`.
- `pnpm run build` passed in `zigbee2mqtt` after syncing dependencies with
  upstream Zigbee2MQTT 2.10.1 while keeping the local herdsman dependency.
- The weekly pipeline was started again after manual merge fixes. At the user
  pause point it had passed:
  - Path 3: ZHA HA Core venv with real BLZ dongle.
  - Path 5b: Zigbee2MQTT from source with real BLZ dongle.
- The weekly run was interrupted during Path 5a Docker standalone startup. The
  temporary `z2m-docker-test` container was removed after interruption.

### Follow-up

- The router-device result validates that preserving the extended PAN ID fixes
  the practical BLZ channel-change failure for always-on routing devices.
- The sleepy button result suggests the single standard broadcast window is not
  reliable for that class of battery device. A useful follow-up is a temporary
  BLZ test build that repeats the channel-change broadcast for 60-120 seconds
  before local network reform.

### Final lab state

- Zigbee2MQTT was stopped.
- The Zigbee2MQTT configuration was left on channel 11 with adapter `blz`,
  `/dev/ttyUSB0`, and baudrate `2000000`.
