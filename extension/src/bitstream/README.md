# bitstream

Self-contained, transport-agnostic protocol library for host <-> firmware communication.

## Goals

- Reliable binary frame encode/decode
- Request and ACK matching by sequence
- Timeout and retry handling
- Typed event decoding
- Transport independence via adapter interface

No CLI dependency is required.

## What Is Inside

```text
bitstream/
|-- README.md
|-- index.ts
|-- frame/
|   |-- frame-types.ts
|   |-- frame-encoder.ts
|   `-- frame-decoder.ts
|-- engine/
|   |-- protocol-engine.ts
|   |-- request-tracker.ts
|   `-- timeout-policy.ts
|-- commands/
|   |-- command-types.ts
|   |-- handshake-commands.ts
|   |-- sensor-commands.ts
|   `-- diagnostics-commands.ts
|-- events/
|   |-- event-types.ts
|   `-- event-decoder.ts
|-- session/
|   `-- host-session.ts
`-- transport/
    |-- transport-adapter.ts
  |-- in-memory-transport.ts
  |-- serial-bridge-transport.ts
  `-- web-serial-transport.ts
```

## Public API Rule

Expose consumer API only from `index.ts`.

Consumers should import only from:

- `bitstream/index.ts`

This allows internal refactor without breaking external usage.

## Transport Adapter Contract

Each adapter should provide:

- `open(): Promise<void>`
- `close(): Promise<void>`
- `write(bytes: Uint8Array): Promise<void>`
- `onData(handler: (bytes: Uint8Array) => void): () => void`
- `onState(handler: (state: TransportState) => void): () => void`

Adapters must move bytes only and must not parse protocol frames.

## Quick Start (Pseudo)

```text
transport = new SomeTransportAdapter(config)
session = new HostSession({
  transport,
  timeoutPolicy: { timeoutMs: 3000, retryCount: 2 },
})

await session.open()

ackFrame = await session.send({
  requestId: "req-1",
  channel: 0x03,
  commandId: 0x02, // PING_REQ
  payload: <bytes>,
})

Note: on the control channel (`0x03`), payloads include a `corrId` (u16 LE) that is echoed in ACKs. See `docs/FRAME_PROTOCOL_SPECIFICATION.md`.

unsubscribe = session.onFrame((frame) => {
  // inspect all inbound frames (acks + async events)
})

unsubscribe()
await session.close()
```

### Extension webview vs other consumers

The portable **`HostSession`** constructor accepts **`disableWriteAwaitAck`**. The Bitstream **VS Code webview** sets this to **`true`** so interactive CONTROL commands (sensor cfg, Wi‑Fi intents, etc.) use **`transport.write`** instead of **`writeAwaitAck`**. **CLI probes**, **MCP**, and unit tests should keep the default (**await ACK**) unless you intentionally mirror the webview behavior.

```text
transport = new SomeTransportAdapter(config)
session = new HostSession({
  transport,
  timeoutPolicy: { timeoutMs: 3000, retryCount: 2 },
  disableWriteAwaitAck: true, // webview-only pattern; omit for CLI/MCP
})
```

## Current vs Planned Adapters

Current:

- `in-memory-transport.ts` for local integration tests and simulation
- `serial-bridge-transport.ts` for current SerialPort-over-WS bridge runtime
- `web-serial-transport.ts` for browser-native Web Serial transport

Planned:

- mqtt adapter

## Copy to Another Project

1. Copy the entire `bitstream` folder.
2. Ensure your TS config includes the folder.
3. Implement at least one transport adapter.
4. Import from `index.ts` only.
5. Run protocol vector tests.

## Dependency Boundaries

Inside `bitstream`, do not import app-specific modules (UI stores, VS Code APIs, or extension-only paths).

Allowed dependencies:

- language/runtime standard library
- stable dependencies declared for the library itself

## Related Docs

- `docs/TRANSPORT_AGNOSTIC_PROTOCOL_ARCHITECTURE.md`
- `docs/FRAME_PROTOCOL_SPECIFICATION.md`
- `docs/BITSTREAM_USER_MANUAL.md` (includes **§14–§15** extension webview shell, persistence, and host JSON mirror)
- `docs/STREAMSIGHT_REFERENCE_SYNC.md`

## Extension and webview (outside this folder)

The **VS Code extension** composes a Bitstream **webview app** under `src/webview/bitstream-app` (Zustand stores, session/handshake hooks, serial port list, Port Admin entry). That UI is **not** part of the portable `bitstream` package; it imports this library via `../../bitstream/...`. See:

- [`../webview/bitstream-app/README.md`](../webview/bitstream-app/README.md)
