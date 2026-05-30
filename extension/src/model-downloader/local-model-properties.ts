import * as fs from "node:fs";

export interface LocalModelFileProperties {
  cameraCount: number;
  lightCount: number;
  clipCount: number;
}

interface GlTfLike {
  cameras?: unknown[];
  animations?: unknown[];
  nodes?: Array<{ light?: unknown }>;
  extensions?: {
    KHR_lights_punctual?: {
      lights?: unknown[];
    };
  };
}

function parseGlbJsonChunk(buffer: Buffer): GlTfLike {
  if (buffer.length < 20) {
    throw new Error("Invalid GLB: file too small");
  }
  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const declaredLength = buffer.readUInt32LE(8);
  if (magic !== 0x46546c67 || version !== 2) {
    throw new Error("Invalid GLB header");
  }
  const totalLength = Math.min(declaredLength, buffer.length);
  let offset = 12;
  while (offset + 8 <= totalLength) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    offset += 8;
    if (offset + chunkLength > buffer.length) {
      throw new Error("Invalid GLB chunk length");
    }
    if (chunkType === 0x4e4f534a) {
      const jsonChunk = buffer.slice(offset, offset + chunkLength);
      const jsonText = jsonChunk.toString("utf8").replace(/\u0000+$/g, "");
      return JSON.parse(jsonText) as GlTfLike;
    }
    offset += chunkLength;
  }
  throw new Error("GLB JSON chunk not found");
}

function parseGltfJson(buffer: Buffer): GlTfLike {
  const text = buffer.toString("utf8");
  return JSON.parse(text) as GlTfLike;
}

function countLights(doc: GlTfLike): number {
  const extensionLights = doc.extensions?.KHR_lights_punctual?.lights;
  if (Array.isArray(extensionLights)) {
    return extensionLights.length;
  }
  if (!Array.isArray(doc.nodes)) {
    return 0;
  }
  return doc.nodes.reduce((count, node) => {
    if (node && typeof node === "object" && typeof node.light === "number") {
      return count + 1;
    }
    return count;
  }, 0);
}

export function readLocalModelFileProperties(
  absoluteModelPath: string
): LocalModelFileProperties {
  const lower = absoluteModelPath.toLowerCase();
  if (!lower.endsWith(".glb") && !lower.endsWith(".gltf")) {
    throw new Error("Only .glb and .gltf files are supported");
  }
  const raw = fs.readFileSync(absoluteModelPath);
  const doc = lower.endsWith(".glb") ? parseGlbJsonChunk(raw) : parseGltfJson(raw);
  return {
    cameraCount: Array.isArray(doc.cameras) ? doc.cameras.length : 0,
    lightCount: countLights(doc),
    clipCount: Array.isArray(doc.animations) ? doc.animations.length : 0,
  };
}
