import * as vscode from "vscode";
import type { WebviewMessage } from "./types";
import {
  startBitstreamSimulatorExtension,
  stopBitstreamSimulatorExtension,
} from "./bitstream-simulator-host";

/**
 * Handle webview requests to start/stop the external bitstream-simulator VSIX.
 */
export function handleBitstreamSimulatorWebviewMessage(
  message: WebviewMessage,
  panel: vscode.WebviewPanel,
  extensionPath: string,
): boolean
{
  switch (message.type)
  {
    case "bitstream-simulator-start":
      void (async () =>
      {
        const result = await startBitstreamSimulatorExtension(extensionPath, {
          ensureBackends: message.ensureBackends !== false,
        });
        void panel.webview.postMessage({
          type: "bitstream-simulator-start-response",
          requestId: message.requestId,
          ok: result.ok,
          error: result.error,
        });
      })();
      return true;

    case "bitstream-simulator-stop":
      void (async () =>
      {
        const result = await stopBitstreamSimulatorExtension();
        void panel.webview.postMessage({
          type: "bitstream-simulator-stop-response",
          requestId: message.requestId,
          ok: result.ok,
          error: result.error,
        });
      })();
      return true;

    default:
      return false;
  }
}
