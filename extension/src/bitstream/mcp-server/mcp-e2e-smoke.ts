import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type ToolPayload =
  | Record<string, unknown>
  | {
      content?: Array<{ type?: string; text?: string }>;
      structuredContent?: Record<string, unknown>;
    };

function parseToolPayload(raw: ToolPayload): Record<string, unknown> {
  if ("structuredContent" in raw && raw.structuredContent && typeof raw.structuredContent === "object") {
    return raw.structuredContent as Record<string, unknown>;
  }
  if ("content" in raw && Array.isArray(raw.content) && raw.content.length > 0) {
    const first = raw.content[0];
    if (first?.type === "text" && typeof first.text === "string") {
      try {
        const parsed = JSON.parse(first.text) as unknown;
        if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return { rawText: first.text };
      }
    }
  }
  return {};
}

function assertNotInvalidPayload(result: Record<string, unknown>, callLabel: string): void {
  const envelope =
    result.envelope && typeof result.envelope === "object" && !Array.isArray(result.envelope)
      ? (result.envelope as Record<string, unknown>)
      : undefined;
  const error = typeof envelope?.error === "string" ? envelope.error : "";
  if (error.includes("Invalid Bitstream command payload")) {
    throw new Error(`${callLabel} still returned Invalid Bitstream command payload`);
  }
}

function assertObjectResult(result: Record<string, unknown>, callLabel: string): void {
  if (Object.keys(result).length === 0) {
    throw new Error(`${callLabel} returned empty payload`);
  }
}

function assertAllowedSensorLatestKeys(result: Record<string, unknown>, callLabel: string): void {
  const latest = result.latest;
  if (!latest || typeof latest !== "object" || Array.isArray(latest)) {
    return;
  }

  const allowed = new Set(["sht40", "dps368", "bmm350", "bmi270", "unknown"]);
  const keys = Object.keys(latest as Record<string, unknown>);
  const invalidKeys = keys.filter((key) => !allowed.has(key));
  if (invalidKeys.length > 0) {
    throw new Error(`${callLabel} returned unsupported sensor keys: ${invalidKeys.join(", ")}`);
  }
}

