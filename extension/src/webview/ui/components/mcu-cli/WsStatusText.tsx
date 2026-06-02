import React from "react";

export interface WsStatusTextProps {
  /** Host and port (e.g. "172.28.240.1:9998"). Not shown when empty. */
  hostPort: string;
  /** Approximate bytes received over the WebSocket. Shown as "RX N B" when > 0. */
  bytesReceived?: number;
  /** Approximate bytes sent over the WebSocket. Shown as "TX N B" when > 0. */
  bytesSent?: number;
  /** Optional class name for the root span. */
  className?: string;
}

/**
 * Reusable one-line WebSocket connection status: "host:port · RX N B · TX N B".
 * Use in card headers, toolbars, or anywhere a compact WS summary is needed.
 */
export function WsStatusText({
  hostPort,
  bytesReceived = 0,
  bytesSent = 0,
  className = "text-xs font-normal text-gray-400 truncate",
}: WsStatusTextProps): React.ReactElement | null {
  if (!hostPort) return null;
  const rx = bytesReceived > 0 ? ` · RX ${bytesReceived} B` : "";
  const tx = bytesSent > 0 ? ` · TX ${bytesSent} B` : "";
  const text = `${hostPort}${tx}${rx}`;
  return <span className={className}>{text}</span>;
}
