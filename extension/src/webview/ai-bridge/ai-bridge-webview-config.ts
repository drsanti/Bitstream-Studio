/** Shared URL + pairing for Bitstream AI bridge WebSocket (webview / browser). */

import { clampAiBridgeClientMaxOutputTokens } from "../../ai/protocol/ai-bridge-protocol";

const PAIRING_STORAGE_KEY = "ternion.ai.bridge.pairingToken";

/** localStorage only (VS Code may inject `window.T3D_AI_BRIDGE_PAIRING_TOKEN` separately). */
export function getAiBridgePairingTokenSavedOnly(): string {
  try {
    return window.localStorage?.getItem(PAIRING_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

/** VS Code webview injection wins; else localStorage (browser / saved pairing). */
export function getAiBridgePairingToken(): string | undefined {
  const fromWindow = (window as unknown as { T3D_AI_BRIDGE_PAIRING_TOKEN?: string })
    .T3D_AI_BRIDGE_PAIRING_TOKEN;
  if (fromWindow && fromWindow.trim().length > 0) {
    return fromWindow.trim();
  }
  try {
    const raw = window.localStorage?.getItem(PAIRING_STORAGE_KEY);
    return raw && raw.trim().length > 0 ? raw.trim() : undefined;
  } catch {
    return undefined;
  }
}

/** Persist pairing token for `ai/hello` when the bridge runs with `AI_BRIDGE_PAIRING_TOKEN`. Dispatches reconnect hint. */
export function setStoredAiBridgePairingToken(token: string): void {
  try {
    const t = token.trim();
    if (t.length > 0) {
      window.localStorage?.setItem(PAIRING_STORAGE_KEY, t);
    } else {
      window.localStorage?.removeItem(PAIRING_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent("ternion-ai-bridge-pairing-changed"));
  } catch {
    // ignore
  }
}

export function clearStoredAiBridgePairingToken(): void {
  try {
    window.localStorage?.removeItem(PAIRING_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("ternion-ai-bridge-pairing-changed"));
  } catch {
    // ignore
  }
}

export function getDefaultAiBridgeWsUrl(): string {
  const fromWindow = (window as unknown as { T3D_AI_BRIDGE_WS_URL?: string }).T3D_AI_BRIDGE_WS_URL;
  return fromWindow && fromWindow.trim().length > 0 ? fromWindow.trim() : "ws://127.0.0.1:9987";
}

export function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const ANTHROPIC_API_KEY_STORAGE_KEY = "ternion.sensorStudio.anthropicApiKey";
const ANTHROPIC_MAX_OUTPUT_TOKENS_STORAGE_KEY = "ternion.sensorStudio.anthropicMaxOutputTokens";

/** Dispatched on successful save/clear so UI can re-read `getStoredAnthropicApiKey`. */
export const ANTHROPIC_API_KEY_CHANGED_EVENT = "ternion-anthropic-api-key-changed";

/** Dispatched when the optional per-request `max_tokens` override is saved or cleared. */
export const ANTHROPIC_MAX_OUTPUT_TOKENS_CHANGED_EVENT = "ternion-anthropic-max-output-tokens-changed";

/** Persisted Anthropic key for the AI bridge (same origin only). Prefer VS Code secrets in production extensions. */
export function getStoredAnthropicApiKey(): string {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    return window.localStorage?.getItem(ANTHROPIC_API_KEY_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

/** Returns false if `localStorage` threw (private mode, quota, sandboxed iframe, policy). */
export function setStoredAnthropicApiKey(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const t = key.trim();
    if (t.length > 0) {
      window.localStorage.setItem(ANTHROPIC_API_KEY_STORAGE_KEY, t);
    } else {
      window.localStorage.removeItem(ANTHROPIC_API_KEY_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(ANTHROPIC_API_KEY_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredAnthropicApiKey(): void {
  try {
    window.localStorage?.removeItem(ANTHROPIC_API_KEY_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(ANTHROPIC_API_KEY_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

/** When set, sent on each `ai/request` as **`maxOutputTokens`** (clamped). When unset, bridge uses env / default. */
export function getStoredAnthropicMaxOutputTokens(): number | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    const raw = window.localStorage?.getItem(ANTHROPIC_MAX_OUTPUT_TOKENS_STORAGE_KEY)?.trim();
    if (!raw) {
      return undefined;
    }
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) {
      return undefined;
    }
    return clampAiBridgeClientMaxOutputTokens(n);
  } catch {
    return undefined;
  }
}

/** Returns false if localStorage threw. */
export function setStoredAnthropicMaxOutputTokens(tokens: number): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const clamped = clampAiBridgeClientMaxOutputTokens(tokens);
    window.localStorage.setItem(ANTHROPIC_MAX_OUTPUT_TOKENS_STORAGE_KEY, String(clamped));
    window.dispatchEvent(new CustomEvent(ANTHROPIC_MAX_OUTPUT_TOKENS_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredAnthropicMaxOutputTokens(): void {
  try {
    window.localStorage?.removeItem(ANTHROPIC_MAX_OUTPUT_TOKENS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(ANTHROPIC_MAX_OUTPUT_TOKENS_CHANGED_EVENT));
  } catch {
    // ignore
  }
}
