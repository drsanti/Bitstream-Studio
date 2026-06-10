import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Diagram3dMaterialV1 } from "../../schemas/diagram.v1";
import { configureDiagram3dTextureForSlot } from "./diagram3dTextureLoader";
import {
  DIAGRAM_3D_TEXTURE_MAP_SLOTS,
  type Diagram3dTextureMapSlot,
  resolveDiagram3dMaterialTextureMaps,
} from "./diagram3dTextureMaps";

export type Diagram3dThreeTextureMaps = Partial<
  Record<Diagram3dTextureMapSlot, THREE.Texture>
>;

export function useDiagram3dMaterialTextureMaps(
  material?: Diagram3dMaterialV1,
): Diagram3dThreeTextureMaps {
  const resolved = resolveDiagram3dMaterialTextureMaps(material);
  const activeSlots = DIAGRAM_3D_TEXTURE_MAP_SLOTS.filter((slot) => resolved[slot] != null);
  const urls = activeSlots.map((slot) => resolved[slot]!);

  const loaded = useTexture(urls.length === 1 ? urls[0]! : urls);
  const textures = Array.isArray(loaded) ? loaded : [loaded];

  const maps: Diagram3dThreeTextureMaps = {};
  activeSlots.forEach((slot, index) => {
    const texture = textures[index];
    if (texture == null) {
      return;
    }
    configureDiagram3dTextureForSlot(texture, slot, material?.mapRepeat);
    maps[slot] = texture;
  });
  return maps;
}
