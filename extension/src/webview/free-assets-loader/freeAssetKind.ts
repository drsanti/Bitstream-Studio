export type FreeAssetKind = "model" | "texture" | "data" | "other";

function fileExtension(path: string): string {
  const base = path.split(/[/\\]/).pop() ?? "";
  const i = base.lastIndexOf(".");
  return i >= 0 ? base.slice(i + 1).toLowerCase() : "";
}

/**
 * Classify GitHub `assets/` paths for UI (3D models vs textures vs sidecar data).
 */
export function classifyFreeAssetKind(relativePath: string): FreeAssetKind {
  const ext = fileExtension(relativePath);
  const model = new Set([
    "glb",
    "gltf",
    "fbx",
    "obj",
    "usdz",
    "stl",
    "blend",
    "dae",
    "3mf",
  ]);
  const texture = new Set([
    "png",
    "jpg",
    "jpeg",
    "webp",
    "ktx2",
    "ktx",
    "dds",
    "bmp",
    "tif",
    "tiff",
    "tga",
    "hdr",
    "exr",
    "svg",
  ]);
  const data = new Set(["json", "bin", "wasm", "xml", "txt", "md", "csv"]);
  if (model.has(ext)) return "model";
  if (texture.has(ext)) return "texture";
  if (data.has(ext)) return "data";
  return "other";
}

export function splitRelativeAssetPath(relativePath: string): {
  parent: string;
  fileName: string;
} {
  const normalized = relativePath.replace(/\\/g, "/");
  const i = normalized.lastIndexOf("/");
  if (i < 0) {
    return { parent: "", fileName: normalized };
  }
  return { parent: normalized.slice(0, i), fileName: normalized.slice(i + 1) };
}
