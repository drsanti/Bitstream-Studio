import * as THREE from "three";
import type { Diagram3dTextureMapSlot } from "./diagram3dTextureMaps";

let textureLoader: THREE.TextureLoader | null = null;

function ensureTextureLoader(): THREE.TextureLoader {
  if (textureLoader == null) {
    textureLoader = new THREE.TextureLoader();
  }
  return textureLoader;
}

export function configureDiagram3dTextureForSlot(
  texture: THREE.Texture,
  slot: Diagram3dTextureMapSlot,
  repeat?: [number, number],
): void {
  texture.colorSpace =
    slot === "map" || slot === "emissiveMap" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (repeat != null) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  texture.needsUpdate = true;
}

export function loadDiagram3dTexture(
  url: string,
  slot: Diagram3dTextureMapSlot,
  repeat?: [number, number],
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    ensureTextureLoader().load(
      url,
      (texture) => {
        configureDiagram3dTextureForSlot(texture, slot, repeat);
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

export function disposeDiagram3dTexture(texture: THREE.Texture | null | undefined): void {
  texture?.dispose();
}
