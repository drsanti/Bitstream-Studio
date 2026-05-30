import type { PortInfo } from "../../serialport-bridge/protocol";
import {
  classifySerialPortConnection,
  serialPortConnectionLabel,
} from "../../serialport-bridge/classifySerialPort";

export type PortInfoReadableRow = {
  label: string;
  value: string;
  monospace?: boolean;
  /** Show copy button (long IDs). */
  copyable?: boolean;
};

/** Label/value rows for Port Admin readable view; omits empty optional fields. */
export function portInfoReadableRows(port: PortInfo): PortInfoReadableRow[]
{
  const rows: PortInfoReadableRow[] = [];

  const add = (
    label: string,
    value: string | undefined,
    monospace = false,
    copyable = false,
  ) =>
  {
    const trimmed = value?.trim() ?? "";
    if (trimmed.length === 0)
    {
      return;
    }
    rows.push({ label, value: trimmed, monospace, copyable });
  };

  add("Port", port.path, true);
  add("Connection", serialPortConnectionLabel(classifySerialPortConnection(port)));
  add("Manufacturer", port.manufacturer);
  add("Serial number", port.serialNumber, true, true);
  add("Vendor ID", port.vendorId, true, true);
  add("Product ID", port.productId, true, true);
  add("PnP ID", port.pnpId, true, true);
  add("Location ID", port.locationId, true, true);

  return rows;
}

/** Pretty JSON for Port Admin debug view. */
export function formatPortInfoAsJson(port: PortInfo): string
{
  return JSON.stringify(port, null, 2);
}
