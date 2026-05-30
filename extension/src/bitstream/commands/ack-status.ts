import type {
  BitstreamAckBase,
  Bmi270ModeSetAck,
  Bmi270FusionFeedAck,
  LogLevelAck,
  StreamPauseAck,
  StreamResumeAck,
  CapsAck,
  DiagAck,
  HelloAck,
  PingAck,
  SensorCfgGetAck,
  SensorCfgSetAck,
  SensorReinitAck,
  StatusAck,
} from "./ack-decoders";

export class BitstreamAckStatusError extends Error {
  readonly kind: "control" | "diagnostics";
  readonly code: number;
  readonly context: string;
  readonly ackCommandId?: number;
  readonly detail?: number;

  constructor(params: {
    kind: "control" | "diagnostics";
    code: number;
    context: string;
    ackCommandId?: number;
    detail?: number;
  }) {
    const codeHex = `0x${params.code.toString(16).padStart(2, "0")}`;
    const suffix =
      params.ackCommandId !== undefined ? ` (ackCmdId=0x${params.ackCommandId.toString(16).padStart(2, "0")})` : "";
    const detailSuffix =
      params.detail !== undefined ? ` detail=0x${params.detail.toString(16).padStart(4, "0")}` : "";
    super(`${params.context} failed with ${params.kind} code ${codeHex}${suffix}${detailSuffix}`);
    this.name = "BitstreamAckStatusError";
    this.kind = params.kind;
    this.code = params.code;
    this.context = params.context;
    this.ackCommandId = params.ackCommandId;
    this.detail = params.detail;
  }
}

function ensureControlAckOk<T extends BitstreamAckBase>(ack: T, context: string): T {
  if (ack.status !== 0) {
    throw new BitstreamAckStatusError({ kind: "control", code: ack.status, context });
  }
  return ack;
}

export function ensureHelloAckOk(ack: HelloAck): HelloAck {
  return ensureControlAckOk(ack, "HELLO_ACK");
}

export function ensurePingAckOk(ack: PingAck): PingAck {
  return ensureControlAckOk(ack, "PING_ACK");
}

export function ensureCapsAckOk(ack: CapsAck): CapsAck {
  return ensureControlAckOk(ack, "CAPS_ACK");
}

export function ensureStatusAckOk(ack: StatusAck): StatusAck {
  return ensureControlAckOk(ack, "STATUS_ACK");
}

export function ensureSensorCfgGetAckOk(ack: SensorCfgGetAck): SensorCfgGetAck {
  return ensureControlAckOk(ack, "SENSOR_CFG_GET_ACK");
}

export function ensureSensorCfgSetAckOk(ack: SensorCfgSetAck): SensorCfgSetAck {
  return ensureControlAckOk(ack, "SENSOR_CFG_SET_ACK");
}

export function ensureSensorReinitAckOk(ack: SensorReinitAck): SensorReinitAck {
  return ensureControlAckOk(ack, "SENSOR_REINIT_ACK");
}

export function ensureBmi270ModeSetAckOk(ack: Bmi270ModeSetAck): Bmi270ModeSetAck {
  return ensureControlAckOk(ack, "BMI270_MODE_SET_ACK");
}

export function ensureBmi270FusionFeedAckOk(ack: Bmi270FusionFeedAck): Bmi270FusionFeedAck {
  return ensureControlAckOk(ack, "BMI270_FUSION_FEED_ACK");
}

export function ensureLogLevelAckOk(ack: LogLevelAck): LogLevelAck {
  return ensureControlAckOk(ack, "LOG_LEVEL_ACK");
}

export function ensureStreamPauseAckOk(ack: StreamPauseAck): StreamPauseAck {
  return ensureControlAckOk(ack, "STREAM_PAUSE_ACK");
}

export function ensureStreamResumeAckOk(ack: StreamResumeAck): StreamResumeAck {
  return ensureControlAckOk(ack, "STREAM_RESUME_ACK");
}

export function ensureDiagAckOk(ack: DiagAck, context = "DIAG_ACK"): DiagAck {
  if (ack.resultCode !== 0) {
    throw new BitstreamAckStatusError({
      kind: "diagnostics",
      code: ack.resultCode,
      context,
      ackCommandId: ack.ackCommandId,
      detail: ack.detail,
    });
  }
  return ack;
}
