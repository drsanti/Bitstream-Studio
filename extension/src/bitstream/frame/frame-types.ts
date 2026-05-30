export const BITSTREAM_MAGIC = 0xaa55;
export const BITSTREAM_HEADER_SIZE = 8;

export const BITSTREAM_CHANNEL_SENSOR = 0x01;
export const BITSTREAM_CHANNEL_CONTROL = 0x03;
export const BITSTREAM_CHANNEL_DIAGNOSTICS = 0x05;
/** Wi‑Fi requests/events (`proj_cm55` bitstream Wi‑Fi service). */
export const BITSTREAM_CHANNEL_WIFI = 0x06;

export const BITSTREAM_SENSOR_FLAG_SOURCE_BMM350 = 1 << 3;
export const BITSTREAM_SENSOR_FLAG_SOURCE_BMI270 = 1 << 4;
export const BITSTREAM_SENSOR_FLAG_BMI270_FUSION_PAYLOAD = 1 << 5;
export const BITSTREAM_SENSOR_FLAG_SOURCE_SHT40 = 1 << 1;
export const BITSTREAM_SENSOR_FLAG_SOURCE_DPS368 = 1 << 2;

export type BitstreamChannel = number;
export type BitstreamFlags = number;

export interface BitstreamFrame {
  sequence: number;
  channel: BitstreamChannel;
  flags: BitstreamFlags;
  payload: Uint8Array;
}

export interface BitstreamEncodedFrame {
  frame: Uint8Array;
  sequence: number;
}

export interface BitstreamFrameHeader {
  magic: number;
  sequence: number;
  channel: number;
  flags: number;
  payloadLength: number;
}

export interface BitstreamDecodeResult {
  frames: BitstreamFrame[];
  bufferedBytes: number;
}
