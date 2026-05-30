import { parseProject4TelemetryJson } from "../../webview/project4/lib/project4-telemetry-types";
import type { RegisteredBitstreamMcpTool } from "./bitstream-mcp-tool-registry";
import { getProject4BridgeHttpOrThrow } from "./project4-bridge-http-context";
import {
  project4FetchMove,
  project4FetchSetSpeed,
  project4FetchTelemetryJson,
  type Project4MoveDirection,
} from "./project4-mcu-fetch-node";

const MOVE_DIRS: readonly Project4MoveDirection[] = [
  "W",
  "S",
  "A",
  "D",
  "WA",
  "WD",
  "SA",
  "SD",
  "STOP",
] as const;

const MOVE_SET = new Set<string>(MOVE_DIRS);

function register(
  tools: Map<string, RegisteredBitstreamMcpTool>,
  row: Omit<RegisteredBitstreamMcpTool, "toolId"> & { name: string },
): void {
  tools.set(row.name, { ...row, toolId: row.name });
}

/**
 * Project 4 robot MCP tools (**MCU HTTP**). Handlers read **`Project4McuHttpPayload`** from
 * **`runWithProject4BridgeHttp`** — set by **`ai-bridge-server`** when **`project4McuHttp`** is present.
 */
export function collectProject4McpTools(): Map<string, RegisteredBitstreamMcpTool> {
  const tools = new Map<string, RegisteredBitstreamMcpTool>();

  register(tools, {
    name: "project4_telemetry_get",
    description:
      "Read the latest robot telemetry snapshot via GET /data (wheel speeds vFL–vRR in m/s, IMU ax–az, " +
      "scanner bearings a / aFront / aRear in degrees, obstacle distances df and db in cm). " +
      "Use before advising motion; fields may be zero when firmware omits values.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    handler: async () => {
      const ctx = getProject4BridgeHttpOrThrow();
      const raw = await project4FetchTelemetryJson(ctx);
      const snapshot = parseProject4TelemetryJson(raw);
      if (!snapshot) {
        return { ok: false as const, error: "Telemetry JSON shape not recognized", raw };
      }
      return { ok: true as const, snapshot };
    },
  });

  register(tools, {
    name: "project4_move",
    description:
      "Send a motion command to the robot via GET /move with firmware dir tokens: W S A D WA WD SA SD STOP. " +
      "STOP halts motors. Arc tokens combine forward/back with turn.",
    inputSchema: {
      type: "object",
      properties: {
        dir: {
          type: "string",
          enum: [...MOVE_DIRS],
          description: "Motion token exactly as the microcontroller expects.",
        },
      },
      required: ["dir"],
      additionalProperties: false,
    },
    handler: async (args: unknown) => {
      const ctx = getProject4BridgeHttpOrThrow();
      const dirRaw = typeof (args as { dir?: unknown }).dir === "string" ? (args as { dir: string }).dir : "";
      if (!MOVE_SET.has(dirRaw)) {
        throw new Error(`Invalid dir "${dirRaw}". Expected one of: ${MOVE_DIRS.join(", ")}`);
      }
      return project4FetchMove(ctx, dirRaw as Project4MoveDirection);
    },
  });

  register(tools, {
    name: "project4_set_speed",
    description:
      "Set drive speed preset via GET /setSpeed (val 0–255 per firmware). Lower values reduce commanded speeds.",
    inputSchema: {
      type: "object",
      properties: {
        val: { type: "number", description: "Speed preset 0–255" },
      },
      required: ["val"],
      additionalProperties: false,
    },
    handler: async (args: unknown) => {
      const ctx = getProject4BridgeHttpOrThrow();
      const val = Number((args as { val?: unknown }).val);
      if (!Number.isFinite(val)) {
        throw new Error("val must be a finite number");
      }
      return project4FetchSetSpeed(ctx, val);
    },
  });

  return tools;
}
