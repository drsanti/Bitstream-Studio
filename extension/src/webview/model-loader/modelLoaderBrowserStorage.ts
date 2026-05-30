import type { ModelLoaderConfig } from "./types";

/** Same key as `useModelLoaderRuntimeBrowser` — single source of truth for browser persistence. */
export const MODEL_LOADER_BROWSER_STORAGE_KEY = "ternion-model-loader-config";

const DEFAULT_BROWSER_CONFIG: ModelLoaderConfig = {
  baseUrl: "https://admin.tesaiot.com",
  apiKey: "",
  caCertPath: "",
};

/**
 * Read Model Loader config from localStorage (browser only).
 * Used for synchronous initial state so fields are not blank before async bootstrap.
 */
export function readModelLoaderBrowserConfig(): ModelLoaderConfig {
  if (typeof window === "undefined") {
    return DEFAULT_BROWSER_CONFIG;
  }
  try {
    const raw = localStorage.getItem(MODEL_LOADER_BROWSER_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_BROWSER_CONFIG;
    }
    const parsed = JSON.parse(raw) as Partial<ModelLoaderConfig>;
    return {
      baseUrl: parsed.baseUrl ?? DEFAULT_BROWSER_CONFIG.baseUrl,
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      caCertPath: typeof parsed.caCertPath === "string" ? parsed.caCertPath : "",
    };
  } catch {
    return DEFAULT_BROWSER_CONFIG;
  }
}

/** Persist only fields that belong in localStorage (omit VS Code-only hints). */
export function serializeModelLoaderBrowserConfig(config: ModelLoaderConfig): string {
  const { hasStoredApiKey: _omit, ...rest } = config;
  return JSON.stringify(rest);
}
