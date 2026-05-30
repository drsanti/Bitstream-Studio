# Bitstream User Manual

## 1. What This Is

`bitstream` is a transport-agnostic protocol library for host and firmware communication.

It provides:

- Binary frame encode and decode
- Request and ACK matching by sequence
- Timeout and retry handling
- Typed event parsing
- Transport abstraction for SerialPort, Web Serial, MQTT, or custom sources

It does not require CLI.

## 2. Intended Usage

Use `bitstream` when you need reliable command and event exchange with firmware, while keeping transport interchangeable.

Typical transports:

- Node SerialPort
- Web Serial API
- MQTT
- Serial-over-WebSocket bridge

## 3. Copy-and-Paste Portability

The module is designed so another project can copy the `src/bitstream` folder and use it as a library.

Minimum portability rules:

- Keep `bitstream` self-contained.
- Do not import app-specific modules outside `src/bitstream`.
- Expose public API from `src/bitstream/index.ts`.
- Use adapter interfaces for all transport interactions.

## 4. Recommended Folder Layout

```text
src/
`-- bitstream/
    |-- index.ts
    |-- README.md
    |-- USER_MANUAL.md
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
        |-- adapter-serial-ws.ts
        |-- adapter-node-serialport.ts
        |-- adapter-web-serial.ts
        `-- adapter-mqtt.ts
```

## 5. Public API (Suggested)

Export from `src/bitstream/index.ts` only:

- FrameEncoder
- FrameDecoder
- ProtocolEngine
- HostSession
- TransportAdapter interface
- Protocol types and error types

This keeps consumers independent from internal file structure changes.

## 6. Transport Adapter Contract

Every transport adapter should implement:

- `open(): Promise<void>`
- `close(): Promise<void>`
- `write(bytes: Uint8Array): Promise<void>`
- `onData(handler: (bytes: Uint8Array) => void): () => void`
- `onState(handler: (state: TransportState) => void): () => void`

Rules:

- Adapter does not parse protocol frames.
- Adapter only moves bytes and state.
- Protocol behavior stays in the bitstream core.

## 7. Quick Start

### 7.1 Create Session

1. Instantiate your adapter.
2. Instantiate `HostSession` with the adapter.
3. Open transport.
4. Run handshake.
5. Send commands and subscribe events.

Pseudo-flow:

```text
adapter = new SomeTransportAdapter(config)
session = new HostSession({ transport: adapter, timeoutPolicy: { timeoutMs: 8000, retryCount: 2 } })

await session.open()
await runHandshakeSequence(session, { protocolVersion: 2, pingNonce: 0x7f })

ack = await session.sendPing("req-1", 0x7f)

unsubscribe = session.onEvent((evt) => {
  // handle sensor/diagnostic event
})
```

Notes:

- Control-channel requests include a `corrId` that is echoed back in ACKs (see `FRAME_PROTOCOL_SPECIFICATION.md`).
- In multi-client setups, the backend bridge may rewrite `corrId` on TX to avoid collisions across clients. Treat `corrId` as opaque.

### 7.2 Close Session

```text
unsubscribe()
await session.close()
```

## 8. Integration Patterns

### 8.1 Node SerialPort

- Adapter wraps serial port open/close/write and data callbacks.
- Send raw bytes directly.

### 8.2 Web Serial

- Adapter wraps `navigator.serial`.
- Uses `ReadableStream` and `WritableStream`.
- Passes `Uint8Array` chunks to `bitstream`.

### 8.3 MQTT

- Adapter subscribes to payload topic(s).
- Adapter writes encoded frame bytes to publish topic(s).
- Topic envelope is transport-level only.

## 9. Error Handling

Recommended errors exposed by `bitstream`:

- `TRANSPORT_CLOSED`
- `TIMEOUT`
- `ACK_SEQUENCE_MISMATCH`
- `INVALID_ACK_PAYLOAD`
- `PROTOCOL_STATUS_ERROR`
- `DECODE_ERROR`
- `UNSUPPORTED_PROTOCOL_VERSION`

For each error, include:

- command ID
- sequence/request ID
- transport name
- raw status code if available

## 10. Testing Guidance

Minimum test set before release:

1. Frame encode/decode vectors.
2. Parser split-chunk and re-sync behavior.
3. Sequence-based request/ACK matching.
4. Timeout and retry behavior.
5. Adapter contract conformance with mocked transport.

## 11. Migration to Another Project

Checklist:

1. Copy `src/bitstream`.
2. Ensure TS config resolves copied files.
3. Implement at least one transport adapter.
4. Call only public API from `index.ts`.
5. Run vector and integration tests.

## 12. Troubleshooting

