# Wi-Fi and Firmware Logging Control Plan

## Purpose

This document defines a safe, user-controllable logging strategy for Wi-Fi and related firmware debug output so we can reduce bandwidth pressure while keeping diagnostics available when needed.

It includes:

- problem statement and goals
- proposed architecture (firmware, protocol, host UI)
- rollout phases
- development to-do checklist for tracking progress

## Problem Statement

Current firmware and bridge logs can be very verbose during normal operation. Continuous debug output may:

- consume serial/IPC bandwidth
- increase response latency for command/ack traffic
- create noisy UI logs that hide actionable issues
- increase timeout risk under heavy activity

## Goals

- Provide user-level control over runtime logging without reflashing firmware.
- Keep default behavior safe for normal operation (low-noise, low-bandwidth).
- Preserve deep diagnostics capability for troubleshooting sessions.
- Make the feature backward-compatible with existing host/firmware versions.

## Non-Goals

- Replacing the existing logging framework.
- Introducing persistent cloud log aggregation in this phase.
- Refactoring unrelated protocol channels.

## Proposed Runtime Model

### Log Levels

Runtime log level (single global gate in firmware):

- `OFF`
- `ERROR`
- `WARN`
- `INFO` (recommended default for developer builds)
- `DEBUG`
- `VERBOSE` (short diagnostic sessions only)

### Optional Category Filters (Phase 2)

- `wifi`
- `ipc`
- `bitstream`
- `sensors`
- `system`

If category filtering is not ready in Phase 1, keep global level only.

## Protocol Proposal

## Channel Strategy

Use Bitstream control channel (`0x03`) with new commands for logging control.

### New Commands (proposed)

- `LOG_LEVEL_GET_REQ`
- `LOG_LEVEL_SET_REQ`
- `LOG_LEVEL_GET_ACK`
- `LOG_LEVEL_SET_ACK`

Optional future extension:

- `LOG_FILTER_SET_REQ` / `ACK` (bitmask categories)

### ACK Status (proposed)

- `0x00` OK
- `0x01` invalid payload length
- `0x02` unsupported command/feature not enabled
- `0x03` invalid value
- `0x04` transient busy/failure

## Firmware Design

### Bitstream Isolation Rule (mandatory)

- `bitstream_protocol` and Bitstream services must remain isolated from board/app layers.
- Bitstream modules must not include CM55 app headers directly (for example IPC app or platform logging internals).
- Cross-layer access must go through Bitstream port interfaces only (same pattern as sensor/wifi/diag ports).
- Any runtime logging control implementation in Bitstream must use a dedicated log port file.

### CM55 / Bitstream Layer

- Decode new log control commands.
- Validate payload and map to runtime configuration.
- Send deterministic ACK status for each request.

### Runtime Logging Gate

- Add centralized runtime gate (e.g. `runtime_log_level`).
- Ensure `LOG_*` macros or wrappers check runtime level before emitting output.
- Keep `ERROR` path deterministic and lightweight.

### CM33/CM55 Coordination

- If both cores emit logs, define one authoritative runtime config source.
- Propagate changes via IPC only when needed.
- Keep synchronization explicit and observable.

## Host UI and UX Design

### UI Placement

Add logging controls in an existing settings surface first:

- `AI and System Settings` window, or
- `Diagnostics` panel (if already used by operators)

### Controls

- dropdown: `Firmware Log Level`
- dedicated window: `Firmware Log Control` (opened from top toolbar hamburger menu)
- optional toggles for category filters (Phase 2)
- reset button: `Restore Default`

### Safety UX

- show active level badge (`Log: WARN`)
- if firmware does not support log-level command, show disabled controls and explicit unsupported reason
- optional timeout preset for high-verbosity mode:
  - `DEBUG for 5 min`, then auto-revert to `WARN`

## Performance and Safety Rules

