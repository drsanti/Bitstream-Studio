/** BS2 wall-clock cmdId (REQ body after reqId/flags). Firmware `bitstream_bs_wire.h`. */
export const BS2_TIME_CMD = {
  SET: 0x18,
  GET: 0x19,
  SYNC: 0x1a,
} as const;

export const BS2_RTC_STATUS_LEN = 16;
export const BS2_TIME_SET_REQ_LEN = 6;
export const BS2_TIME_OP_RES_LEN = 2;

export const BS2_RTC_FLAG_VALID = 0x0001;
export const BS2_RTC_FLAG_NET_SYNC_AVAILABLE = 0x0002;
export const BS2_RTC_FLAG_NET_SYNC_OK = 0x0004;
export const BS2_RTC_FLAG_NET_SYNC_FAILED = 0x0008;
export const BS2_RTC_FLAG_NET_SYNC_IN_PROGRESS = 0x0010;

export const BS2_RTC_SOURCE_NONE = 0;
export const BS2_RTC_SOURCE_COMPILE = 1;
export const BS2_RTC_SOURCE_HOST = 2;
export const BS2_RTC_SOURCE_NTP = 3;

export const BS2_RTC_ERR_NTP_NOT_IMPL = 6;
