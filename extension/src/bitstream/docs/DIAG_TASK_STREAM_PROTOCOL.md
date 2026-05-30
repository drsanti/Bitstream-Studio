# Diagnostics Task Stream Protocol (Correctness-First)

This document specifies a correctness-first protocol and implementation plan for **Task Diagnostics** streaming over the Bitstream **Diagnostics channel (`0x05`)**.

The primary objective is to **eliminate mis-rendering** (garbled task names, jumping numbers, transient zeros, row identity mismatches) while supporting **high-rate streaming** down to **20ms** and ensuring **sensor streaming remains smooth**.

## Goals

- **Provable correctness**
  - Strict decoding and validation (length, bounds, checksums).
  - Render only from coherent committed snapshots/batches (no partial state leaks).
- **Realtime**
  - User-selectable task update period down to **20ms**.
  - User-selectable **rows per batch**.
- **Bandwidth and scheduling**
  - Preserve sensor throughput (10–20ms typical) at **UART 921600**.
  - Diagnostics must be **best-effort** with throttling and bounded work.
- **User control**
  - Select **Sensor Priority** vs **Diagnostics Priority** mode.
  - Select which tasks to stream via **allow-list** (max 24).
  - Manual **Resync now**.

## Diagnostics scope: Global vs Task

This product uses two related diagnostics scopes:

- **Global diagnostics**: system-wide health and performance indicators (e.g., CPU load, idle %, heap free/min, tick rate, task count).
  - Expected to be **low bandwidth** and safe to keep enabled in most modes.
- **Task diagnostics**: per-task runtime metrics (e.g., CPU% per task, stack watermark, state, flags).
  - **High bandwidth** at high update rates (20–50ms) and must be **bounded and throttleable**.

This document focuses on **Task diagnostics streaming**, but it must coexist with sensor streaming and (optional) global diagnostics.

## Constraints and assumptions (locked)

- **Breaking change OK**: Firmware and host will be updated together for the new task stream format. (No requirement to keep old host working with new firmware.)
- **Task bounds**: up to **24 tasks**.
- **Delta batches**: bounded to a user-chosen **max rows per batch**; typical values:
  - 20ms: **2–3 rows**
  - 50ms: up to **6 rows**
- **Resync policy**
  - Periodic full resync every **2 seconds**
  - Manual resync supported
  - Count-based task-set change detection (`uxTaskGetNumberOfTasks()` changed) triggers immediate resync
- **UI behavior**: **cache previous**
  - If a previous committed snapshot exists, show it while staging new deltas.
  - Commit only after validated boundaries.
- **Failure policy**
  - On CRC/length/version mismatch or missing frames: **drop the batch**, **request full resync immediately**, and **show a banner warning**.

## Terminology

- **Full snapshot**: complete task table (header + all rows + end boundary).
- **Delta batch**: bounded subset of task rows sent at a configured period (20ms..), used for realtime monitoring.
  - “Delta” here means **a bounded update batch** (not necessarily “every changed row”).
- **Epoch/TableId**: monotonically increasing generation counter for the current task set/table.
- **Seq**: per-batch sequence number for deltas (detect drops/out-of-order).

## Transport and scheduling (firmware)

### Traffic tiers

- **Tier A (must not drop):** sensor frames (BMI270 + Magneto high-priority; SHT40 + DPS368 lower priority but must still function at high rate if configured)
- **Tier B:** snapshot diagnostics (CPU/heap) low rate
- **Tier C (best-effort):** task diagnostics (this protocol)

### Scheduling rules

- Drain Tier A before Tier C.
- Enforce **time/byte budgets** for Tier C per interval.
- If sensor backlog/latency rises, **throttle** task diagnostics (increase effective period and/or reduce rows per batch).
- The firmware may clamp requested values and must report **applied** values back to host.

## Isolation and port boundaries (non-negotiable)

Bitstream modules must remain **isolated** from the rest of the firmware/application. Any interaction with RTOS, transport, or platform services must go through **port/adaptor APIs** only.

- **Diagnostics service (`bitstream_diag_service.*`)**
  - Must not call FreeRTOS or platform APIs directly.
  - Must use `bitstream_diag_port_*` for task/tick/heap data and runtime controls.
- **Protocol/transport**
  - May register callbacks or resolvers with diagnostics (e.g., “stack alloc resolver”), but must avoid direct cross-module coupling.
- **Host/UI**
  - UI must not decode bytes directly.
  - Separate layers: **decoder (pure)** → **assembler/state machine (pure)** → **store** → **UI**.

