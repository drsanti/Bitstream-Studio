import type { Bmi270ModeSetAck } from "../commands/ack-decoders.js";
import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session.js";
import {
  SERIALPORT_TOPICS,
  type Bmi270FusionFeedUpdatedPayload,
  type Bmi270StreamModeUpdatedPayload,
  type SensorCfgUpdatedPayload,
} from "../../serialport-bridge/protocol.js";
import type { BitstreamCommandApi } from "./bitstreamCommandApi.js";
import type { BitstreamCommandEnvelope } from "./bitstreamCommandTypes.js";

/** `instanceToken` for MCP-originated fan-out so webview toasts treat it as a remote writer. */
export const MCP_BROKER_FANOUT_INSTANCE_TOKEN = "mcp";

/** @deprecated Use {@link MCP_BROKER_FANOUT_INSTANCE_TOKEN}. */
export const MCP_SENSOR_CFG_FANOUT_INSTANCE_TOKEN = MCP_BROKER_FANOUT_INSTANCE_TOKEN;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Same 1–4 rule as MCP normalization; strings (e.g. LLM JSON) must not skip broker fan-out. */
function parseSensorSourceIdForFanOut(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value === 1 || value === 2 || value === 3 || value === 4) {
      return value;
    }
    return undefined;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4) {
      return parsed;
    }
  }
  return undefined;
}

/** Mirrors {@link bmi270ModeEchoToUi} in webview — keep bitstream free of webview imports. */
function bmi270ModeEchoToUiMode(modeEcho: number): Bmi270StreamModeUpdatedPayload["bmi270StreamMode"] {
  if (modeEcho === 0) {
    return "raw";
  }
  if (modeEcho === 1) {
    return "fusion";
  }
  return "hybrid";
}

export type SensorCfgFanOutFields = Pick<
  SensorCfgUpdatedPayload,
  | "sourceId"
  | "enabled"
  | "publishMode"
  | "samplingIntervalMs"
  | "deltaX100"
  | "minPublishIntervalMs"
  | "publishIntervalMs"
>;

/**
 * Publish verified sensor cfg to `serialport/sensor-cfg-updated` (same payload shape as
 * `useBitstreamSession.publishSensorCfgUpdated`). No-op if transport has no `publishBrokerJson`.
 */
export async function publishSensorCfgUpdatedFanOut(
  session: Bs2BrokerSession,
  fields: SensorCfgFanOutFields,
  requestId: string,
): Promise<void>
{
  const out: SensorCfgUpdatedPayload = {
    ...fields,
    timestampMs: Date.now(),
    requestId,
    instanceToken: MCP_BROKER_FANOUT_INSTANCE_TOKEN,
  };
  try
  {
    await session.publishBrokerJson(SERIALPORT_TOPICS.SENSOR_CFG_UPDATED, out, 0);
  }
  catch
  {
    // Optional fan-out — mirror webview publishSensorCfgUpdated swallow policy.
  }
}

/**
 * After a successful MCP `sensor.cfg.set`, verify with `sensor.cfg.get` and publish.
 */
export async function fanOutVerifiedSensorCfgAfterMcpSet(
  session: Bs2BrokerSession,
  api: BitstreamCommandApi,
  normalizedCommand: unknown,
): Promise<void> {
  if (!isObject(normalizedCommand) || normalizedCommand.type !== "sensor.cfg.set") {
    return;
  }
  const payload = isObject(normalizedCommand.payload) ? normalizedCommand.payload : {};
  const options = isObject(payload.options) ? payload.options : {};
  const topSourceId = isObject(normalizedCommand) ? normalizedCommand.sourceId : undefined;
  const sourceId =
    parseSensorSourceIdForFanOut(options.sourceId) ??
    parseSensorSourceIdForFanOut(payload.sourceId) ??
    parseSensorSourceIdForFanOut(topSourceId);
  if (sourceId === undefined) {
    return;
  }

  const verifyRequestId = `mcp-sensor-cfg-verify-${sourceId}-${Date.now()}`;
  const verifyResult = await api.execute({
    type: "sensor.cfg.get",
    payload: { requestId: verifyRequestId, sourceId },
  });

  if (!verifyResult.ok || !verifyResult.data) {
    return;
  }

  const d = verifyResult.data;
  await publishSensorCfgUpdatedFanOut(
    session,
    {
      sourceId: d.sourceId,
      enabled: d.enabled,
      publishMode: d.publishMode,
      samplingIntervalMs: d.samplingIntervalMs,
      deltaX100: d.deltaX100,
      minPublishIntervalMs: d.minPublishIntervalMs,
      publishIntervalMs: d.publishIntervalMs ?? 0,
    },
    verifyRequestId,
  );
}

/**
 * After successful MCP `sensor.bmi270.mode.set`, publish `serialport/bmi270-stream-mode-updated`.
 */
export async function fanOutBmi270StreamModeAfterMcpSet(
  session: Bs2BrokerSession,
  envelope: BitstreamCommandEnvelope,
): Promise<void>
{
  if (!envelope.ok || envelope.type !== "sensor.bmi270.mode.set" || envelope.data == null)
  {
    return;
  }
  const data = envelope.data as Bmi270ModeSetAck;
  const out: Bmi270StreamModeUpdatedPayload = {
    bmi270StreamMode: bmi270ModeEchoToUiMode(data.modeEcho),
    timestampMs: Date.now(),
    instanceToken: MCP_BROKER_FANOUT_INSTANCE_TOKEN,
  };
  try
  {
    await session.publishBrokerJson(SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED, out, 0);
  }
  catch
  {
    // optional fan-out
  }
}

