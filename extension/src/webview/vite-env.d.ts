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
    COI_SERVICE_WORKER_URI?: string;
    JOLT_WORKER_SCRIPT_URI?: string;
    JOLT_SINGLE_THREADED_PROD_URI?: string;
    JOLT_SINGLE_THREADED_DEBUG_URI?: string;
    JOLT_MULTITHREADED_PROD_URI?: string;
    JOLT_MULTITHREADED_DEBUG_URI?: string;
    IS_WEBVIEW?: boolean;
    JOLT_URI?: string;
    CAN_USE_THREADS?: boolean;
    SHARED_ARRAY_BUFFER?: boolean;
    CROSS_ORIGIN_ISOLATED?: boolean;
    __JOLT_WORKER_BLOB_URL__?: string;
  }
}

export {};
