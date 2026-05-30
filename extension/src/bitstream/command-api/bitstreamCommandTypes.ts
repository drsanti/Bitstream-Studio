import type {
  Bmi270FusionFeedAck,
  Bmi270ModeSetAck,
  DiagAck,
  SensorCfgGetAck,
  SensorReinitAck,
  StreamPauseAck,
  StreamResumeAck,
} from "../commands/ack-decoders";
import type {
  DiagSetTaskPriorityCommandOptions,
  DiagStreamStartCommandOptions,
  SensorCfgSetCommandOptions,
} from "../session/host-session";
import type { HandshakeSequenceResult } from "../session/handshake-workflow";

export interface HandshakeCommand {
  type: "handshake.run";
  payload?: {
    requestIdPrefix?: string;
    protocolVersion?: number;
    pingNonce?: number;
  };
}

export interface SensorCfgSetCommand {
  type: "sensor.cfg.set";
  payload: {
    requestId: string;
    options: SensorCfgSetCommandOptions;
  };
}

export interface SensorCfgGetCommand {
  type: "sensor.cfg.get";
  payload: {
    requestId: string;
    sourceId: number;
  };
}

export interface SensorReinitCommand {
  type: "sensor.reinit";
  payload: {
    requestId: string;
  };
}

export interface Bmi270ModeSetCommand {
  type: "sensor.bmi270.mode.set";
  payload: {
    requestId: string;
    mode: number;
  };
}

export interface Bmi270ModeGetCommand {
  type: "sensor.bmi270.mode.get";
  payload: {
    requestId: string;
  };
}

export interface Bmi270FusionFeedSetCommand {
  type: "sensor.bmi270.fusion.feed.set";
  payload: {
    requestId: string;
    /** Requested interval (ms); firmware clamps to its min/max and echoes applied in ACK. */
    intervalMs: number;
  };
}

export interface Bmi270FusionFeedGetCommand {
  type: "sensor.bmi270.fusion.feed.get";
  payload: {
    requestId: string;
  };
}

export interface DiagStreamStartCommand {
  type: "diag.stream.start";
  payload: {
    requestId: string;
    options: DiagStreamStartCommandOptions;
  };
}

export interface DiagStreamStopCommand {
  type: "diag.stream.stop";
  payload: {
    requestId: string;
    diagMajor: number;
    diagMinor: number;
  };
}

export interface DiagGetSnapshotCommand {
  type: "diag.snapshot.get";
  payload: {
    requestId: string;
    diagMajor: number;
    diagMinor: number;
  };
}

export interface DiagGetTaskTableCommand {
  type: "diag.task.table.get";
  payload: {
    requestId: string;
    diagMajor: number;
    diagMinor: number;
  };
}

export interface DiagSetTaskPriorityCommand {
  type: "diag.task.priority.set";
  payload: {
    requestId: string;
    options: DiagSetTaskPriorityCommandOptions;
  };
}

export interface StreamPauseCommand {
  type: "stream.pause";
  payload: {
    requestId: string;
    scopeMask: number;
    durationMs: number;
  };
}

export interface StreamResumeCommand {
  type: "stream.resume";
  payload: {
    requestId: string;
    scopeMask: number;
  };
}

export interface FireAndForgetAck {
  /**
   * Command was accepted for send (fire-and-forget). No protocol ACK is awaited.
   * This is the default for interactive UI controls in the Bitstream app.
   */
  sent: true;
}

export type BitstreamCommandRequest =
  | HandshakeCommand
  | SensorCfgSetCommand
  | SensorCfgGetCommand
  | SensorReinitCommand
  | Bmi270ModeSetCommand
  | Bmi270ModeGetCommand
  | Bmi270FusionFeedSetCommand
  | Bmi270FusionFeedGetCommand
  | StreamPauseCommand
  | StreamResumeCommand
  | DiagStreamStartCommand
  | DiagStreamStopCommand
  | DiagGetSnapshotCommand
  | DiagGetTaskTableCommand
  | DiagSetTaskPriorityCommand;

export interface BitstreamCommandResultMap {
  "handshake.run": HandshakeSequenceResult;
  "sensor.cfg.set": FireAndForgetAck;
  "sensor.cfg.get": SensorCfgGetAck;
  "sensor.reinit": SensorReinitAck;
  "sensor.bmi270.mode.set": FireAndForgetAck;
  "sensor.bmi270.mode.get": Bmi270ModeSetAck;
  "sensor.bmi270.fusion.feed.set": FireAndForgetAck;
  "sensor.bmi270.fusion.feed.get": Bmi270FusionFeedAck;
  "stream.pause": StreamPauseAck;
  "stream.resume": StreamResumeAck;
  "diag.stream.start": DiagAck;
  "diag.stream.stop": DiagAck;
  "diag.snapshot.get": DiagAck;
  "diag.task.table.get": DiagAck;
  "diag.task.priority.set": DiagAck;
}

export type BitstreamCommandType = keyof BitstreamCommandResultMap;

export interface BitstreamCommandEnvelope<T extends BitstreamCommandType = BitstreamCommandType> {
  ok: boolean;
  type: T;
  requestId?: string;
  data?: BitstreamCommandResultMap[T];
  error?: string;
  /** Optional stack for debugging unexpected runtime failures (not protocol errors). */
  errorStack?: string;
}
