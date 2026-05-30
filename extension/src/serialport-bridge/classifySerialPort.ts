import type { PortInfo } from "./protocol";

/** Substrings matched against path / manufacturer / pnpId / locationId / serialNumber (lowercase). */
export const BLUETOOTH_SERIAL_HINT_PATTERNS = [
  "bluetooth",
  "rfcomm",
  "bth",
  "bthenum",
] as const;

export type SerialPortConnectionKind = "bluetooth" | "usb" | "unknown";

/** Lowercase metadata blob used for port classification heuristics. */
export function serialPortMetadataText(port: PortInfo): string
{
  return [
    port.path,
    port.manufacturer,
    port.pnpId,
    port.locationId,
    port.serialNumber,
  ]
    .filter((value) => (value?.trim().length ?? 0) > 0)
    .join(" ")
    .toLowerCase();
}

/** True when any pattern appears in port metadata (same approach as MCP `--denyPattern`). */
export function serialPortMatchesPatterns(
  port: PortInfo,
  patterns: readonly string[],
): boolean
{
  const text = serialPortMetadataText(port);
  return patterns.some((pattern) => text.includes(pattern.toLowerCase()));
}

/** Heuristic: Windows/macOS Bluetooth SPP virtual COM (BTHENUM, RFCOMM, etc.). */
export function isLikelyBluetoothSerialPort(port: PortInfo): boolean
{
  return serialPortMatchesPatterns(port, BLUETOOTH_SERIAL_HINT_PATTERNS);
}

/** Heuristic: USB CDC / VCP (PnP id or explicit VID/PID from SerialPort.list). */
export function isLikelyUsbSerialPort(port: PortInfo): boolean
{
  const pnpId = (port.pnpId ?? "").toUpperCase();
  if (pnpId.includes("USB\\") || pnpId.includes("VID_"))
  {
    return true;
  }
  const vendorId = port.vendorId?.trim() ?? "";
  const productId = port.productId?.trim() ?? "";
  return vendorId.length > 0 && productId.length > 0;
}

/** Classify connection transport for Port Admin / auto-connect hints. */
export function classifySerialPortConnection(port: PortInfo): SerialPortConnectionKind
{
  if (isLikelyBluetoothSerialPort(port))
  {
    return "bluetooth";
  }
  if (isLikelyUsbSerialPort(port))
  {
    return "usb";
  }
  return "unknown";
}

/** Short label for port list column. */
export function serialPortConnectionLabel(kind: SerialPortConnectionKind): string
{
  if (kind === "bluetooth")
  {
    return "Bluetooth";
  }
  if (kind === "usb")
  {
    return "USB";
  }
  return "—";
}
