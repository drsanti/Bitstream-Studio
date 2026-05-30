import {
  startModelDownloaderBridge,
  stopModelDownloaderBridge,
} from "./ModelDownloaderWebSocketBridge";
import { T3D_MODEL_LOADER_WS_CLIENT_URL } from "../websocket/T3DWebSocketConfig";

const RETRY_DELAY_MS = 1500;
const MAX_RETRIES = 10;

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return undefined;
}

function isConnectionRefused(err: unknown): boolean {
  const e = err as { code?: string; errors?: Array<{ code?: string }> };
  if (e?.code === "ECONNREFUSED" || e?.code === "ECONNRESET") return true;
  const first = e?.errors?.[0];
  return first?.code === "ECONNREFUSED" || first?.code === "ECONNRESET";
}

async function main(): Promise<void> {
  const wsUrl =
    getArg("url") ??
    process.env.T3D_MODEL_BROKER_WS_CLIENT_URL ??
    process.env.T3D_WS_CLIENT_URL ??
    T3D_MODEL_LOADER_WS_CLIENT_URL;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await startModelDownloaderBridge({ wsUrl });
      console.log(`[model-downloader-bridge] connected to ${wsUrl}`);
      break;
    } catch (err) {
      if (isConnectionRefused(err) && attempt < MAX_RETRIES) {
        console.log(
          `[model-downloader-bridge] waiting for server... (${attempt}/${MAX_RETRIES})`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        throw err;
      }
    }
  }

  const shutdown = async () => {
    console.log("[model-downloader-bridge] shutting down...");
    await stopModelDownloaderBridge();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