### 12.1 No ACK received

- Check adapter `onData` is wired.
- Verify channel and sequence matching.
- Increase timeout and inspect raw frame logs.

### 12.2 Parser drops frames

- Verify magic and payload-length parsing logic.
- Ensure little-endian reads.
- Validate that transport payload is unmodified bytes.

### 12.3 Works in one transport but not another

- Compare raw outbound and inbound frame bytes.
- Confirm adapter does not transform data unexpectedly.
- Confirm identical protocol version and capabilities.

## 13. Related Documents

- [src/bitstream/docs/TRANSPORT_AGNOSTIC_PROTOCOL_ARCHITECTURE.md](./TRANSPORT_AGNOSTIC_PROTOCOL_ARCHITECTURE.md)
- [src/bitstream/docs/FRAME_PROTOCOL_SPECIFICATION.md](./FRAME_PROTOCOL_SPECIFICATION.md)

## 14. Webview Bitstream App Shell

The extension webview entry composes `BitstreamAppMain` from `src/webview/bitstream-app` (see that folder’s `README.md`). The current UI is the header/shell demo plus shared Zustand stores (`bitstreamConnection`, `bitstreamLive`, `bitstreamConfig`) and session/handshake hooks; additional product screens can import the same stores and hooks from that module when integrating with the main app.

### 14.1 Interactive CONTROL lane (no ACK wait)

The dashboard constructs **`HostSession`** with **`disableWriteAwaitAck: true`** (see `useBitstreamSession`). Sensor configuration changes merge into **`useBitstreamDeviceSensorConfigStore`**, publish **`serialport/sensor-cfg-updated`** for peer webviews, and send **`sensor.cfg.set`** without awaiting the CONTROL ACK envelope in the UI. **Wi‑Fi** scans/connect and **firmware log level** set similarly use **no-ACK** send helpers. This does **not** change the on-wire Bitstream frame format — firmware may still emit ACKs — and **CLI / MCP** hosts should continue to use the default ACK-awaiting session mode unless they explicitly opt into the same pattern.

## 15. Extension UI: serial ports, persistence, and host mirror

These behaviors live in the webview Bitstream shell (`BitstreamAppWrapper`, `bitstreamConfig.store`) and the extension host (`TernionDigitalTwin` message handling), not inside the portable `src/bitstream` library. **Serial port list UI was removed (2026-05-27)** — see `BITSTREAM_WEBVIEW_TRANSPORT_SIMULATOR_ONLY.md`.

### 15.1 Hamburger → Serial port list

- Opens a draggable window listing ports from the serial bridge, with **drag-reorder** (display order), **whitelist** toggles, and **Refresh** to re-query the bridge.
- Choosing **Use this port** on a card (or equivalent select action) runs **disconnect → set target path → connect** so the next session uses that COM/device path; **auto-handshake** still runs through the existing handshake hook after transport is ready.

### 15.2 Webview `localStorage` key

- Persisted dashboard fields (WS URL, serial path, port order, whitelist, baud text, diag text fields) are saved under the key **`bitstream-dashboard-config-v2`** (see `BITSTREAM_DASHBOARD_CONFIG_STORAGE_KEY` in `bitstreamConfig.store.ts`).

### 15.3 VS Code globalStorage JSON mirror

- In the **VS Code extension webview** only, the same persisted object is mirrored to a file **`bitstream-dashboard-config.json`** under the extension’s **`globalStorageUri`**, so external tools or a backend can read/write the same shape as the webview store JSON.
- The webview issues **`bitstream-dashboard-config-pull`** on install and **`bitstream-dashboard-config-push`** after debounced local store changes; the host replies with **`bitstream-dashboard-config-response`** (`configJson` string, or `configJson: null` when the file is missing or empty). If reading the mirror file fails for a reason other than **ENOENT** (missing file), the response includes **`error`** with a short message so the webview can surface a pull failure.
- **Debug strip**: when `import.meta.env.DEV` is true (Vite dev) or `localStorage.setItem('ternion.bitstreamMirrorDebug','1')` is set in the webview, the Bitstream shell shows a one-line **Mirror:** status (pulling / synced / no file / error).

### 15.4 Serial Port Admin window

- Opened from the Bitstream shell hamburger (**Port Admin**) or other callers of `usePortAdminStore().open()`.
- **`SystemSerialportInfo`** uses **`TRNWindow`** and `usePortAdminController`; whenever **`isOpen`** becomes **`true`**, the controller runs **`refreshPorts()`** automatically so the table reflects the latest bridge/OS list without an extra click.
- Manual **Refresh** in the port list header still triggers the same `refreshPorts()` path.
