import {
  T3D_DEFAULT_WS_CLIENT_URL,
  T3D_MODEL_LOADER_WS_CLIENT_URL,
} from "../websocket/T3DWebSocketConfig";

type TernionWsGlobals = Window & {
  T3D_BITSTREAM_WS_URL?: string;
  T3D_MODEL_LOADER_WS_URL?: string;
  T3D_AI_WS_URL?: string;
};

function isWsUrl(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("ws://") || value.startsWith("wss://"));
}

/** Bitstream / serial broker URL (VS Code webview may inject `window.T3D_BITSTREAM_WS_URL`). */
export function getBitstreamWsClientUrl(): string {
  if (typeof window === "undefined") {
    return T3D_DEFAULT_WS_CLIENT_URL;
  }
  const u = (window as TernionWsGlobals).T3D_BITSTREAM_WS_URL;
  if (isWsUrl(u)) {
    return u;
  }
  return T3D_DEFAULT_WS_CLIENT_URL;
}

/** Model downloader / Free Loader / catalog broker URL. */
export function getModelLoaderWsClientUrl(): string {
  if (typeof window === "undefined") {
    return T3D_MODEL_LOADER_WS_CLIENT_URL;
  }
  const u = (window as TernionWsGlobals).T3D_MODEL_LOADER_WS_URL;
  if (isWsUrl(u)) {
    return u;
  }
  return T3D_MODEL_LOADER_WS_CLIENT_URL;
}

/**
 * AI transport URL.
 * Default policy: use dedicated AI URL if injected, otherwise reuse model-loader broker URL.
 */
export function getAiWsClientUrl(): string {
  if (typeof window === "undefined") {
    return T3D_MODEL_LOADER_WS_CLIENT_URL;
  }
  const u = (window as TernionWsGlobals).T3D_AI_WS_URL;
  if (isWsUrl(u)) {
    return u;
  }
  return getModelLoaderWsClientUrl();
}
