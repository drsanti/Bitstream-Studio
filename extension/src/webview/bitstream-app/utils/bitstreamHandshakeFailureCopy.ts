import type { SerialPortStatusPayload } from "../../../serialport-bridge/protocol.js";

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractRequestId(raw: string): string | null {
  const m = raw.match(UUID_RE);
  return m ? m[0] : null;
}

/** Strips a trailing UUID (and common “: uuid” punctuation) for cleaner technical lines. */
export function stripTrailingRequestId(raw: string): string {
  return raw
    .replace(
      new RegExp(`\\s*:?\\s*${UUID_RE.source}\\s*$`, "i"),
      "",
    )
    .trim();
}

export type BitstreamHandshakeFailureUserCopy = {
  headline: string;
  hint: string;
  technicalLine: string | null;
};

/**
 * Maps raw bridge / handshake errors to user-facing copy. Keeps a support-friendly
 * request id line when the host includes a UUID.
 */
export function userFacingHandshakeFailureCopy(
  rawError: string,
): BitstreamHandshakeFailureUserCopy {
  const trimmed = rawError.trim();
  const lower = trimmed.toLowerCase();
  const requestId = extractRequestId(trimmed);
  const withoutId = stripTrailingRequestId(trimmed);
  const technicalFromBareMessage =
    withoutId.length > 0 ? withoutId : requestId ? `Request ID: ${requestId}` : null;

  if (lower.includes("timed out") || lower.includes("timeout")) {
    return {
      headline: "Serial bridge did not respond in time",
      hint: "The extension waited for the bridge, but the request timed out. Confirm the serial bridge is running, USB is plugged in, and the COM port and baud rate match your device in Port Admin.",
      technicalLine: requestId
        ? `Request ID: ${requestId}`
        : technicalFromBareMessage,
    };
  }

  if (lower.includes("serial bridge") || lower.includes("bridge request")) {
    return {
      headline: "Serial bridge error",
      hint: "Something went wrong talking to the serial bridge process. If problems persist, reload the window or restart the bridge from Port Admin.",
      technicalLine: technicalFromBareMessage ?? trimmed,
    };
  }

  if (lower.includes("eacces") || lower.includes("access denied")) {
    return {
      headline: "Serial port is in use or blocked",
      hint: "Another program may be using this COM port. Close other serial terminals, unplug/replug USB, or pick a different port.",
      technicalLine: technicalFromBareMessage ?? trimmed,
    };
  }

  return {
    headline: "Firmware handshake failed",
    hint: "The session opened, but the device did not complete the expected exchange (HELLO / capabilities / status). Check wiring, port, baud rate, and that firmware matches this host.",
    technicalLine: technicalFromBareMessage ?? trimmed,
  };
}

export function formatBridgeLine(
  serialBridgeStatus: SerialPortStatusPayload | null,
): { label: string; tone: "ok" | "warn" } {
  if (serialBridgeStatus?.isOpen === true && serialBridgeStatus.path) {
    const baud =
      serialBridgeStatus.baudRate != null
        ? ` @ ${serialBridgeStatus.baudRate} baud`
        : "";
    return {
      label: `Bridge reports open on ${serialBridgeStatus.path}${baud}.`,
      tone: "ok",
    };
  }
  return {
    label:
      "Bridge does not report an open serial line — open Port Admin and confirm COM selection.",
    tone: "warn",
  };
}
