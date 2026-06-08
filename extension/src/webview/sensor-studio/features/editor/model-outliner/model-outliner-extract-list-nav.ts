import {
  studioGlbExtractRowKey,
  type StudioGltfExtractRow,
} from "../gltf/studio-gltf-extract";

export const EXTRACT_LIST_SECTION_KEYS = [
  "animations",
  "parts",
  "materials",
  "morphs",
  "lights",
  "cameras",
] as const;

export type ExtractListSectionKey = (typeof EXTRACT_LIST_SECTION_KEYS)[number];

export type ExtractListFilteredRows = Record<ExtractListSectionKey, StudioGltfExtractRow[]>;

export function flattenExtractListRows(filtered: ExtractListFilteredRows): StudioGltfExtractRow[] {
  const rows: StudioGltfExtractRow[] = [];
  for (const key of EXTRACT_LIST_SECTION_KEYS) {
    rows.push(...filtered[key]);
  }
  return rows;
}

export function extractListRowKey(row: StudioGltfExtractRow): string {
  return studioGlbExtractRowKey(row);
}
