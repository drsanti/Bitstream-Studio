export type BsType = number;

export const BS_TYPE = {
  HELLO: 0x01,
  REQ: 0x02,
  RES: 0x03,
  EVT_SENSOR: 0x04,
  EVT_STATUS: 0x05,
  EVT_DIAG: 0x06,
} as const satisfies Record<string, BsType>;

export type BsHelloCaps = number;

export type BsEnvelopeFrame = {
  /** Message type (`BS_TYPE.*`). */
  type: BsType;
  /** Payload bytes (length = LEN). */
  payload: Uint8Array;
  /** Wire-level LEN value. */
  len: number;
};

