import type { BsType } from "../protocol/types";

export const BS_PREFIX_ASCII = "BS ";
export const BS_PREFIX_BYTES = new Uint8Array([0x42, 0x53, 0x20]);

export const BS_MAX_LEN_SENSOR = 256;
export const BS_MAX_LEN_CTRL = 512;

export function maxLenForType(type: BsType): number {
  switch (type) {
    case 0x04: // EVT_SENSOR
      return BS_MAX_LEN_SENSOR;
    case 0x01: // HELLO
    case 0x02: // REQ
    case 0x03: // RES
    case 0x05: // EVT_STATUS
    case 0x06: // EVT_DIAG
      return BS_MAX_LEN_CTRL;
    default:
      return BS_MAX_LEN_CTRL;
  }
}

