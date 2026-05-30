/**
 * CRC-16/CCITT-FALSE
 * poly=0x1021 init=0xFFFF refin=false refout=false xorout=0x0000
 */
export function crc16CcittFalse(bytes: Uint8Array, start = 0, length = bytes.length - start): number {
  let crc = 0xffff;
  const end = start + length;
  for (let i = start; i < end; i += 1) {
    crc ^= (bytes[i] ?? 0) << 8;
    for (let b = 0; b < 8; b += 1) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc & 0xffff;
}

