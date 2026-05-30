/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MQTT_BROKER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    /** Host-injected; selects React root when `WEBVIEW_READY` is true. */
    TERNION_WEBVIEW_APP?: "bitstream";
    /** Host-injected when opening Bitstream (`sensor-telemetry` default). */
    TERNION_BITSTREAM_WORKSPACE?: "sensor-telemetry" | "telemetry" | "sensor-studio";
    WEBVIEW_READY?: boolean;
    WEBVIEW_BASE_URI?: string;
    ONLINE_ASSETS_BASE_URI?: string;
    /** Full URL to `studio-asset-manifest.v1.json` (overrides default `${ONLINE_ASSETS_BASE_URI}/studio-asset-manifest.v1.json`). */
    STUDIO_ASSET_MANIFEST_URL?: string;
    LOCAL_ASSETS_BASE_URI?: string;
    FREE_ASSETS_BASE_URI?: string;
    /** Per-user Tesaiot pack textures (`globalStorage/.../assets/tesaiot/textures`); mirrors Model Catalog / `resolveTesaiotTexturesToFetchableUrl`. */
    TESAIOT_TEXTURES_BASE_URI?: string;
    USER_MODELS_BASE_URI?: string;
    ASSET_SOURCE_STRATEGY?: "local-only" | "local-first" | "online-only";
    IS_WEBVIEW?: boolean;
    CAN_USE_THREADS?: boolean;
    SHARED_ARRAY_BUFFER?: boolean;
    CROSS_ORIGIN_ISOLATED?: boolean;
    __VSCODE_API__?: {
      postMessage: (message: unknown) => void;
    };
  }
}

export {};
