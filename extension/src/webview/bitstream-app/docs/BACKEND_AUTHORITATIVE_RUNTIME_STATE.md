## Backend-authoritative runtime state (Bitstream, multi-client)

This app is designed for **multiple concurrent clients** (multiple webviews, multiple browsers, refresh/reload) connected to the same broker and (usually) the same physical device.

To be production-ready, anything that must be consistent across clients must be **authoritative in the backend** (the VS Code extension host / SerialPort bridge) **or** converge through **backend-published snapshots** that every client applies identically.

### What belongs in the backend (authoritative)

- **Serial connection truth**
  - Port open/closed, path, baud rate, error string
  - Lease state (`leaseId`, `leaseOwner`)
  - Session epoch (`serialGeneration`) incremented on every physical `open()`
- **Handshake truth**
  - `handshakeState` + `handshakeLastError`, scoped to the current `serialGeneration`
  - The bridge is the single orchestrator (`handshakeManagedByBridge: true`)
- **Device truth / shared configuration (over time)**
  - Rows carried on **`RUNTIME_SNAPSHOT`** (including optional `sensorConfigs` when the bridge populates them)
  - Verified `sensor.cfg.*` reads performed by **MCP** or diagnostics tooling where a strict read-back is required
- **Runtime snapshot for late joiners**
  - A single `RUNTIME_SNAPSHOT` published on connect/open/close/handshake changes so any new client can immediately render correct state

### Bitstream webview (interactive lane)

The dashboard **`HostSession`** is constructed with **`disableWriteAwaitAck: true`** so high-frequency UI controls do not block on CONTROL ACK matching. The webview therefore treats **broker JSON** (`sensor-cfg-updated`, BMI270 topics, `RUNTIME_SNAPSHOT`) plus **live telemetry** as the primary cross-client synchronization mechanism, while still **sending** `sensor.cfg.set` frames toward firmware. This is **not** a replacement for backend serial truth: if the bridge publishes richer `sensorConfigs` or expanded snapshots in the future, clients should prefer those fields when present.

**BS2 / Simulator:** sensor configuration and streaming use **`bitstream2/req`** / **`bitstream2/evt/sensor`**. Ingest is gated by toolbar mode, COM state, and optional sample **`origin`** — see **`../../../../docs/TELEMETRY_MODE_LIFECYCLE.md`** and **`BITSTREAM_SENSOR_DATA_FLOW_AND_STATE.md`** §0.

### What belongs in the frontend (per-client UI state)

- Modal open/close, tab selection, panel collapse state
- Local drafts (slider edits before Apply), transient animations/toasts
- View-only preferences that should not affect other clients

### Production command model: intent → apply → broadcast

For settings that must stay synchronized:

- **Webview:** publish **intent** JSON to peers **immediately** after local store merge; **enqueue** UART `sensor.cfg.set` without awaiting ACK in the UI thread.
- **MCP / automation:** keep **intent → apply → verify (optional) → broadcast** when tools promise audit-grade read-back.
- Backend publishes **`RUNTIME_SNAPSHOT`** so refresh and new tabs inherit the same view of leases, handshake, and optional embedded device rows.

### Concurrency and write ownership (lease gating)

To avoid conflicting writes when multiple dashboards are open:

- Treat the active serial `leaseId` as **write authority**
- Non-owners can be:
  - **read-only** (recommended default for production), or
  - allowed to request take-over (explicit UX), or
  - allowed to send intents that the backend still serializes (less strict, more surprising)

### Refresh behavior (why backend authority matters)

Refresh/reload should never:

- cause duplicate handshakes
- cause the toolbar to flip between “unknown/running/failed” incorrectly
- clear shared configuration state

Because the bridge publishes `RUNTIME_SNAPSHOT`, a reloaded client should:

- subscribe
- render immediately using backend truth
- only show “unknown/running” when a **new physical serialGeneration** starts

