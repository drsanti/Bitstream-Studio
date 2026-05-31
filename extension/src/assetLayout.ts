/**
 * Canonical asset layout for t3d-extension.
 *
 * Under **both** `globalStorage/.../assets/` and monorepo **`ternion-t3d/assets/`**, use two
 * **packs** with the same shape:
 *
 * - **Free pack** — `free/models/`, `free/textures/`, … (GitHub free mirror; same layout as
 *   the public repo’s `assets/` tree without the outer `assets/` prefix inside `free/`).
 * - **Tesaiot pack** — `tesaiot/models/` (Model Loader / API), `tesaiot/textures/`, … for
 *   platform-side assets alongside downloads.
 *
 * No VS Code API — safe to import from extension host, Node bridge, and webview.
 *
 * Human-readable tables: `docs/GLOBAL_ASSET_DIRECTORIES.md`.
 * VS Code `globalStorage` URI helpers: `src/extensionAssetPaths.ts`.
 */

/** Repo-relative root of the dev asset tree (`t3d-extension/src/assets`). */
export const DEV_SRC_ASSETS_ROOT = "src/assets" as const;

/** Prefix `src/assets/` for dev URL mapping (browser vs extension). */
export const DEV_SRC_ASSETS_PREFIX = `${DEV_SRC_ASSETS_ROOT}/` as const;

/**
 * Default on-disk folder for Model Loader in **development** (bridge / browser /
 * extension dev scan). Production writes use globalStorage `tesaiot/models/`
 * (see `extensionAssetPaths.ts`).
 */
export const DEV_MODEL_LOADER_OUTPUT_RELATIVE =
  `${DEV_SRC_ASSETS_ROOT}/tesaiot/models` as const;

/** Browser + bridge cwd-relative default (same folder as `DEV_MODEL_LOADER_OUTPUT_RELATIVE`). */
export const DEV_MODEL_LOADER_BROWSER_RELATIVE =
  `./${DEV_MODEL_LOADER_OUTPUT_RELATIVE}` as const;

/**
 * Directory segments under globalStorage `.../assets/` (production).
 * Used with `vscode.Uri.joinPath(getUserAssetsRootUri(context), ...segments)`.
 */
export const GLOBAL_STORAGE_ASSET_DIRS = {
  /**
   * Free GitHub pack mirror: `<globalStorage>/assets/free/` (`models/`, `textures/`, …).
   */
  freePackGlobal: ["free"] as const,
  tesaiotModels: ["tesaiot", "models"] as const,
  tesaiotTextures: ["tesaiot", "textures"] as const,
} as const;

/**
 * Directory segments under dev `src/assets/` (mirrors pack layout under `globalStorage`).
 */
export const DEV_SRC_ASSET_DIRS = {
  freeModels: ["free", "models"] as const,
  freeTextures: ["free", "textures"] as const,
  tesaiotModels: ["tesaiot", "models"] as const,
  tesaiotTextures: ["tesaiot", "textures"] as const,
} as const;

/**
 * Logical web prefixes for paths under the globalStorage **assets** bucket
 * (messages / `webPath`, not necessarily filesystem roots).
 */
export const TESAIOT_MODELS_WEB_PREFIX = "tesaiot/models/" as const;

/** Optional Tesaiot-side textures / raster assets (parallel to `free/textures/`). */
export const TESAIOT_TEXTURES_WEB_PREFIX = "tesaiot/textures/" as const;

/**
 * Local browser-app HTTP server maps this path to extension globalStorage
 * `.../assets/tesaiot/models` (see `local-webapp-server.ts`).
 */
export const BROWSER_USER_MODELS_HTTP_PATH_PREFIX = "/__ternion_user_models/" as const;

/**
 * For `new URL(relativePrefix + rest, origin + "/")` — matches {@link BROWSER_USER_MODELS_HTTP_PATH_PREFIX} without a leading slash.
 */
export const BROWSER_USER_MODELS_URL_RELATIVE_PREFIX =
  `${BROWSER_USER_MODELS_HTTP_PATH_PREFIX.slice(1)}` as const;

/**
 * Local browser-app server maps this path to extension globalStorage
 * `.../assets/free` (GitHub free-pack mirror root).
 */
export const BROWSER_USER_FREE_HTTP_PATH_PREFIX = "/__ternion_user_free/" as const;

export const BROWSER_USER_FREE_URL_RELATIVE_PREFIX =
  `${BROWSER_USER_FREE_HTTP_PATH_PREFIX.slice(1)}` as const;

/**
 * Local browser-app server maps this path to extension globalStorage
 * `.../assets/tesaiot/textures` (parallel to the free-pack mirror).
 */
export const BROWSER_USER_TESAIOT_TEXTURES_HTTP_PATH_PREFIX =
  "/__ternion_user_tesaiot_textures/" as const;

export const BROWSER_USER_TESAIOT_TEXTURES_URL_RELATIVE_PREFIX =
  `${BROWSER_USER_TESAIOT_TEXTURES_HTTP_PATH_PREFIX.slice(1)}` as const;

export const FREE_MODELS_WEB_PREFIX = "free/models/" as const;

/**
 * When `false`, the webview catalog and Asset Registry do not enumerate GLBs/textures
 * from repo `src/assets/**` via Vite globs. Lists come from globalStorage scans
 * (extension host / model-downloader bridge) plus the curated manifest overlay.
 */
export const REPO_ASSET_STATIC_SCAN_ENABLED = false;

/**
 * Mirror of the **literal** `import.meta.glob` patterns in
 * `webview/model-catalog/modelCatalog-asset-scan.ts` (Vite only accepts string literals there).
 * Paths are relative to `src/webview/model-catalog/`.
 */
export const MODEL_CATALOG_BUILD_GLOBS = {
  freeModelsGlb: "../../assets/free/models/**/*.{glb,gltf}",
  tesaiotModelsGlb: "../../assets/tesaiot/models/**/*.{glb,gltf}",
  mirroredModelsGlb: "../../assets/models/**/*.{glb,gltf}",
  freeModelsJson: "../../assets/free/models/**/*.json",
  tesaiotModelsJson: "../../assets/tesaiot/models/**/*.json",
  mirroredModelsJson: "../../assets/models/**/*.json",
} as const;

/**
 * Substrings used to normalize bundled file paths to `src/assets/...` keys.
 * Order: most specific first.
 */
export const DEV_GLOB_PATH_MARKERS: readonly string[] = [
  "assets/tesaiot/models/",
  "assets/tesaiot/textures/",
  "assets/free/models/",
  "assets/free/textures/",
  "assets/models/",
];