This boundary is critical to prevent future regressions and to keep the Bitstream subsystem portable and testable.

### Host decoding location (recommended)

For this task stream, **byte-level decoding and assembly must run in the backend/host runtime** (Node side, near the serial bridge), not in the browser/webview.

- Backend responsibilities:
  - Decode raw frames (strict length/bounds checks)
  - Validate CRC16 and invariants
  - Assemble snapshot/batch boundaries (epoch/seq)
  - Apply throttling/backpressure decisions
  - Publish **structured JSON events** to the webview
- Webview responsibilities:
  - Render from committed snapshots/batches only
  - Expose UI controls (period, rows per batch, priority mode, allow-list)
  - Display health banners/counters from backend

### Task batch framing v2 (`0x91` … `0x83` … `0x93`) — **implemented**

Used for **GET_TASK_TABLE** and **diagnostics stream** task batches (CM55 `bitstream_diag_service.c`).

| Event | ID | Payload length | CRC16-CCITT (poly `0x1021`, init `0xFFFF`) |
|------|-----|----------------|--------------------------------------------|
| **Snapshot header** | `0x91` | **15** | CRC covers bytes **`[0..12]`**; CRC is **u16 LE** at **`[13..14]`** |
| **Task row** | `0x83` | **32 + nameLen** (legacy) or **+2** with CRC | If extended: CRC covers **`[0 .. 31+nameLen-1]`**; CRC at end **LE** |
| **Snapshot end** | `0x93` | **9** | CRC covers bytes **`[0..6]`**; CRC is **u16 LE** at **`[7..8]`** |

**`0x91` layout (LE fields):** `[0]=0x91`, `[1]=diag_major`, `[2]=diag_minor`, `[3..4]=epoch`, `[5..6]=seq`, `[7..10]=timestamp_ms`, `[11..12]=rows_in_batch`, `[13..14]=crc`.

**`0x93` layout:** `[0]=0x93`, `[1]=diag_major`, `[2]=diag_minor`, `[3..4]=epoch`, `[5..6]=seq`, `[7..8]=crc`.

**Bridge behaviour (`SerialPortWebSocketBridge`):** On **`0x91`**, start a **v2 batch** (completion requires **`0x93`**). **`0x82`** remains supported as **legacy** (completion when row count reaches header count).

### Task row `0x83` + ASCII policy

Firmware **`bitstream_diag_build_task_item_payload`** appends **row CRC16** after the fixed 26-byte tail.

**Host decode (single module):** `src/bitstream/utils/diagTaskRow0x83.ts`

- Accepts **legacy** payloads **without** trailing CRC (length `32 + nameLen`) and **current** payloads **with** CRC (+2 bytes).
- Printable ASCII names only (`0x20`–`0x7E`); other bytes → `?`.

**Batch header/end helpers:** `src/bitstream/utils/diagTaskBatchV2.ts` (`tryDecodeDiagTaskSnapshotHeader0x91`, `tryDecodeDiagTaskSnapshotEnd0x93`).

## User controls

### 1) Stream configuration

Host sets:
- `requestedPeriodMs` (minimum **20ms**)
- `requestedMaxRowsPerBatch` (user-chosen; firmware clamps)
- `priorityMode`:
  - **Sensor Priority** (default): throttle task stream first
  - **Diagnostics Priority**: allow more task bandwidth but never starve sensors

Host UI must display:
- **Requested** vs **Effective** period/rows (when firmware clamps or auto-throttles).

### 2) Task allow-list (selection filter)

- Mode: **allow-list**
- Max size: **24 tasks**
- Encoding: **fixed 24-byte ASCII per task name**
  - Null-terminated or padded with `0x00`
  - Non-printable bytes are invalid
- When new tasks appear (task count changed): **do not auto-include**
  - UI shows a notice and lets user update selection

## Protocol overview (Diagnostics channel `0x05`)

### New message set (names, IDs, and exact byte layouts)

Implementation will define **new event IDs** and command IDs under channel `0x05` with:
- **Full snapshot**: `TaskTableSnapshotHeader`, `TaskTableSnapshotRow`, `TaskTableSnapshotEnd`
- **Delta batch**: `TaskDeltaBatchHeader`, `TaskDeltaBatchRow`, `TaskDeltaBatchEnd`
- **Task-set changed**: `TaskSetChangedEvent`
- **Control commands**:
  - `TaskStreamConfigSet` (period/rows/priorityMode)
  - `TaskStreamFilterSet` (allow-list names)
  - `TaskStreamResyncNow` (manual request)

