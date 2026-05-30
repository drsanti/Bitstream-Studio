export type BitstreamMcpToolRiskLevel = "read_only" | "risky";

export interface BitstreamMcpToolRiskInfo {
  toolId: string;
  level: BitstreamMcpToolRiskLevel;
  reason: string;
  userFacingWarning: string;
}

/**
 * IMPORTANT:
 * - We only classify tools from the Bitstream MCP server.
 * - Risk is explicit allowlist (Option A).
 */
export const BITSTREAM_MCP_TOOL_IDS = [
  "bitstream_run_command",
  "bitstream_control_ops",
  "bitstream_diag_snapshot_get",
  "bitstream_diag_fault_events_get",
  "bitstream_diag_task_table_get",
  "bitstream_diag_task_priority_set",
  "bitstream_health_check",
  "bitstream_sensor_status_get",
  "bitstream_sensor_latest_samples_get",
  "bitstream_sensor_config_get",
  "bitstream_sensor_start_stop_set",
  "bitstream_sensor_start_stop_set_bulk",
] as const;

export type BitstreamMcpToolId = (typeof BITSTREAM_MCP_TOOL_IDS)[number];

/**
 * Explicit allowlist of risky tools.
 *
 * Default is "read-only" unless in this set.
 */
export const BITSTREAM_MCP_RISKY_TOOL_IDS: ReadonlySet<string> = new Set<string>([
  // Generic command runner can mutate device state (anything).
  "bitstream_run_command",

  // Includes "sensor_reinit" op which can disrupt runtime.
  "bitstream_control_ops",

  // Mutates sensor enabled state (writes sensor.cfg.set).
  "bitstream_sensor_start_stop_set",
  "bitstream_sensor_start_stop_set_bulk",

  // Mutates firmware diagnostics scheduler priorities.
  "bitstream_diag_task_priority_set",
]);

export function getBitstreamMcpToolRiskInfo(toolId: string): BitstreamMcpToolRiskInfo {
  if (BITSTREAM_MCP_RISKY_TOOL_IDS.has(toolId)) {
    const warning =
      toolId === "bitstream_run_command"
        ? "This can execute arbitrary Bitstream commands and may change device state."
        : toolId === "bitstream_control_ops"
          ? "This can run low-level control ops (including sensor reinit) and may disrupt the session."
          : toolId === "bitstream_diag_task_priority_set"
            ? "This changes diagnostics task priorities on the device."
            : "This tool changes device/runtime state.";
    return {
      toolId,
      level: "risky",
      reason: "toolId is in explicit risky allowlist",
      userFacingWarning: warning,
    };
  }

  return {
    toolId,
    level: "read_only",
    reason: "toolId is not in risky allowlist",
    userFacingWarning: "Read-only tool.",
  };
}

export function isRiskyBitstreamMcpTool(toolId: string): boolean {
  return BITSTREAM_MCP_RISKY_TOOL_IDS.has(toolId);
}

