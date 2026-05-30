/**
 * CRC16-CCITT (poly 0x1021, init 0xFFFF, non-reflected, xorout 0x0000).
 *
 * Matches firmware implementation in `bitstream_protocol_crc16_ccitt`.
 */
export function crc16Ccitt(data: Uint8Array, offset = 0, length?: number): number {
  const len = length ?? (data.length - offset);
  if (len <= 0) return 0xffff;

  let crc = 0xffff;
  for (let i = 0; i < len; i++) {
    crc ^= (data[offset + i]! << 8) & 0xffff;
    for (let b = 0; b < 8; b++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc & 0xffff;
}

