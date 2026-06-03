/** BS2 HELLO caps bits (firmware `bitstream_bs_wire.h`). */
export const BS2_CAPS_WIFI = 0x0004;
export const BS2_CAPS_SENSOR_CFG_V2 = 0x0010;
export const BS2_CAPS_SENSOR_CFG_V21 = 0x0020;
export const BS2_CAPS_BMI270_CTRL = 0x0040;
export const BS2_CAPS_TIME = 0x0080;

/** Legacy 0xAA55 CAPS_ACK bit7 — control-channel log level (still on v1 CAPS when used). */
export const BITSTREAM_CAPS_FLAG_LOG_LEVEL_CONTROL = 1 << 7;
