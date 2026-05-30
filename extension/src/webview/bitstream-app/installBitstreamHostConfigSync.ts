import { isVsCodeExtensionWebview } from "../isVsCodeExtensionWebview";
import {
  serializePersistedBitstreamConfig,
  useBitstreamConfigStore,
} from "./state/bitstreamConfig.store";

const MSG_PULL = "bitstream-dashboard-config-pull" as const;
const MSG_PUSH = "bitstream-dashboard-config-push" as const;
const MSG_RESP = "bitstream-dashboard-config-response" as const;

const MIRROR_DEBUG_LS_KEY = "ternion.bitstreamMirrorDebug";

interface ConfigResponseMsg {
  type: typeof MSG_RESP;
  configJson?: string | null;
  error?: string;
}

export type BitstreamHostMirrorStatus =
  | { kind: "off" }
  | { kind: "pulling" }
  | { kind: "synced"; atMs: number; note?: string }
  | { kind: "no_mirror_file"; atMs: number }
  | { kind: "error"; atMs: number; message: string };

export interface InstallBitstreamHostConfigSyncOptions {
  onStatus?: (status: BitstreamHostMirrorStatus) => void;
}

/** Vite dev server, or set `localStorage.setItem('ternion.bitstreamMirrorDebug','1')` in the webview. */
export function isBitstreamMirrorDebugEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(MIRROR_DEBUG_LS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * In the VS Code extension webview, mirrors persisted Bitstream dashboard fields to
 * `globalStorage/bitstream-dashboard-config.json` via postMessage, and merges host file
 * changes back into `useBitstreamConfigStore` after pull.
 */
export function installBitstreamHostConfigSync(
  options?: InstallBitstreamHostConfigSyncOptions,
): () => void {
  const onStatus = options?.onStatus;

  if (!isVsCodeExtensionWebview()) {
    return () => {};
  }

  const w = window as Window & { __VSCODE_API__?: { postMessage: (m: unknown) => void } };
  const vscode = w.__VSCODE_API__;
  if (!vscode?.postMessage) {
    return () => {};
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastPushed = "";

  const readSerialized = (): string => {
    return serializePersistedBitstreamConfig(useBitstreamConfigStore.getState());
  };

  const flushPush = (): void => {
    const next = readSerialized();
    if (next === lastPushed) {
      return;
    }
    lastPushed = next;
    vscode.postMessage({ type: MSG_PUSH, configJson: next });
    onStatus?.({ kind: "synced", atMs: Date.now(), note: "pushed to host" });
  };

  const schedulePush = (): void => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      flushPush();
    }, 450);
  };

  const onMessage = (event: MessageEvent): void => {
    const data = event.data as ConfigResponseMsg | undefined;
    if (!data || data.type !== MSG_RESP) {
      return;
    }

    if (typeof data.error === "string" && data.error.length > 0) {
      onStatus?.({ kind: "error", atMs: Date.now(), message: data.error });
      lastPushed = readSerialized();
      return;
    }

    if (typeof data.configJson === "string" && data.configJson.trim().length > 0) {
      try {
        const parsed: unknown = JSON.parse(data.configJson);
        useBitstreamConfigStore.getState().mergeHostOverlay(parsed);
        onStatus?.({ kind: "synced", atMs: Date.now(), note: "merged from host file" });
      } catch {
        onStatus?.({
          kind: "error",
          atMs: Date.now(),
          message: "Host mirror file is not valid JSON",
        });
      }
    } else {
      onStatus?.({ kind: "no_mirror_file", atMs: Date.now() });
    }
    lastPushed = readSerialized();
  };

  window.addEventListener("message", onMessage);
  onStatus?.({ kind: "pulling" });
  vscode.postMessage({ type: MSG_PULL });

  const unsub = useBitstreamConfigStore.subscribe(schedulePush);

  return () => {
    window.removeEventListener("message", onMessage);
    unsub();
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
    }
    onStatus?.({ kind: "off" });
  };
}
