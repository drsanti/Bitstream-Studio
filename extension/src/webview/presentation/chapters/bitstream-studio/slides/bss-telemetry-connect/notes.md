**Duration:** ~5 min

**Talking points**
- Bridge must run before any workspace sees samples.
- 921600 is the production UART rate; wrong baud corrupts framing.
- Handshake gates the settings deck — not merely “port open”.
- Simulator path skips COM but still needs bridge + route topic.

**Demo script**
- Open Sensor Telemetry → connect COM → point at connection bar states.
- Jump to `bss-demo-bridge` and confirm handshake passed.

**Q&A prompts**
- What is the difference between WebSocket connected and COM connected?
- When is Simulator the better classroom path?
