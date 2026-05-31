import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview.js";
import { postSerialBridgeStopFromExtension } from "../bridge/serial-bridge-extension-messages.js";

export type DisconnectSessionFn = (options?: {
  userInitiated?: boolean;
  preserveLiveTelemetry?: boolean;
}) => Promise<void>;

export type RunDisconnectAllOptions = {
  /** Stop extension-managed bridge after COM + WS teardown (VSIX only). Default true. */
  stopBridge?: boolean;
  userInitiated?: boolean;
  preserveLiveTelemetry?: boolean;
};

/**
 * Ordered teardown for Guided **Disconnect all**:
 * 1. Close COM (via `disconnectSession` → `releaseOpenSerialPort`)
 * 2. Disconnect WebSocket client
 * 3. Stop bridge process (VSIX, when `stopBridge` is not false)
 */
export async function runDisconnectAllSession(
  disconnectSession: DisconnectSessionFn,
  options?: RunDisconnectAllOptions,
): Promise<void> {
  await disconnectSession({
    userInitiated: options?.userInitiated ?? true,
    preserveLiveTelemetry: options?.preserveLiveTelemetry,
  });

  const ext = isVsCodeExtensionWebview();
  if (ext && options?.stopBridge !== false) {
    postSerialBridgeStopFromExtension();
  }
}
