import { createBitstreamRunCommandTool } from "./tools/bitstream-run-command";
import { createControlOpsTool } from "./tools/control-ops";
import { createDiagFaultEventsGetTool } from "./tools/diag-fault-events-get";
import { createDiagSnapshotGetTool } from "./tools/diag-snapshot-get";
import { createDiagTaskTableGetTool } from "./tools/diag-task-table-get";
import { createDiagTaskPrioritySetTool } from "./tools/diag-task-priority-set";
import { createHealthCheckTool } from "./tools/health-check";
import { createSensorConfigGetTool } from "./tools/sensor-config-get";
import { createSensorLatestSamplesGetTool } from "./tools/sensor-latest-samples-get";
import { createSensorStartStopSetBulkTool } from "./tools/sensor-start-stop-set-bulk";
import { createSensorStartStopSetTool } from "./tools/sensor-start-stop-set";
import { createSensorStatusGetTool } from "./tools/sensor-status-get";
import type { BitstreamMcpRuntimeContext, BitstreamMcpServerLike } from "./types";

export interface RegisterBitstreamMcpToolsOptions {
  includeHealthCheck?: boolean;
}

export function registerBitstreamMcpTools(
  server: BitstreamMcpServerLike,
  runtime: BitstreamMcpRuntimeContext,
  options: RegisterBitstreamMcpToolsOptions = {},
): void {
  const commandTool = createBitstreamRunCommandTool(runtime);
  server.tool(commandTool.name, commandTool.description, commandTool.inputSchema, commandTool.handler);

  const controlOpsTool = createControlOpsTool(runtime);
  server.tool(controlOpsTool.name, controlOpsTool.description, controlOpsTool.inputSchema, controlOpsTool.handler);

  const diagSnapshotTool = createDiagSnapshotGetTool(runtime);
  server.tool(diagSnapshotTool.name, diagSnapshotTool.description, diagSnapshotTool.inputSchema, diagSnapshotTool.handler);

  const diagFaultEventsTool = createDiagFaultEventsGetTool(runtime);
  server.tool(
    diagFaultEventsTool.name,
    diagFaultEventsTool.description,
    diagFaultEventsTool.inputSchema,
    diagFaultEventsTool.handler,
  );

  const diagTaskTableTool = createDiagTaskTableGetTool(runtime);
  server.tool(diagTaskTableTool.name, diagTaskTableTool.description, diagTaskTableTool.inputSchema, diagTaskTableTool.handler);

  const diagTaskPrioritySetTool = createDiagTaskPrioritySetTool(runtime);
  server.tool(
    diagTaskPrioritySetTool.name,
    diagTaskPrioritySetTool.description,
    diagTaskPrioritySetTool.inputSchema,
    diagTaskPrioritySetTool.handler,
  );

  const sensorLatestSamplesTool = createSensorLatestSamplesGetTool(runtime);
  server.tool(
    sensorLatestSamplesTool.name,
    sensorLatestSamplesTool.description,
    sensorLatestSamplesTool.inputSchema,
    sensorLatestSamplesTool.handler,
  );

  const sensorConfigGetTool = createSensorConfigGetTool(runtime);
  server.tool(
    sensorConfigGetTool.name,
    sensorConfigGetTool.description,
    sensorConfigGetTool.inputSchema,
    sensorConfigGetTool.handler,
  );

  const sensorStatusGetTool = createSensorStatusGetTool(runtime);
  server.tool(
    sensorStatusGetTool.name,
    sensorStatusGetTool.description,
    sensorStatusGetTool.inputSchema,
    sensorStatusGetTool.handler,
  );

  const sensorStartStopSetTool = createSensorStartStopSetTool(runtime);
  server.tool(
    sensorStartStopSetTool.name,
    sensorStartStopSetTool.description,
    sensorStartStopSetTool.inputSchema,
    sensorStartStopSetTool.handler,
  );

  const sensorStartStopSetBulkTool = createSensorStartStopSetBulkTool(runtime);
  server.tool(
    sensorStartStopSetBulkTool.name,
    sensorStartStopSetBulkTool.description,
    sensorStartStopSetBulkTool.inputSchema,
    sensorStartStopSetBulkTool.handler,
  );

  if (options.includeHealthCheck ?? true) {
    const healthTool = createHealthCheckTool(runtime);
    server.tool(healthTool.name, healthTool.description, healthTool.inputSchema, healthTool.handler);
  }
}
