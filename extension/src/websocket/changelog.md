## 0.0.7

- Add `T3DWebSocketServer` WebSocket broker supporting multi-client JSON pub/sub (MQTT-style wildcards), binary stream routing, and QoS 0/1/2.
- Add runnable entrypoint `run.ws.server.ts` for starting the broker via `tsx`.
- Add `T3DWebSocketClient` with auto-connect, auto-reconnect, callbacks, and JSON/binary channel support.
- Add `run.ws.client.ts` with 10 examples demonstrating various WebSocket client use cases.
- Add `T3DWebSocketConfig.ts` as a single source of truth for default WS server/client configs.
- Refactor `T3DWebSocketClient` to support Node, Browser, and WebView environments with automatic transport selection.
- Unified binary API using `Uint8Array` (works with Node `Buffer` since it extends `Uint8Array`).
- Add transport abstraction layer (`transport/ws-node.ts`, `transport/ws-browser.ts`) for cross-platform compatibility.
- Add `ARCHITECTURE.md` with comprehensive architecture documentation and mermaid diagrams.
- **SerialPort–WebSocket bridge**: Add `src/serialport-bridge/` with protocol types, `SerialPortWebSocketBridge`, and `run.bridge.ts` (Serial Port only). Bridge streams serial data over `serialport/data` for MCU → UI visualization. Webview hook `useSerialPortOverWs` and SerialPort tester tab (list/open/close/write, live text/hex stream). For dev: run `npm run start:bridge` (runs `run.ws.server.ts` and `src/run.bridge.ts` for both bridges) or run `run.ws.server` and `serialport-bridge/run.bridge.ts` for Serial Port only.

