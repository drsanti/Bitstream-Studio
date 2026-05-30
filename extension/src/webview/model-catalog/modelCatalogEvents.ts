/** Dispatched on `window` after a local download completes (browser) so Model Catalog can refetch. */
export const MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT = "model-catalog-refresh-downloaded";

/** Extension host posts this to the webview when a downloaded model was written to disk. */
export const MODEL_CATALOG_LOCAL_MODELS_CHANGED_MESSAGE = "model-catalog-local-models-changed";
