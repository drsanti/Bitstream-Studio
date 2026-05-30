import { isVsCodeExtensionWebview } from "../isVsCodeExtensionWebview";
import { usePostMessageTraceStore } from "./post-message-trace.store";

let installed = false;

function shouldIgnoreInboundDevNoise(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const t = (data as { type?: unknown }).type;
  if (typeof t !== "string") return false;
  if (t.startsWith("webpack")) return true;
  if (t.startsWith("vite:")) return true;
  return false;
}

/**
 * Instrument `window.__VSCODE_API__.postMessage` and `window` `message` (capture) so the
 * Post Message trace UI can show extension ↔ webview traffic as seen from the webview.
 * No-op outside a VS Code extension webview.
 */
export function installPostMessageTrace(): void {
  if (typeof window === "undefined" || installed) return;
  if (!isVsCodeExtensionWebview()) return;

  installed = true; // set before wrapping so concurrent calls cannot double-wrap
  const append = usePostMessageTraceStore.getState().append;

  const w = window as Window & {
    __VSCODE_API__?: { postMessage?: (message: unknown) => void };
  };

  const api = w.__VSCODE_API__;
  if (api?.postMessage) {
    const original = api.postMessage.bind(api);
    const wrapped = (message: unknown) => {
      append({ direction: "webview→host", payload: message });
      return original(message);
    };

    const ownDescriptor = Object.getOwnPropertyDescriptor(api, "postMessage");
    const writable =
      ownDescriptor === undefined
        ? true
        : ownDescriptor.writable === true || typeof ownDescriptor.set === "function";

    if (writable) {
      try {
        api.postMessage = wrapped;
      } catch {
        // Some extension runtimes expose a non-writable API object. Keep app running and
        // continue tracing inbound host->webview traffic only.
      }
    }
  }

  window.addEventListener(
    "message",
    (event: MessageEvent) => {
      if (shouldIgnoreInboundDevNoise(event.data)) return;
      append({ direction: "host→webview", payload: event.data });
    },
    true
  );
}
