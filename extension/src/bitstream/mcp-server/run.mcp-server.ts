import { startBitstreamMcpStdioServerFromRuntime } from "./sdk-stdio-server";
import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";
import {
  parseBitstreamAttachCliOptions,
  openBitstreamBs2SessionFromCliOptions,
  type BitstreamAttachCliOptions,
} from "./bitstream-bs2-session-attach";

async function main(): Promise<void> {
  const parsedOptions = parseBitstreamAttachCliOptions();
  const options: BitstreamAttachCliOptions = {
    ...parsedOptions,
    path: parsedOptions.path ?? undefined,
  };
  let session: Bs2BrokerSession | null = null;

  const opened = await openBitstreamBs2SessionFromCliOptions(options, "[bitstream-mcp]");
  if (opened) {
    session = opened.session;
    options.path = opened.effectiveOptions.path;
  }

  await startBitstreamMcpStdioServerFromRuntime({
    getSession: () => session,
    isRuntimeReady: () => session !== null,
    getRuntimeSummary: () => ({
      wsUrl: options.wsUrl,
      serialPath: options.path ?? null,
      allowManufacturers: options.allowManufacturers,
      denyPatterns: options.denyPatterns,
      baudRate: options.baudRate,
      mode: options.mode,
      sessionAttached: session !== null,
    }),
  });
  console.error("Bitstream MCP stdio server is running.");

  const shutdown = async (): Promise<void> => {
    if (!session) {
      return;
    }
    try {
      await session.disconnect();
    } catch (error) {
      console.error("[bitstream-mcp] session close failed:", error);
    }
    session = null;
  };

  process.on("SIGINT", () => {
    void shutdown().finally(() => process.exit(0));
  });
  process.on("SIGTERM", () => {
    void shutdown().finally(() => process.exit(0));
  });
}

main().catch((error) => {
  console.error("Failed to start Bitstream MCP stdio server:", error);
  process.exit(1);
});
