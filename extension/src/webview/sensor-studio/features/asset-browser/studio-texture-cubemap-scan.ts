import type { StudioAssetDescriptor } from "./studio-asset.types";

const TEXTURE_GLOB_MARKERS = [
  "assets/free/textures/",
  "assets/tesaiot/textures/",
  "assets/textures/",
] as const;

const CUBEMAP_FACE_FILES = new Set(
  ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"].map((s) => s.toLowerCase()),
);

function textureGlobPathToAssetRelative(filePath: string): string | null {
  const posix = filePath.replace(/\\/g, "/");
  for (const marker of TEXTURE_GLOB_MARKERS) {
    const idx = posix.indexOf(marker);
    if (idx >= 0) {
      return posix.slice(idx + marker.length);
    }
  }
  return null;
}

function isStandardCubemapFaceFileName(name: string): boolean {
  return CUBEMAP_FACE_FILES.has(name.toLowerCase());
}

/** Skip listing six standard faces when the folder is a cubemap set (listed under Environments). */
export function shouldSkipTextureAsCubemapFace(relativeAssetPath: string): boolean {
  const posix = relativeAssetPath.replace(/\\/g, "/");
  if (!posix.toLowerCase().includes("/cubemap/")) {
    return false;
  }
  const base = posix.split("/").pop() ?? "";
  return isStandardCubemapFaceFileName(base);
}

/**
 * Build-time scan of JPEG, PNG, and WebP under bundled texture trees (Vite literal globs).
 */
export function scanStudioFlatTextureDescriptors(): StudioAssetDescriptor[] {
  const modules = {
    ...(import.meta.glob("../../../../assets/textures/**/*.{jpg,jpeg,png,webp}", {
      eager: true,
      query: "?url",
      import: "default",
    }) as Record<string, string>),
    ...(import.meta.glob("../../../../assets/free/textures/**/*.{jpg,jpeg,png,webp}", {
      eager: true,
      query: "?url",
      import: "default",
    }) as Record<string, string>),
    ...(import.meta.glob("../../../../assets/tesaiot/textures/**/*.{jpg,jpeg,png,webp}", {
      eager: true,
      query: "?url",
      import: "default",
    }) as Record<string, string>),
  };

  const out: StudioAssetDescriptor[] = [];
  const seen = new Set<string>();

  for (const filePath of Object.keys(modules)) {
    const rel = textureGlobPathToAssetRelative(filePath);
    if (rel == null || shouldSkipTextureAsCubemapFace(rel)) {
      continue;
    }
    const key = rel.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const fileLabel = rel.split("/").pop() ?? rel;
    const id = `texture-scan:${encodeURIComponent(rel)}`;
    out.push({
      id,
      category: "texture",
      source: "pack",
      label: fileLabel,
      summary: rel,
      relativePath: rel,
    });
  }

  return out.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Detect cubemap sets from each folder that contains a posx.jpg face and emit environment descriptors.
 */
export function scanStudioCubemapEnvironmentDescriptors(): StudioAssetDescriptor[] {
  const posxModules = {
    ...(import.meta.glob("../../../../assets/textures/cubemap/**/posx.jpg", {
      eager: true,
      query: "?url",
      import: "default",
    }) as Record<string, string>),
    ...(import.meta.glob("../../../../assets/free/textures/cubemap/**/posx.jpg", {
      eager: true,
      query: "?url",
      import: "default",
    }) as Record<string, string>),
    ...(import.meta.glob("../../../../assets/tesaiot/textures/cubemap/**/posx.jpg", {
      eager: true,
      query: "?url",
      import: "default",
    }) as Record<string, string>),
  };

  const out: StudioAssetDescriptor[] = [];
  const seen = new Set<string>();

  for (const filePath of Object.keys(posxModules)) {
    const rel = textureGlobPathToAssetRelative(filePath);
    if (rel == null) {
      continue;
    }
    const posix = rel.replace(/\\/g, "/");
    const segments = posix.split("/").filter(Boolean);
    const posxIdx = segments.findIndex((s) => s.toLowerCase() === "posx.jpg");
    if (posxIdx < 1) {
      continue;
    }
    const basePath = segments.slice(0, posxIdx).join("/");
    const setFolderName = segments[posxIdx - 1] ?? "cubemap";
    const key = basePath.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const isDefaultTexturesCubemap = /^textures\/cubemap\/[^/]+$/i.test(basePath);

    out.push({
      id: `env.scan:${encodeURIComponent(basePath)}`,
      category: "environment",
      source: "pack",
      label: `Cubemap — ${setFolderName}`,
      summary: basePath,
      ...(isDefaultTexturesCubemap
        ? { cubemapSetId: setFolderName }
        : { cubemapFaceBasePath: basePath }),
    });
  }

  return out.sort((a, b) => a.label.localeCompare(b.label));
}
