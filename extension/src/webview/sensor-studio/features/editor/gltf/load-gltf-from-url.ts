import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  assertGlbByteLength,
  parseHttpContentLength,
} from "../../../../model-loader/ui/glb-local-mirror-integrity.js";

const GLB_MAGIC_LITTLE_ENDIAN = 0x46546c67;

/** One GLB parse at a time — overlapping parses revoke each other's blob texture URLs. */
let globalParseChain: Promise<void> = Promise.resolve();

function glbResourcePathFromUrl(url: string): string {
  const pathOnly = url.split("?")[0]?.split("#")[0] ?? url;
  const idx = pathOnly.lastIndexOf("/");
  return idx >= 0 ? pathOnly.slice(0, idx + 1) : "";
}

function assertGlbArrayBuffer(
  buffer: ArrayBuffer,
  url: string,
  contentLength: number | null,
): void {
  assertGlbByteLength(buffer.byteLength, contentLength, url);
  if (new DataView(buffer).getUint32(0, true) === GLB_MAGIC_LITTLE_ENDIAN) {
    return;
  }
  const head = new TextDecoder()
    .decode(buffer.slice(0, Math.min(128, buffer.byteLength)))
    .trimStart();
  if (head.startsWith("<") || head.toLowerCase().includes("<!doctype")) {
    throw new Error(
      "Server returned HTML instead of a GLB (wrong URL or missing file).",
    );
  }
  if (head.startsWith("{")) {
    throw new Error(
      "Server returned JSON instead of a GLB (wrong URL or missing file).",
    );
  }
  throw new Error(`Response is not a valid GLB.\n${url}`);
}

async function withGlobalParseLock<T>(run: () => Promise<T>): Promise<T> {
  const prior = globalParseChain;
  let release!: () => void;
  globalParseChain = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prior.catch(() => {});
  try {
    return await run();
  } finally {
    release();
  }
}

function parseGltfArrayBuffer(buffer: ArrayBuffer, resourceUrl: string): Promise<GLTF> {
  const isolated = buffer.slice(0);
  const loader = new GLTFLoader();
  return new Promise<GLTF>((resolve, reject) => {
    loader.parse(
      isolated,
      glbResourcePathFromUrl(resourceUrl),
      resolve,
      (err) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

async function fetchAndParseGltfFromUrlInner(url: string): Promise<GLTF> {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    throw new Error("Empty GLB URL.");
  }

  const res = await fetch(trimmed, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} loading GLB.`);
  }
  const ct = (res.headers.get("content-type") ?? "").toLowerCase();
  if (ct.includes("text/html")) {
    throw new Error(
      "Server returned HTML instead of a GLB (wrong URL or missing file).",
    );
  }

  const contentLength = parseHttpContentLength(res);
  const buffer = await res.arrayBuffer();
  assertGlbArrayBuffer(buffer, trimmed, contentLength);
  return await parseGltfArrayBuffer(buffer, trimmed);
}

/**
 * Fetch + parse GLB in isolation (no shared FileLoader cache / blob URL races with other loaders).
 */
export async function fetchAndParseGltfFromUrl(url: string): Promise<GLTF> {
  return withGlobalParseLock(() => fetchAndParseGltfFromUrlInner(url));
}
