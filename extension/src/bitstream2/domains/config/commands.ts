export const BS2_CMD = {
  PING: 0x01,
  CAPS_GET: 0x02,

  SENSOR_CFG_GET: 0x10,
  SENSOR_CFG_SET: 0x11,
  STREAM_MASK_SET: 0x12,
  STREAM_RATE_SET: 0x13,

  /** BMI270 output mode: raw=0, fusion=1, hybrid=2 (REQ body 1 byte). */
  BMI270_MODE_SET: 0x14,
  BMI270_MODE_GET: 0x15,
  /** BSX fusion feed period in ms (REQ body u16 LE). */
  BMI270_FUSION_FEED_SET: 0x16,
  BMI270_FUSION_FEED_GET: 0x17,
} as const;

export type Bs2CmdId = (typeof BS2_CMD)[keyof typeof BS2_CMD];
