import React from "react";

export interface PortStatusTextProps {
  /** Port path (e.g. COM10). Not shown when null. */
  path: string | null;
  /** Baud rate. Omitted when null. */
  baudRate: number | null;
  /** Total bytes received. Shown as "RX N B" when > 0. */
  bytesRead?: number;
  /** Total bytes sent. Shown as "TX N B" when > 0. */
  bytesWritten?: number;
  /** Optional class name for the root span. */
  className?: string;
}

/**
 * Reusable one-line port status text: "path @ baudRate baud · RX N B · TX N B".
 * Use in card headers, toolbars, or anywhere a compact port summary is needed.
 */
export function PortStatusText({
  path,
  baudRate,
  bytesRead = 0,
  bytesWritten = 0,
  className = "tabular-nums text-xs font-normal text-gray-400 truncate",
}: PortStatusTextProps): React.ReactElement | null {
  if (path == null) return null;
  const baud = baudRate != null ? ` @ ${baudRate} baud` : "";
  const rx = bytesRead > 0 ? ` · RX ${bytesRead} B` : "";
  const tx = bytesWritten > 0 ? ` · TX ${bytesWritten} B` : "";
  const text = `${path}${baud}${tx}${rx}`;
  return <span className={className}>{text}</span>;
}
