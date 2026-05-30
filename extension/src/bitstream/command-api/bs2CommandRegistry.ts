/*******************************************************************************
 * File Name : bs2CommandRegistry.ts
 *
 * Description : Map typed BitstreamCommandRequest handlers to BS2 REQ/RES over Bs2BrokerSession.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";
import { BS2_CMD } from "../../bitstream2/domains/config/commands";
import {
  decodeBmi270FusionFeedResBody,
  decodeBmi270ModeResBody,
  encodeBmi270FusionFeedSetBody,
  encodeBmi270ModeSetBody,
} from "../../bitstream2/domains/bmi270/bmi270-control";
import { base64ToBytes, bytesToBase64 } from "../../bitstream2/util/base64";
import { bs2CfgToLegacyMcpShape } from "../../bitstream2/bridge/bs2-mcp-config-shape";
import { legacySourceIdToBs2SensorId } from "../../bitstream2/domains/sensors/legacy-source-id-map";
import { normalizeSensorCfg } from "../../bitstream2/domains/config/sensor-config";
import type { BitstreamCommandRequest, BitstreamCommandResultMap, BitstreamCommandType } from "./bitstreamCommandTypes";
import type { SensorCfgSetCommandOptions } from "../session/host-session";

export const BS2_COMMAND_UNSUPPORTED =
  "Not available on BS2 wire (use bitstream2:uart-probe or EVT_DIAG when firmware adds parity)";

type Bs2CommandHandler<T extends BitstreamCommandType> = (
  session: Bs2BrokerSession,
  command: Extract<BitstreamCommandRequest, { type: T }>,
) => Promise<BitstreamCommandResultMap[T]>;

type Bs2CommandHandlerMap = {
  [K in BitstreamCommandType]: Bs2CommandHandler<K>;
};

function optionsToBs2Cfg(options: SensorCfgSetCommandOptions, currentMask: number)
{
  const sensorId = legacySourceIdToBs2SensorId(options.sourceId);
  if (sensorId == null)
  {
    throw new Error(`Unsupported sourceId ${options.sourceId}`);
  }
  return normalizeSensorCfg({
    sensorId,
    enabled: options.enabled,
    publishMode: options.publishMode as 0 | 1 | 2,
    mask: currentMask,
    samplingIntervalMs: options.samplingIntervalMs,
    deltaX100: options.deltaX100,
    minPublishIntervalMs: options.minPublishIntervalMs,
    publishIntervalMs: 0,
  });
}

export const bs2CommandRegistry: Bs2CommandHandlerMap = {
  "handshake.run": async (session) =>
  {
    const hello = session.getHello();
    if (hello == null)
    {
      throw new Error("BS2 HELLO not received");
    }
    const t0 = Date.now();
    const pingRes = await session.ping();
    const pingMs = Date.now() - t0;
    return {
      hello: { ackId: 0, status: 0, corrId: 0, protocolVersion: hello.version },
      ping: { ackId: 0, status: pingRes.status ?? 0, corrId: 0, nonceEcho: 0 },
      caps: { ackId: 0, status: 0, corrId: 0, capsFlags: hello.caps },
      status: { ackId: 0, status: 0, corrId: 0, counter: 0, protocolVersion: hello.version },
      protocolVersion: hello.version,
      capsFlags: hello.caps,
      statusCounter: 0,
      durationsMs: { hello: 0, ping: pingMs, caps: 0, status: 0, total: pingMs },
    };
  },
  "sensor.cfg.set": async (session, command) =>
  {
    const sensorId = legacySourceIdToBs2SensorId(command.payload.options.sourceId);
    if (sensorId == null)
    {
      throw new Error(`Unsupported sourceId ${command.payload.options.sourceId}`);
    }
    const current = await session.getSensorCfg(sensorId);
    await session.setSensorCfg(optionsToBs2Cfg(command.payload.options, current.mask));
    return { sent: true };
  },
  "sensor.cfg.get": async (session, command) =>
  {
    const cfg = await session.getSensorCfgByLegacySourceId(command.payload.sourceId);
    const legacy = bs2CfgToLegacyMcpShape(cfg);
    return {
      ackId: 0,
      status: 0,
      corrId: 0,
      sourceId: legacy.sourceId,
      enabled: legacy.enabled,
      publishMode: legacy.publishMode,
      samplingIntervalMs: legacy.samplingIntervalMs,
      deltaX100: legacy.deltaX100,
      minPublishIntervalMs: legacy.minPublishIntervalMs,
      publishIntervalMs: legacy.publishIntervalMs ?? 0,
    };
  },
  "sensor.reinit": async () =>
  {
    throw new Error(BS2_COMMAND_UNSUPPORTED);
  },
  "sensor.bmi270.mode.set": async (session, command) =>
  {
    await session.sendReq({
      cmdId: BS2_CMD.BMI270_MODE_SET,
      reqId: 90,
      bodyB64: bytesToBase64(encodeBmi270ModeSetBody(command.payload.mode as 0 | 1 | 2)),
      timeoutMs: command.payload.mode === 0 ? undefined : 15_000,
    });
    return { sent: true };
  },
  "sensor.bmi270.mode.get": async (session) =>
  {
    const res = await session.sendReq({
      cmdId: BS2_CMD.BMI270_MODE_GET,
      reqId: 91,
    });
    const body =
      res.bodyB64 != null ? decodeBmi270ModeResBody(base64ToBytes(res.bodyB64)) : null;
    if (body == null)
    {
      throw new Error("BMI270_MODE_GET: bad body");
    }
    return { ackId: 0, status: 0, corrId: 0, modeEcho: body };
  },
  "sensor.bmi270.fusion.feed.set": async (session, command) =>
  {
    await session.sendReq({
      cmdId: BS2_CMD.BMI270_FUSION_FEED_SET,
      reqId: 92,
      bodyB64: bytesToBase64(encodeBmi270FusionFeedSetBody(command.payload.intervalMs)),
    });
    return { sent: true };
  },
  "sensor.bmi270.fusion.feed.get": async (session) =>
  {
    const res = await session.sendReq({
      cmdId: BS2_CMD.BMI270_FUSION_FEED_GET,
      reqId: 93,
    });
    const body =
      res.bodyB64 != null ? decodeBmi270FusionFeedResBody(base64ToBytes(res.bodyB64)) : null;
    if (body == null)
    {
      throw new Error("BMI270_FUSION_FEED_GET: bad body");
    }
    return { ackId: 0, status: 0, corrId: 0, appliedIntervalMs: body };
  },
  "stream.pause": async () =>
  {
    throw new Error(BS2_COMMAND_UNSUPPORTED);
  },
  "stream.resume": async () =>
  {
    throw new Error(BS2_COMMAND_UNSUPPORTED);
  },
  "diag.stream.start": async () =>
  {
    throw new Error(BS2_COMMAND_UNSUPPORTED);
  },
  "diag.stream.stop": async () =>
  {
    throw new Error(BS2_COMMAND_UNSUPPORTED);
  },
  "diag.snapshot.get": async () =>
  {
    throw new Error(BS2_COMMAND_UNSUPPORTED);
  },
  "diag.task.table.get": async () =>
  {
    throw new Error(BS2_COMMAND_UNSUPPORTED);
  },
  "diag.task.priority.set": async () =>
  {
    throw new Error(BS2_COMMAND_UNSUPPORTED);
  },
};
