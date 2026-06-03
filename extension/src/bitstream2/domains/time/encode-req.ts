/** REQ body for TIME_SET: unix u32 LE + tz_offset_min i16 LE. */
export function encodeTimeSetBody(unixSec: number, tzOffsetMin: number): Uint8Array {
  const body = new Uint8Array(6);
  const view = new DataView(body.buffer);
  view.setUint32(0, unixSec >>> 0, true);
  view.setInt16(4, tzOffsetMin, true);
  return body;
}
