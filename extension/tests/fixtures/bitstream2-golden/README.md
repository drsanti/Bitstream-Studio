# Bitstream2 golden wire captures

JSON fixtures for decode parity tests (`tests/bitstream2/golden-parity.test.ts`).

Regenerate from encoders:

```bash
npm run bitstream2:golden:gen
```

## Adding real MCU captures

1. Log base64 UART RX from the bridge (`serialport/data`) for a known frame.
2. Add `{id}.json` with `wireB64` and `expect` fields matching `golden-parity.test.ts`.
3. Run `npm run test:bitstream2`.

Keep fixtures small (single HELLO, single EVT_SENSOR, etc.).
