import { useEffect, useState } from "react";
import {
  type SerialBridgeHostReportedStatus,
  parseSerialBridgeStatusMessage,
  postSerialBridgeGetStatusFromExtension,
} from "./serial-bridge-extension-messages";

/** Subscribes to `serial-bridge-status*` from the VS Code extension host. */
export function useSerialBridgeExtensionHostStatus(
  enabled: boolean,
): SerialBridgeHostReportedStatus | null {
  const [status, setStatus] = useState<SerialBridgeHostReportedStatus | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      return;
    }

    const onMsg = (event: MessageEvent) => {
      const parsed = parseSerialBridgeStatusMessage(event.data);
      if (parsed) {
        setStatus(parsed);
      }
    };

    window.addEventListener("message", onMsg);
    postSerialBridgeGetStatusFromExtension();

    return () => {
      window.removeEventListener("message", onMsg);
    };
  }, [enabled]);

  return status;
}