- Default runtime level in production profile: `WARN` (or `ERROR`, depending on validation).
- Apply rate-limiting to repeated identical messages where possible.
- Never allow verbose logging to starve command/ack handling.
- Ensure log control commands still work when log level is `OFF`.

## Backward Compatibility

- Host detects capability via CAPS bit or command probe.
- If unsupported firmware:
  - hide controls, or
  - show controls disabled with clear explanation.
- Existing workflows continue unchanged.

## Test Plan

### Unit Tests

- command encode/decode for GET/SET
- ACK status mapping
- invalid payload and invalid value paths

### Integration Tests

- host sets level -> firmware applies -> host reads back same level
- `OFF` level reduces output while command path remains stable
- reconnect/restart behavior preserves expected default/last policy

### Stress Tests

- compare command latency under `WARN` vs `VERBOSE`
- verify no queue starvation under high telemetry + high log volume

## Rollout Plan

## Phase 1: Global Runtime Level

- implement GET/SET protocol
- implement firmware runtime gate
- host UI dropdown with persistence
- basic tests + docs

### Phase 1 Progress Snapshot

- [x] Draft protocol IDs and ACK format in firmware headers (`LOG_LEVEL_GET_REQ/SET_REQ/ACK`).
- [x] Introduce Bitstream log port module and wire protocol handler through port API.
- [x] Add host command/decoder/session support for log level GET/SET.
- [x] Add host UI control in dedicated `Firmware Log Control` window with async states.
- [x] Add tests and run verification pass.
- [x] Add CAPS capability bit for log-level control (`1<<7`) and host-side capability gating with legacy fallback probe.
- [x] Set host retry policy for log-level GET/SET to single-attempt (`retryCount=0`) to avoid duplicate commands.

## Phase 2: Category Filters

- add category bitmask in firmware and protocol
- add host toggles
- add matrix tests (level x category)

## Phase 3: Diagnostic Presets

- quick presets (`Normal`, `Debug`, `Deep Trace`)
- timed auto-revert for high verbosity
- UX polish and operator guide

## Development To-Do Checklist

Use this list as the authoritative implementation tracker.

### A. Protocol and Types

- [x] Define command IDs and ACK IDs for log control in protocol headers.
- [ ] Define payload structs and constants (level enum, optional category bitmask).
- [x] Add host-side command definitions and payload codecs.
- [x] Add host-side ACK decoders and status-to-error mapping.

### B. Firmware Core Implementation

- [x] Add runtime log level storage and getter/setter API.
- [x] Integrate runtime level gate into logging path.
- [x] Implement CM55 Bitstream handlers for GET/SET.
- [x] Return robust ACK statuses for all failure modes.
- [ ] Validate behavior when log level is `OFF`.

### C. CM33/CM55 IPC Integration

- [ ] Define IPC messages if cross-core synchronization is required.
- [ ] Implement sync path and error handling.
- [ ] Ensure deterministic behavior across reconnect/restart scenarios.

### D. Host UI

- [x] Add log level control UI in dedicated `Firmware Log Control` window.
- [x] Add loading/disabled/error states for async operations.
- [x] Add capability gating (unsupported firmware path + CAPS/fallback).
- [x] Persist selected level in host config store.

### E. Testing and Verification

- [ ] Add unit tests (protocol, decode, validation).
- [x] Add integration tests (set/get/readback).
- [ ] Run stress test with heavy log traffic and command traffic.
- [ ] Verify no regression in Wi-Fi connect/disconnect/status workflows.

### F. Documentation and Release

- [ ] Update protocol specification with final command IDs and payloads.
- [ ] Add operator usage notes for recommended default levels.
- [ ] Add troubleshooting section for high-latency/log-overflow symptoms.
- [ ] Prepare release notes entry (only when explicitly requested).

## Open Questions for Review

- Should production default be `WARN` or `ERROR`?
- Is global-only control sufficient for first delivery, or do we require category filters immediately?
- Should high verbosity auto-revert be mandatory?
- Do we need separate controls for CM33 and CM55 logs, or one unified level?
