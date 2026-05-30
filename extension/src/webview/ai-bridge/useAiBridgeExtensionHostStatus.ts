import { useEffect, useState } from "react";
import {
  type AiBridgeHostReportedStatus,
  parseAiBridgeStatusMessage,
  postAiBridgeGetStatusFromExtension,
} from "./ai-bridge-extension-messages";

/**
 * Subscribes to `ai-bridge-status` from the VS Code extension host and requests an initial refresh.
 * No-op when `enabled` is false (browser / non-extension).
 */
export function useAiBridgeExtensionHostStatus(enabled: boolean): AiBridgeHostReportedStatus | null {
  const [status, setStatus] = useState<AiBridgeHostReportedStatus | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      return;
    }

    const onMsg = (event: MessageEvent) => {
      const parsed = parseAiBridgeStatusMessage(event.data);
      if (parsed) {
        setStatus(parsed);
      }
    };

    window.addEventListener("message", onMsg);
    postAiBridgeGetStatusFromExtension();

    return () => {
      window.removeEventListener("message", onMsg);
    };
  }, [enabled]);

  return status;
}
