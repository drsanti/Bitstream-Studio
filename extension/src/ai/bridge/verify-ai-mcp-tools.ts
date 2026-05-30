/**
 * Sanity check: Bitstream + Project 4 MCP tool registries load (merged when **`enableMcpTools`** + **`project4McuHttp`**).
 * Run: `npx tsx src/ai/bridge/verify-ai-mcp-tools.ts`
 */
import { collectBitstreamMcpTools } from "./bitstream-mcp-tool-registry";
import { collectProject4McpTools } from "./project4-mcp-tool-registry";

const tools = collectBitstreamMcpTools({ getSession: () => null });
const ids = [...tools.keys()].sort();
// eslint-disable-next-line no-console -- CLI diagnostic
console.log(`[verify-ai-mcp-tools] Bitstream OK: ${ids.length} tools`);
// eslint-disable-next-line no-console -- CLI diagnostic
console.log(ids.join(", "));

const p4 = collectProject4McpTools();
const p4Ids = [...p4.keys()].sort();
// eslint-disable-next-line no-console -- CLI diagnostic
console.log(`[verify-ai-mcp-tools] Project4 OK: ${p4Ids.length} tools`);
// eslint-disable-next-line no-console -- CLI diagnostic
console.log(p4Ids.join(", "));
