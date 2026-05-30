import { runHandshakeSequence } from "../session/handshake-workflow";
import type { HostSession } from "../session/host-session";
import type { BitstreamCommandRequest, BitstreamCommandResultMap, BitstreamCommandType } from "./bitstreamCommandTypes";

type BitstreamCommandHandler<T extends BitstreamCommandType> = (
  session: HostSession,
  command: Extract<BitstreamCommandRequest, { type: T }>,
) => Promise<BitstreamCommandResultMap[T]>;

type BitstreamCommandHandlerMap = {
  [K in BitstreamCommandType]: BitstreamCommandHandler<K>;
};

export const bitstreamCommandRegistry: BitstreamCommandHandlerMap = {
  "handshake.run": async (session, command) =>
    runHandshakeSequence(session, {
      requestIdPrefix: command.payload?.requestIdPrefix ?? "app-handshake",
      protocolVersion: command.payload?.protocolVersion ?? 2,
      pingNonce: command.payload?.pingNonce ?? 0x7f,
    }),
  "sensor.cfg.set": async (session, command) => {
    await session.sendSensorCfgSetNoAck(command.payload.requestId, command.payload.options);
    return { sent: true };
  },
  "sensor.cfg.get": async (session, command) => session.sendSensorCfgGet(command.payload.requestId, command.payload.sourceId),
  "sensor.reinit": async (session, command) => session.sendSensorReinit(command.payload.requestId),
  "sensor.bmi270.mode.set": async (session, command) => {
    await session.sendBmi270ModeSetNoAck(command.payload.requestId, command.payload.mode);
    return { sent: true };
  },
  "sensor.bmi270.mode.get": async (session, command) =>
    session.sendBmi270ModeGet(command.payload.requestId),
  "sensor.bmi270.fusion.feed.set": async (session, command) => {
    await session.sendBmi270FusionFeedSetNoAck(command.payload.requestId, command.payload.intervalMs);
    return { sent: true };
  },
  "sensor.bmi270.fusion.feed.get": async (session, command) =>
    session.sendBmi270FusionFeedGet(command.payload.requestId),
  "stream.pause": async (session, command) =>
    session.sendStreamPause(command.payload.requestId, {
      scopeMask: command.payload.scopeMask,
      durationMs: command.payload.durationMs,
    }),
  "stream.resume": async (session, command) =>
    session.sendStreamResume(command.payload.requestId, {
      scopeMask: command.payload.scopeMask,
    }),
  "diag.stream.start": async (session, command) =>
    session.sendDiagStreamStart(command.payload.requestId, command.payload.options),
  "diag.stream.stop": async (session, command) =>
    session.sendDiagStreamStop(command.payload.requestId, command.payload.diagMajor, command.payload.diagMinor),
  "diag.snapshot.get": async (session, command) =>
    session.sendDiagGetSnapshot(command.payload.requestId, command.payload.diagMajor, command.payload.diagMinor),
  "diag.task.table.get": async (session, command) =>
    session.sendDiagGetTaskTable(command.payload.requestId, command.payload.diagMajor, command.payload.diagMinor),
  "diag.task.priority.set": async (session, command) =>
    session.sendDiagSetTaskPriority(command.payload.requestId, command.payload.options),
};
