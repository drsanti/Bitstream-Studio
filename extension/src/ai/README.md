# AI Bridge (Bitstream Assistant WebSocket)

The AI bridge is a **Node process** that listens for WebSocket clients on **`AI_BRIDGE_PORT`** (default **9987**). Typical webview clients are **AI Dev Trace** and the **Sensor Studio Assistant** chat panel; the assistant UI is toggled from the **Bitstream Digital Twin** toolbar / hamburger when **`?app=sensor-studio`** (see **`docs/DEVELOPMENT_COMMANDS.md`**).

## `npm start` (default stack)

**`npm start`** runs **`start:inner`**, which starts three **`concurrently`** lanes:

1. **`start:bridge`** — combined broker / serial side (**9998**).
2. **`dev:all`** — extension watch + Vite.
3. **`ai:bridge:no-serial`** — assistant WS (**9987**) **without** `HostSession` attach (avoids competing with the combined bridge for serial in typical setups).
4. **`start:model-downloader-bridge`** — model broker (**9999**) + model bridge.

In full mode, `npm start` also defaults `BITSTREAM2_DEV_LOOPBACK=1` so Simulator dev works without hardware. Set `BITSTREAM2_DEV_LOOPBACK=0` to force real UART workflows.

So **one command** brings up the assistant WebSocket for chat/UI. Set **`ANTHROPIC_API_KEY`** in the environment for the spawned process (same as running the bridge manually).

To **omit** the AI process (lighter logs / RAM), use **`npm run start:inner:no-ai`** or set **`DEV_SUPERVISOR_CMD`** to that script when using the supervisor.

## When to run `ai:bridge` instead of the bundled no-serial lane

**`npm start`** already occupies **`AI_BRIDGE_PORT`** (default **9987**) with **`ai:bridge:no-serial`**. You **cannot** run a second AI bridge on the same port.

Use **`npm run ai:bridge`** (alias **`bitstream:assistant`**) when you need **`HostSession`** / firmware-backed tools **with** broker attach: prefer **`npm run start:inner:no-ai`** then **`npm run ai:bridge`** in another terminal, **or** override **`AI_BRIDGE_PORT`** on one side and align the webview URL.

See **`docs/DEVELOPMENT_COMMANDS.md`**.

### Same as “no serial” lane in `npm start`

```bash
npm run ai:bridge:no-serial
```

Equivalent to **`--no-bitstream`** — skips `HostSession` attach; used internally by **`npm start`**.

## Typical dev layout (split terminals, optional)

If you prefer separate terminals instead of **`npm start`**:

| Terminal | Command | Purpose |
|----------|---------|---------|
| **1** | `npm run start:bridge` | WebSocket broker + serial bridge (**9998**) |
| **2** | `npm run dev` | Extension watch + Vite |
| **3** | `npm run bitstream:assistant` | AI bridge (**9987**) with attach (see flags) |

Aliases: **`npm run ai:bridge`** (same as **`bitstream:assistant`**).

### Anthropic

Set **`ANTHROPIC_API_KEY`** in the environment for the bridge process. Optional: **`ANTHROPIC_MODEL`**, **`AI_BRIDGE_PORT`**, **`AI_BRIDGE_PAIRING_TOKEN`**.

WebSocket **`ai/request`** supports **`enableMcpTools: true`** to register Bitstream MCP tools with the model (used by **AI Dev Trace**). **Sensor Studio** omits it so requests stay **plain chat** until you opt in on the client.

### VS Code extension

The extension can start/stop the bridge via commands (**Start AI Bridge** / **Stop AI Bridge**); pairing token is injected into the webview as **`window.T3D_AI_BRIDGE_PAIRING_TOKEN`**.

### MCP (Cursor / Claude Desktop)

That path uses **`npm run bitstream:mcp:stdio`**, not this WebSocket server. See **`docs/DEVELOPMENT_COMMANDS.md`** and **`src/webview/bitstream-app/docs/BITSTREAM_SERIAL_AND_BROKER_DATA_FLOW.md`**.
