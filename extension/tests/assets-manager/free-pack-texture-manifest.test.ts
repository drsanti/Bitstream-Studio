import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { parseAssetManifestPayload } from "../../src/webview/assets-manager/registry/asset-manifest";

const registryDir = dirname(
  fileURLToPath(new URL("../../src/webview/assets-manager/registry/studio-asset-manifest.v1.json", import.meta.url)),
);

describe("free-pack texture manifest rows", () => {
  test("bundled studio manifest includes cubemap, HDRI, and image library entries", () => {
    const raw = JSON.parse(
      readFileSync(join(registryDir, "studio-asset-manifest.v1.json"), "utf8"),
    );
    const assets = parseAssetManifestPayload(raw);
    const envs = assets.filter((a) => a.category === "environment");
    const hdri = assets.filter((a) => a.id.startsWith("texture.hdri."));
    const images = assets.filter((a) => a.id.startsWith("texture.image."));

    expect(envs.length).toBeGreaterThanOrEqual(10);
    expect(envs.some((e) => e.cubemapSetId === "Yokohama")).toBe(true);
    expect(envs.some((e) => e.cubemapSetId === "bridge")).toBe(true);

    expect(hdri.length).toBe(10);
    expect(hdri.some((t) => t.relativePath === "textures/hdri/studio.hdr")).toBe(true);

    expect(images.length).toBe(6);
    expect(images.some((t) => t.relativePath?.includes("textures/images/wood/"))).toBe(true);
  });

  test("cubemap id list matches upstream folder count", () => {
    const ids = JSON.parse(
      readFileSync(join(registryDir, "free-pack-cubemap-ids.v1.json"), "utf8"),
    ) as string[];
    expect(ids).toHaveLength(10);
    expect(ids).toContain("Yokohama3");
  });
});
