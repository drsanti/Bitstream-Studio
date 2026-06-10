import { TelemetryProviderGateway } from "./TelemetryProviderGateway";

async function main(): Promise<void> {
  const gateway = new TelemetryProviderGateway();
  await gateway.start();

  const shutdown = async (signal: string) => {
    console.log(`[telemetry-provider] ${signal} — shutting down`);
    await gateway.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[telemetry-provider] fatal:", err);
  process.exit(1);
});
