import { BITSTREAM_CHANNEL_CONTROL, BITSTREAM_CHANNEL_DIAGNOSTICS, type BitstreamFrame } from "../frame/frame-types";

export interface BitstreamAckBase {
  ackId: number;
  status: number;
}

export interface HelloAck extends BitstreamAckBase {
  corrId: number;
  protocolVersion: number;
}

export interface PingAck extends BitstreamAckBase {
  corrId: number;
  nonceEcho: number;
}

export interface CapsAck extends BitstreamAckBase {
  corrId: number;
  capsFlags: number;
}

export interface StatusAck extends BitstreamAckBase {
  corrId: number;
  counter: number;
  protocolVersion: number;
}

export interface SensorCfgGetAck extends BitstreamAckBase {
  corrId: number;
  sourceId: number;
  enabled: boolean;
  publishMode: number;
  samplingIntervalMs: number;
  deltaX100: number;
  minPublishIntervalMs: number;
}

export interface SensorCfgSetAck extends BitstreamAckBase {
  corrId: number;
  sourceId: number;
  appliedMask: number;
}

export interface SensorReinitAck extends BitstreamAckBase {
  corrId: number;
}

export interface Bmi270ModeSetAck extends BitstreamAckBase {
  corrId: number;
  modeEcho: number;
}

export interface Bmi270FusionFeedAck extends BitstreamAckBase {
  corrId: number;
  /** Clamped period (ms) at which the firmware feeds BSX between host publishes. */
  appliedIntervalMs: number;
}

export interface LogLevelAck extends BitstreamAckBase {
  corrId: number;
  appliedLevel: number;
}

export interface StreamPauseAck extends BitstreamAckBase {
  corrId: number;
  appliedScopeMask: number;
  appliedDurationMs: number;
}

export interface StreamResumeAck extends BitstreamAckBase {
  corrId: number;
  appliedScopeMask: number;
}

export interface DiagAck {
  ackId: number;
  ackCommandId: number;
  resultCode: number;
  requestId: number;
  detail: number;
}

function expectChannel(frame: BitstreamFrame, expected: number): void {
  if (frame.channel !== expected) {
    throw new Error(`Unexpected channel ${frame.channel}, expected ${expected}`);
  }
}

function expectAckId(payload: Uint8Array, expected: number): void {
  if ((payload[0] ?? 0) !== expected) {
    throw new Error(`Unexpected ACK id ${payload[0] ?? -1}, expected ${expected}`);
  }
}

function expectLength(payload: Uint8Array, minimum: number, ackName: string): void {
  if (payload.length < minimum) {
    throw new Error(`Invalid ${ackName} payload length ${payload.length}, expected >= ${minimum}`);
  }
}

export function decodeHelloAck(frame: BitstreamFrame): HelloAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 5, "HELLO_ACK");
  expectAckId(frame.payload, 0x81);

  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength).getUint16(
      2,
      true,
    ),
    protocolVersion: frame.payload[4] ?? 0,
  };
}

export function decodePingAck(frame: BitstreamFrame): PingAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 5, "PING_ACK");
  expectAckId(frame.payload, 0x82);

  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength).getUint16(
      2,
      true,
    ),
    nonceEcho: frame.payload[4] ?? 0,
  };
}

export function decodeCapsAck(frame: BitstreamFrame): CapsAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 6, "CAPS_ACK");
  expectAckId(frame.payload, 0x83);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  const corrId = view.getUint16(2, true);
  const capsFlags = view.getUint16(4, true);
  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId,
    capsFlags,
  };
}

export function decodeStatusAck(frame: BitstreamFrame): StatusAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 7, "STATUS_ACK");
  expectAckId(frame.payload, 0x84);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: view.getUint16(2, true),
    counter: view.getUint16(4, true),
    protocolVersion: frame.payload[6] ?? 0,
  };
}

export function decodeSensorCfgGetAck(frame: BitstreamFrame): SensorCfgGetAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 13, "SENSOR_CFG_GET_ACK");
  expectAckId(frame.payload, 0x85);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: view.getUint16(2, true),
    sourceId: frame.payload[4] ?? 0,
    enabled: (frame.payload[5] ?? 0) !== 0,
    publishMode: frame.payload[6] ?? 0,
    samplingIntervalMs: view.getUint16(7, true),
    deltaX100: view.getUint16(9, true),
    minPublishIntervalMs: view.getUint16(11, true),
  };
}

export function decodeSensorCfgSetAck(frame: BitstreamFrame): SensorCfgSetAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 7, "SENSOR_CFG_SET_ACK");
  expectAckId(frame.payload, 0x86);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: view.getUint16(2, true),
    sourceId: frame.payload[4] ?? 0,
    appliedMask: view.getUint16(5, true),
  };
}

export function decodeSensorReinitAck(frame: BitstreamFrame): SensorReinitAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 4, "SENSOR_REINIT_ACK");
  expectAckId(frame.payload, 0x87);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: view.getUint16(2, true),
  };
}

export function decodeBmi270ModeSetAck(frame: BitstreamFrame): Bmi270ModeSetAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 5, "BMI270_MODE_SET_ACK");
  expectAckId(frame.payload, 0x88);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: view.getUint16(2, true),
    modeEcho: frame.payload[4] ?? 0,
  };
}

export function decodeBmi270FusionFeedAck(frame: BitstreamFrame): Bmi270FusionFeedAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 6, "BMI270_FUSION_FEED_ACK");
  expectAckId(frame.payload, 0x8a);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: view.getUint16(2, true),
    appliedIntervalMs: view.getUint16(4, true),
  };
}

export function decodeLogLevelAck(frame: BitstreamFrame): LogLevelAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 5, "LOG_LEVEL_ACK");
  expectAckId(frame.payload, 0x8b);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: view.getUint16(2, true),
    appliedLevel: frame.payload[4] ?? 0,
  };
}

export function decodeStreamPauseAck(frame: BitstreamFrame): StreamPauseAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 7, "STREAM_PAUSE_ACK");
  expectAckId(frame.payload, 0x8c);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: view.getUint16(2, true),
    appliedScopeMask: frame.payload[4] ?? 0,
    appliedDurationMs: view.getUint16(5, true),
  };
}

export function decodeStreamResumeAck(frame: BitstreamFrame): StreamResumeAck {
  expectChannel(frame, BITSTREAM_CHANNEL_CONTROL);
  expectLength(frame.payload, 6, "STREAM_RESUME_ACK");
  expectAckId(frame.payload, 0x8d);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0],
    status: frame.payload[1] ?? 0,
    corrId: view.getUint16(2, true),
    appliedScopeMask: frame.payload[4] ?? 0,
  };
}

export function decodeDiagAck(frame: BitstreamFrame): DiagAck {
  expectChannel(frame, BITSTREAM_CHANNEL_DIAGNOSTICS);
  expectLength(frame.payload, 7, "DIAG_ACK");
  expectAckId(frame.payload, 0x80);

  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0],
    ackCommandId: frame.payload[1] ?? 0,
    resultCode: frame.payload[2] ?? 0,
    requestId: view.getUint16(3, true),
    detail: view.getUint16(5, true),
  };
}
