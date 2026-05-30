import { encodeBsEnvelope } from "../framing/bs-envelope";
import { BS_TYPE } from "../protocol/types";

/**
 * Minimal BS2 HELLO wire frame (host → device). Firmware answers with a full HELLO
 * when it receives `BS_TYPE.HELLO`, so the bridge can use this after COM open.
 */
export function buildHelloProbeWireBytes(): Uint8Array {
  return encodeBsEnvelope({ type: BS_TYPE.HELLO, payload: new Uint8Array(0) }).bytes;
}
