## AI Bridge Help (Dev)

This help panel is meant for developers who start the AI Bridge from a terminal.

### PowerShell example

```powershell
$env:T3D_WS_CLIENT_URL="ws://127.0.0.1:9998"
$env:BITSTREAM_SERIAL_PATH="COM3"
$env:BITSTREAM_BAUD_RATE="921600"
$env:BITSTREAM_MODE="data"
$env:BITSTREAM_AUTO_DETECT_PORT="false"
npm run ai:bridge
```

### Notes

> **Tip**  
> Prefer `**--serialPath=COM3`** over `**--path**` because npm may treat `--path` as its own config flag.

> **Tip**  
> If you already run the main app (`npm start`), keep the AI bridge settings aligned with the Bitstream UI:
>
> - Serial broker URL (`T3D_WS_CLIENT_URL`)
> - Selected serial path (`BITSTREAM_SERIAL_PATH`)
> - Baud rate (`BITSTREAM_BAUD_RATE`)