> Note: We intentionally avoid using the label “v2” in UI/docs. Versioning is done via `diagMajor/diagMinor` and/or explicit event IDs.

### Row identity

- Primary key for host rendering: **`taskId` (u16)** derived from firmware (`xTaskNumber`).
- Correctness guard:
  - If task-set changes (count changed), firmware bumps `tableEpoch` and sends a full snapshot.
  - Host rejects any delta batch with a mismatched `tableEpoch`.

## Host assembly model (staging + commit)

Host must not render directly from individual frames.

### Full snapshot pipeline

1. Receive `SnapshotHeader(tableEpoch, taskCount, ...)`.
2. Collect `taskCount` `SnapshotRow` frames.
3. Receive `SnapshotEnd` boundary.
4. Validate:
   - header/row lengths
   - CRCs (per-frame and/or batch)
   - bounds (taskCount <= 24)
   - state enum range
   - cpuPctX100 in 0..10000
5. Commit an immutable snapshot to the store.

### Delta batch pipeline

1. Receive `DeltaHeader(tableEpoch, seq, rowCount, ...)`.
2. Collect `rowCount` `DeltaRow` frames (bounded by `maxRowsPerBatch`).
3. Receive `DeltaEnd` boundary.
4. Validate:
   - `tableEpoch` matches current snapshot
   - `seq` is continuous (or handle gaps as drop+resync)
   - CRCs and lengths are valid
5. Apply to a staging copy and commit as a single atomic update.

### Failure handling (mandatory)

On any validation failure:
- Drop the current batch
- Trigger **Resync now**
- Display a warning banner with:
  - last error
  - dropped batch count
  - last resync time

## Byte layout (to be finalized)

This section will be filled with **exact offsets**, endianness, sentinel values, and CRC polynomial once we implement the encoder/decoder pair.

Checklist for the layout:
- Fixed-size header fields
- Fixed-size row fields
- Explicit sentinel values for unavailable metrics (no “fake values”)
- CRC16 (or CRC32) per frame (minimum) and optional per-batch

## Implementation TODOs (tracking)

### Spec and shared utilities

### Spec and shared utilities

- [ ] Define final event IDs and command IDs for task stream under diagnostics channel `0x05`
- [ ] Finalize byte layout for every frame (snapshot header/row/end; delta header/row/end; task-set changed; ACKs)
- [ ] Choose CRC algorithm (CRC16 vs CRC32), polynomial, and shared implementation location (firmware + host)

### Firmware

- [ ] Implement task-set change detection (count-based) and `tableEpoch` bump
- [ ] Implement full snapshot encoder with strict ASCII name handling (fixed 24-byte)
- [ ] Implement delta batch encoder (row-level deltas; bounded row count)
- [ ] Implement stream config (period, rows-per-batch, priority mode) with applied-value ACK
- [ ] Implement allow-list filter set (fixed 24-byte names) + ACK
- [ ] Implement manual resync command
- [ ] Add TX scheduling/budget so sensor frames are not impacted (Tier A > Tier C)

### Host / Webview

- [ ] Implement decoders with strict validation (length/bounds/CRC)
- [ ] Implement TaskStreamAssembler (staging + commit, epoch/seq, drop+resync)
- [ ] Add store shape for committed snapshot + stream health counters
- [ ] Add UI controls: period (min 20ms), max rows per batch, priority mode
- [ ] Add UI task selector (allow-list) + debounce send
- [ ] Add warning banner for invalid data / dropped batches + manual resync button
- [ ] Ensure task stream stops when diagnostics window is closed; keep CPU snapshot minimal

### Tests and verification

- [ ] Add golden-frame fixtures (captured from real firmware) and unit tests for decoders
- [ ] Add invariant tests (cpuPctX100 bounds, enum bounds, CRC failure behavior)
- [ ] Add integration smoke test: heavy sensors streaming + task stream at 20ms with throttling

## Appendix: Sensor priority policy (product-level)

- **High priority sensors**: BMI270 and Magneto (BMM350)
- **Lower priority sensors**: SHT40 and DPS368
- Default intervals:
  - High priority: often 10–20ms
  - Lower priority: often 50–100ms (but must support down to 10ms if configured)

Task diagnostics must not starve sensor streaming; user may select a diagnostics-oriented mode, but sensors retain a hard minimum service guarantee.