/**
 * After successful MCP `sensor.bmi270.mode.get`, publish current mode so all webview clients
 * converge in read/no-op flows.
 */
export async function fanOutBmi270StreamModeAfterMcpGet(
  session: Bs2BrokerSession,
  envelope: BitstreamCommandEnvelope,
): Promise<void>
{
  if (!envelope.ok || envelope.type !== "sensor.bmi270.mode.get" || envelope.data == null)
  {
    return;
  }
  const data = envelope.data as Bmi270ModeSetAck;
  const out: Bmi270StreamModeUpdatedPayload = {
    bmi270StreamMode: bmi270ModeEchoToUiMode(data.modeEcho),
    timestampMs: Date.now(),
    instanceToken: MCP_BROKER_FANOUT_INSTANCE_TOKEN,
  };
  try
  {
    await session.publishBrokerJson(SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED, out, 0);
  }
  catch
  {
    // optional fan-out
  }
}

/**
 * After successful MCP `sensor.bmi270.fusion.feed.set`, publish `serialport/bmi270-fusion-feed-updated`.
 */
export async function fanOutBmi270FusionFeedAfterMcpSet(
  session: Bs2BrokerSession,
  envelope: BitstreamCommandEnvelope,
): Promise<void>
{
  if (!envelope.ok || envelope.type !== "sensor.bmi270.fusion.feed.set" || envelope.data == null)
  {
    return;
  }
  const data = envelope.data as { appliedIntervalMs: number };
  if (typeof data.appliedIntervalMs !== "number" || !Number.isFinite(data.appliedIntervalMs))
  {
    return;
  }
  const out: Bmi270FusionFeedUpdatedPayload = {
    appliedIntervalMs: data.appliedIntervalMs,
    timestampMs: Date.now(),
    instanceToken: MCP_BROKER_FANOUT_INSTANCE_TOKEN,
  };
  try
  {
    await session.publishBrokerJson(SERIALPORT_TOPICS.BMI270_FUSION_FEED_UPDATED, out, 0);
  }
  catch
  {
    // optional fan-out
  }
}

/**
 * After successful MCP `sensor.bmi270.fusion.feed.get`, publish latest interval for read/no-op convergence.
 */
export async function fanOutBmi270FusionFeedAfterMcpGet(
  session: Bs2BrokerSession,
  envelope: BitstreamCommandEnvelope,
): Promise<void>
{
  if (!envelope.ok || envelope.type !== "sensor.bmi270.fusion.feed.get" || envelope.data == null)
  {
    return;
  }
  const data = envelope.data as { appliedIntervalMs: number };
  if (typeof data.appliedIntervalMs !== "number" || !Number.isFinite(data.appliedIntervalMs))
  {
    return;
  }
  const out: Bmi270FusionFeedUpdatedPayload = {
    appliedIntervalMs: data.appliedIntervalMs,
    timestampMs: Date.now(),
    instanceToken: MCP_BROKER_FANOUT_INSTANCE_TOKEN,
  };
  try
  {
    await session.publishBrokerJson(SERIALPORT_TOPICS.BMI270_FUSION_FEED_UPDATED, out, 0);
  }
  catch
  {
    // optional fan-out
  }
}

/**
 * After successful MCP `sensor.cfg.get`, publish current cfg so all webview clients converge even
 * when upstream logic decides "already set / no-op" and skips a write command.
 */
export async function fanOutSensorCfgAfterMcpGet(
  session: Bs2BrokerSession,
  envelope: BitstreamCommandEnvelope,
): Promise<void> {
  if (!envelope.ok || envelope.type !== "sensor.cfg.get" || envelope.data == null) {
    return;
  }
  const sensorCfgEnvelope = envelope as BitstreamCommandEnvelope<"sensor.cfg.get">;
  const data = sensorCfgEnvelope.data;
  if (data == null) {
    return;
  }
  await publishSensorCfgUpdatedFanOut(
    session,
    {
      sourceId: data.sourceId,
      enabled: data.enabled,
      publishMode: data.publishMode,
      samplingIntervalMs: data.samplingIntervalMs,
      deltaX100: data.deltaX100,
      minPublishIntervalMs: data.minPublishIntervalMs,
      publishIntervalMs: data.publishIntervalMs ?? 0,
    },
    sensorCfgEnvelope.requestId ?? `mcp-sensor-cfg-get-${data.sourceId}-${Date.now()}`,
  );
}

/**
 * Single entry after MCP **`runBitstreamCommandFromMcp`** succeeds — sensor cfg verify fan-out +
 * BMI270 stream mode fan-out.
 */
export async function dispatchBrokerFanOutAfterMcpRunCommand(
  session: Bs2BrokerSession,
  api: BitstreamCommandApi,
  normalizedCommand: unknown,
  envelope: BitstreamCommandEnvelope,
): Promise<void> {
  await fanOutVerifiedSensorCfgAfterMcpSet(session, api, normalizedCommand);
  await fanOutSensorCfgAfterMcpGet(session, envelope);
  await fanOutBmi270StreamModeAfterMcpSet(session, envelope);
  await fanOutBmi270StreamModeAfterMcpGet(session, envelope);
  await fanOutBmi270FusionFeedAfterMcpSet(session, envelope);
  await fanOutBmi270FusionFeedAfterMcpGet(session, envelope);
}