async function main(): Promise<void> {
  const env = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
  const wsUrl = process.env.BITSTREAM_SMOKE_WS_URL ?? "ws://127.0.0.1:9998";
  const denyPattern = process.env.BITSTREAM_SMOKE_DENY_PATTERN ?? "bluetooth,rfcomm,bth";
  const allowManufacturer = process.env.BITSTREAM_SMOKE_ALLOW_MANUFACTURER ?? "STMicroelectronics,Silicon,Cypress";
  const baudRate = Number.parseInt(process.env.BITSTREAM_SMOKE_BAUD_RATE ?? "921600", 10);
  const attachPath = process.env.BITSTREAM_SMOKE_PATH?.trim();

  const mcpServerArgs = [
    "node_modules/tsx/dist/cli.mjs",
    "src/bitstream/mcp-server/run.mcp-server.ts",
    "--autoDetectPort=true",
    `--allowManufacturer=${allowManufacturer}`,
    `--denyPattern=${denyPattern}`,
    `--baudRate=${Number.isFinite(baudRate) ? baudRate : 921600}`,
    "--mode=both",
    `--url=${wsUrl}`,
  ];
  if (attachPath) {
    mcpServerArgs.push(`--path=${attachPath}`);
  }

  const transport = new StdioClientTransport({
    command: "node",
    args: mcpServerArgs,
    cwd: process.cwd(),
    env,
  });

  const client = new Client(
    {
      name: "bitstream-mcp-smoke",
      version: "0.1.0",
    },
    { capabilities: {} },
  );

  try {
    await client.connect(transport);
    const tools = await client.listTools();
    const available = new Set(tools.tools.map((tool) => tool.name));
    const requiredTools = [
      "bitstream_health_check",
      "bitstream_run_command",
      "bitstream_control_ops",
      "bitstream_diag_snapshot_get",
      "bitstream_diag_fault_events_get",
      "bitstream_diag_task_table_get",
      "bitstream_diag_task_priority_set",
      "bitstream_sensor_latest_samples_get",
      "bitstream_sensor_config_get",
      "bitstream_sensor_status_get",
      "bitstream_sensor_start_stop_set",
      "bitstream_sensor_start_stop_set_bulk",
    ];
    for (const tool of requiredTools) {
      if (!available.has(tool)) {
        throw new Error(`Missing required tool: ${tool}`);
      }
    }

    const listResourcesFn = (
      client as unknown as { listResources?: () => Promise<{ resources: Array<{ uri: string }> }> }
    ).listResources;
    if (typeof listResourcesFn === "function") {
      const resourcesResult = await listResourcesFn.call(client);
      const requiredResourceUris = [
        "bitstream://protocol/version",
        "bitstream://sensors/catalog",
        "bitstream://diagnostics/error-codes",
        "bitstream://operations/safe-commands",
        "bitstream://defaults/sensor-config",
      ];
      const resourceUriSet = new Set((resourcesResult.resources ?? []).map((resource) => resource.uri));
      for (const uri of requiredResourceUris) {
        if (!resourceUriSet.has(uri)) {
          throw new Error(`Missing required resource: ${uri}`);
        }
      }

      const readResourceFn = (
        client as unknown as {
          readResource?: (args: { uri: string }) => Promise<{ contents?: Array<{ text?: string }> }>;
        }
      ).readResource;
      if (typeof readResourceFn !== "function") {
        throw new Error("Client does not support readResource; strict resource checks cannot continue");
      }
      const protocolResource = await readResourceFn.call(client, { uri: "bitstream://protocol/version" });
      const protocolText = protocolResource.contents?.[0]?.text;
      if (typeof protocolText !== "string" || !protocolText.includes("protocolVersion")) {
        throw new Error("Resource read failed for bitstream://protocol/version");
      }
    }

    const listPromptsFn = (
      client as unknown as { listPrompts?: () => Promise<{ prompts: Array<{ name: string }> }> }
    ).listPrompts;
    if (typeof listPromptsFn === "function") {
      const promptsResult = await listPromptsFn.call(client);
      const requiredPrompts = ["triage_fault_events", "sensor_health_report", "pre_command_checklist"];
      const promptNameSet = new Set((promptsResult.prompts ?? []).map((prompt) => prompt.name));
      for (const promptName of requiredPrompts) {
        if (!promptNameSet.has(promptName)) {
          throw new Error(`Missing required prompt: ${promptName}`);
        }
      }

      const getPromptFn = (
        client as unknown as {
          getPrompt?: (args: { name: string; arguments?: Record<string, unknown> }) => Promise<{
            messages?: Array<{ content?: { text?: string } }>;
          }>;
        }
      ).getPrompt;
      if (typeof getPromptFn !== "function") {
        throw new Error("Client does not support getPrompt; strict prompt checks cannot continue");
      }
      const promptResult = await getPromptFn.call(client, {
        name: "triage_fault_events",
        arguments: {
          faultEvents: JSON.stringify([{ code: "E_UART_TIMEOUT" }]),
        },
      });
      const promptText = promptResult.messages?.[0]?.content?.text;
      if (typeof promptText !== "string" || !promptText.includes("diagnostics assistant")) {
        throw new Error("Prompt get failed for triage_fault_events");
      }
    }

    const healthRaw = await client.callTool({ name: "bitstream_health_check", arguments: {} });
    const health = parseToolPayload(healthRaw as ToolPayload);

    const wrappedRaw = await client.callTool({
      name: "bitstream_run_command",
      arguments: {
        command: {
          type: "handshake.run",
          payload: {},
        },
      },
    });
    const wrapped = parseToolPayload(wrappedRaw as ToolPayload);
    assertNotInvalidPayload(wrapped, "wrapped handshake");

    const directRaw = await client.callTool({
      name: "bitstream_run_command",
      arguments: {
        type: "handshake.run",
        payload: {},
      },
    });
    const direct = parseToolPayload(directRaw as ToolPayload);
    assertNotInvalidPayload(direct, "direct handshake");

    const commandStringRaw = await client.callTool({
      name: "bitstream_run_command",
      arguments: {
        command: "diag.stream.start",
        requestId: "diag-start-smoke-001",
        diagMajor: 1,
        diagMinor: 0,
        globalPeriodMs: 500,
        taskPeriodMs: 500,
      },
    });
    const commandString = parseToolPayload(commandStringRaw as ToolPayload);
    assertNotInvalidPayload(commandString, "command-string diag.stream.start");

    const controlOpsRaw = await client.callTool({
      name: "bitstream_control_ops",
      arguments: { op: "status" },
    });
    const controlOps = parseToolPayload(controlOpsRaw as ToolPayload);
    assertObjectResult(controlOps, "bitstream_control_ops");

    const snapshotRaw = await client.callTool({
      name: "bitstream_diag_snapshot_get",
      arguments: { diagMajor: 1, diagMinor: 0, timeoutMs: 1200 },
    });
    const snapshot = parseToolPayload(snapshotRaw as ToolPayload);
    assertObjectResult(snapshot, "bitstream_diag_snapshot_get");

    const faultEventsRaw = await client.callTool({
      name: "bitstream_diag_fault_events_get",
      arguments: { windowMs: 600, maxEvents: 10 },
    });
    const faultEvents = parseToolPayload(faultEventsRaw as ToolPayload);
    assertObjectResult(faultEvents, "bitstream_diag_fault_events_get");

    const taskTableRaw = await client.callTool({
      name: "bitstream_diag_task_table_get",
      arguments: { diagMajor: 1, diagMinor: 0, timeoutMs: 1200 },
    });
    const taskTable = parseToolPayload(taskTableRaw as ToolPayload);
    assertObjectResult(taskTable, "bitstream_diag_task_table_get");

    const taskPriorityRaw = await client.callTool({
      name: "bitstream_diag_task_priority_set",
      arguments: {
        taskId: "12",
        newPriority: "2",
        diagMajor: 1,
        diagMinor: 0,
        firmwareRequestId: 901,
        timeoutMs: 1200,
      },
    });
    const taskPriority = parseToolPayload(taskPriorityRaw as ToolPayload);
    assertObjectResult(taskPriority, "bitstream_diag_task_priority_set");

    const sensorLatestRaw = await client.callTool({
      name: "bitstream_sensor_latest_samples_get",
      arguments: { windowMs: 700 },
    });
    const sensorLatest = parseToolPayload(sensorLatestRaw as ToolPayload);
    assertObjectResult(sensorLatest, "bitstream_sensor_latest_samples_get");
    assertAllowedSensorLatestKeys(sensorLatest, "bitstream_sensor_latest_samples_get");

    const sensorConfigRaw = await client.callTool({
      name: "bitstream_sensor_config_get",
      arguments: { sourceId: 1 },
    });
    const sensorConfig = parseToolPayload(sensorConfigRaw as ToolPayload);
    assertObjectResult(sensorConfig, "bitstream_sensor_config_get");

    const sensorStatusRaw = await client.callTool({
      name: "bitstream_sensor_status_get",
      arguments: { sourceIds: [1, 2, 3, 4] },
    });
    const sensorStatus = parseToolPayload(sensorStatusRaw as ToolPayload);
    assertObjectResult(sensorStatus, "bitstream_sensor_status_get");

    const sensorStartStopRaw = await client.callTool({
      name: "bitstream_sensor_start_stop_set",
      arguments: { sourceId: 1, enabled: true },
    });
    const sensorStartStop = parseToolPayload(sensorStartStopRaw as ToolPayload);
    assertObjectResult(sensorStartStop, "bitstream_sensor_start_stop_set");

    const sensorBulkRaw = await client.callTool({
      name: "bitstream_sensor_start_stop_set_bulk",
      arguments: { enabled: true, sourceIds: [1] },
    });
    const sensorBulk = parseToolPayload(sensorBulkRaw as ToolPayload);
    assertObjectResult(sensorBulk, "bitstream_sensor_start_stop_set_bulk");

    console.log(
      JSON.stringify(
        {
          ok: true,
          checkedTools: requiredTools,
          checks: [
            "wrapped handshake does not fail payload validation",
            "direct handshake does not fail payload validation",
            "command-string diag.stream.start does not fail payload validation",
            "dedicated tools are registered and callable",
          ],
          attachConfig: {
            wsUrl,
            allowManufacturer,
            denyPattern,
            baudRate: Number.isFinite(baudRate) ? baudRate : 921600,
            path: attachPath ?? null,
          },
          health,
          wrapped,
          direct,
          commandString,
          controlOps,
          snapshot,
          faultEvents,
          taskTable,
          taskPriority,
          sensorLatest,
          sensorConfig,
          sensorStatus,
          sensorStartStop,
        },
        null,
        2,
      ),
    );
  } finally {
    try {
      await client.close();
    } catch {
      // ignore close race on process shutdown
    }
  }
}

void main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
