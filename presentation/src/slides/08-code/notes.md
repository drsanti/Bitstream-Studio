# Slide 08 — Code & Protocol

**Key talking points:**

- Full data path: BMI270 (SPI) → MCU (Zephyr) → UART bridge → T3D WS broker → any host client
- The WebSocket broker at port 9998 is a **topic-based pub/sub bus** — not HTTP
- Any language can subscribe: Python, JavaScript, Go, Rust — just open a WebSocket and send JSON

**Wire format details:**

- `mask` is a bitmask, not an enum — a single message can contain ACC + GYR + EULER together
- `values[]` is a flat int32 array — parse in canonical order based on mask bits
- Scale factors: ACC `÷100 ÷ 9.80665` → g; GYR `÷100 × (180/π)` → °/s

**Firmware side:**

- BMI270 connected over SPI at 10 MHz on Zephyr RTOS
- Data-ready interrupt triggers a DMA transfer — no polling overhead
- Typical latency from sensor to host: **< 5 ms**

**Quick start for attendees:**

```typescript
const ws = new WebSocket('ws://127.0.0.1:9998')
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'subscribe', topic: 'bitstream2/evt/sensor', channel: 'json' }))
}
ws.onmessage = (evt) => {
  const { type, topic, payload } = JSON.parse(evt.data)
  if (type === 'message') console.log(payload.values)
}
```

**Next steps for attendees:**

1. Clone Bitstream Studio, run `npm run dev` in the extension folder
2. Open VS Code, press F5 to launch the extension host
3. Connect the IMU board — data starts flowing automatically
