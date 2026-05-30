import { validateBitstreamMcpDescriptors } from "./descriptor-validator";

function main(): void {
  validateBitstreamMcpDescriptors();
  console.log("[bitstream-mcp] descriptor validation passed");
}

try {
  main();
  process.exit(0);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[bitstream-mcp] descriptor validation failed: ${message}`);
  process.exit(1);
}
