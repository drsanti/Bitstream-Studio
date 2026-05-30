export type ModelFileType = 'glb' | 'gltf';

/** Packaged = bundled under `src/assets/free/models` or `tesaiot/models`; Downloaded = dynamic scan / user trees. */
export type ModelCatalogCategory = 'packaged' | 'downloaded';

/** Where the catalog entry came from for merge priority. */
export type ModelCatalogSource = 'static' | 'dynamic';

export interface ModelEntry {
  id: string;
  name: string;
  /** Category from metadata JSON (or Uncategorized fallback). */
  modelCategory: string;
  fileType: ModelFileType;
  /** Public URL (Vite asset URL) to load the model. */
  url: string;
  catalogCategory: ModelCatalogCategory;
  /**
   * Stable key for deduping (project-relative path, lowercase posix).
   * Example: tesaiot/models/PDM-xxx/model.glb (extension) or src/assets/tesaiot/models/... (dev tree)
   */
  dedupeKey: string;
  /** Dynamic listing wins over static glob when both match. */
  modelSource?: ModelCatalogSource;
}

export interface ThumbnailEntry {
  modelId: string;
  /** Base64 data URL for the thumbnail image. */
  dataUrl: string;
}

