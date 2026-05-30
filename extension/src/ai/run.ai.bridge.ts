import { AiBridgeServer } from "./bridge/ai-bridge-server";
import {
  openBitstreamBs2SessionFromCliOptions,
  parseBitstreamAttachCliOptions,
} from "../bitstream/mcp-server/bitstream-bs2-session-attach";
import type { Bs2BrokerSession } from "../bitstream2/bridge/bs2-broker-session";

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function main() {
  const argv = process.argv.slice(2);
  const noBitstream =
    argv.includes("--no-bitstream") ||
    process.env.AI_BRIDGE_NO_BITSTREAM === "1" ||
    process.env.AI_BRIDGE_NO_SERIAL === "1";

  const host = process.env.AI_BRIDGE_BIND ?? "0.0.0.0";
  const port = envNumber("AI_BRIDGE_PORT", 9987);
  const pairingToken = process.env.AI_BRIDGE_PAIRING_TOKEN || undefined;

  const attachOptions = parseBitstreamAttachCliOptions(argv);
  let session: Bs2BrokerSession | null = null;
  let attachInFlight: Promise<Bs2BrokerSession | null> | null = null;
  let lastAttachError: string | null = null;

  const ensureSession = async (): Promise<Bs2BrokerSession | null> => {
    if (noBitstream) {
      return null;
    }
    if (session) {
      return session;
    }
    if (attachInFlight) {
      return attachInFlight;
    }
    attachInFlight = (async () => {
      try {
        const opened = await openBitstreamBs2SessionFromCliOptions(
          attachOptions,
          "[ai-bridge]",
        );
        session = opened?.session ?? null;
        if (session) {
          lastAttachError = null;
          return session;
        }

        // When open returns null, it already logged a reason; provide a user-facing hint here.
        const hint =
          attachOptions.path
            ? `Attach returned no session for --path=${attachOptions.path}`
            : attachOptions.autoDetectPort
              ? "Auto-detect found no HELLO-verified BS2 broker candidate. Set BITSTREAM_SERIAL_PATH=COMx or pass --path=COMx."
              : "No serial port selected. Set BITSTREAM_SERIAL_PATH=COMx or pass --path=COMx.";
        lastAttachError = hint;
        throw new Error(hint);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[ai-bridge] Bitstream BS2 session attach failed: ${msg}`);
        session = null;
        lastAttachError = msg;
        throw new Error(msg);
      } finally {
        attachInFlight = null;
      }
    })();
    return attachInFlight;
  };

  const server = new AiBridgeServer({
    host,
    port,
    pairingToken,
    confirmTtlMs: envNumber("AI_BRIDGE_CONFIRM_TTL_MS", 60_000),
    getSession: () => session,
    ensureSession,
    bitstreamMcpAttachAvailable: !noBitstream,
  });

  if (noBitstream) {
    console.error("[ai-bridge] Bitstream serial attach disabled (--no-bitstream or AI_BRIDGE_NO_BITSTREAM=1)");
  }
  console.error(
    `[ai-bridge] WS listening on ws://${host}:${port} (pairingToken=${pairingToken ? "set" : "off"})`,
  );

  const shutdown = async () => {
    console.error("[ai-bridge] shutting down...");
    try {
      await server.close();
    } catch {}
    try {
      await session?.close();
    } catch {}
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

void main();

