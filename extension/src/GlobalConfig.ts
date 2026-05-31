export { GlobalConfig as gc };
export const GlobalConfig = {
  /**
   * `false` = release-oriented build for publishing: do not assume a developer repo layout.
   * End users persist downloads under `ExtensionContext.globalStorageUri` (see `assetLayout.ts`, `extensionAssetPaths.ts`),
   * not paths like `t3d-extension/src/assets` (those come from the browser + bridge dev flow only).
   * Set `true` only for local development (e.g. dev badge, local asset loading in `MyApp`).
   */
  IS_DEV_MODE: false,
  DEFAULT_MAX_WORKER_THREADS: 3 /** Note: This for web browser mode, for VS Code webview mode not supported multi-threading */,
  LOCAL_ASSETS_BASE_URI: "assets",
  /**
   * Base URI for online assets hosted on GitHub (free pack).
   * Must be the directory that contains `models/`, `textures/`, etc. — i.e. repo `assets/` on `main`.
   * See `extension/docs/ASSETS_ONLINE_REPO.md`.
   * VS Code webview can override via globalState / Assets Manager (`ternion-base-url`).
   */
  ONLINE_ASSETS_BASE_URI:
    "https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets",
  /** Default maximum number of worker threads for physics initialization */

  DEFAULT_FREE_ASSETS_SAVE_PATH:
    "" /** Documented relative to globalStorage `assets/`: Free pack mirror `free/`; see getFreeGithubMirrorRootUri */,
  DEFAULT_TESA_ASSETS_SAVE_PATH:
    "" /** Documented relative to globalStorage `assets/`: Model Loader default `tesaiot/models`; see getModelDownloadsRootUri */,
};
