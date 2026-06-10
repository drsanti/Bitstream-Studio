import { useEffect, useLayoutEffect } from "react";
import * as THREE from "three";
import type { Diagram3dMaterialV1 } from "../../schemas/diagram.v1";
import {
  DEFAULT_DIAGRAM_3D_MESH_MATERIAL,
  diagram3dMaterialNeedsTransparency,
  mergeDiagram3dMaterial,
  resolveDiagram3dMaterialKind,
  type ResolvedDiagram3dMaterial,
} from "./diagram3dMaterial";
import {
  disposeDiagram3dTexture,
  loadDiagram3dTexture,
} from "./diagram3dTextureLoader";
import {
  DIAGRAM_3D_TEXTURE_MAP_SLOTS,
  diagram3dMaterialHasAnyTextureUrl,
  resolveDiagram3dMaterialTextureMaps,
  type Diagram3dTextureMapSlot,
} from "./diagram3dTextureMaps";

type TintableMaterial =
  | THREE.MeshStandardMaterial
  | THREE.MeshPhysicalMaterial
  | THREE.MeshLambertMaterial
  | THREE.MeshPhongMaterial
  | THREE.MeshBasicMaterial;

function isTintableMaterial(material: THREE.Material): material is TintableMaterial {
  return (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhysicalMaterial ||
    material instanceof THREE.MeshLambertMaterial ||
    material instanceof THREE.MeshPhongMaterial ||
    material instanceof THREE.MeshBasicMaterial
  );
}

function clearDiagram3dMaterialTextureMaps(material: THREE.Material): void {
  for (const slot of DIAGRAM_3D_TEXTURE_MAP_SLOTS) {
    material[slot] = null;
  }
  material.needsUpdate = true;
}

function applyResolvedOpacity(
  mat: THREE.Material,
  resolved: ResolvedDiagram3dMaterial,
  opacity: number,
): void {
  mat.transparent = diagram3dMaterialNeedsTransparency(resolved, opacity);
  mat.opacity = opacity;
  mat.wireframe = resolved.wireframe;
}

function applyResolvedToStandardMaterial(
  mat: THREE.MeshStandardMaterial,
  material: Diagram3dMaterialV1,
  resolved: ResolvedDiagram3dMaterial,
  opacity: number,
): void {
  if (material.color != null) {
    mat.color.set(resolved.color);
  }
  if (material.emissive != null) {
    mat.emissive.set(resolved.emissive);
  }
  if (material.emissiveIntensity != null) {
    mat.emissiveIntensity = resolved.emissiveIntensity;
  }
  if (material.metalness != null) {
    mat.metalness = resolved.metalness;
  }
  if (material.roughness != null) {
    mat.roughness = resolved.roughness;
  }
  applyResolvedOpacity(mat, resolved, opacity);
  mat.needsUpdate = true;
}

function applyResolvedToPhysicalMaterial(
  mat: THREE.MeshPhysicalMaterial,
  material: Diagram3dMaterialV1,
  resolved: ResolvedDiagram3dMaterial,
  opacity: number,
): void {
  applyResolvedToStandardMaterial(mat, material, resolved, opacity);
  if (material.clearcoat != null) {
    mat.clearcoat = resolved.clearcoat;
  }
  if (material.clearcoatRoughness != null) {
    mat.clearcoatRoughness = resolved.clearcoatRoughness;
  }
  if (material.transmission != null) {
    mat.transmission = resolved.transmission;
  }
  if (material.ior != null) {
    mat.ior = resolved.ior;
  }
  if (material.thickness != null) {
    mat.thickness = resolved.thickness;
  }
  mat.needsUpdate = true;
}

function applyResolvedToBasicMaterial(
  mat: THREE.MeshBasicMaterial,
  material: Diagram3dMaterialV1,
  resolved: ResolvedDiagram3dMaterial,
  opacity: number,
): void {
  if (material.color != null) {
    mat.color.set(resolved.color);
  }
  applyResolvedOpacity(mat, resolved, opacity);
  mat.needsUpdate = true;
}

function applyResolvedToLambertMaterial(
  mat: THREE.MeshLambertMaterial,
  material: Diagram3dMaterialV1,
  resolved: ResolvedDiagram3dMaterial,
  opacity: number,
): void {
  if (material.color != null) {
    mat.color.set(resolved.color);
  }
  if (material.emissive != null) {
    mat.emissive.set(resolved.emissive);
  }
  if (material.emissiveIntensity != null) {
    mat.emissiveIntensity = resolved.emissiveIntensity;
  }
  applyResolvedOpacity(mat, resolved, opacity);
  mat.needsUpdate = true;
}

function applyResolvedToPhongMaterial(
  mat: THREE.MeshPhongMaterial,
  material: Diagram3dMaterialV1,
  resolved: ResolvedDiagram3dMaterial,
  opacity: number,
): void {
  applyResolvedToLambertMaterial(mat, material, resolved, opacity);
  if (material.roughness != null) {
    mat.shininess = Math.round((1 - resolved.roughness) * 100);
  }
  mat.needsUpdate = true;
}

function cloneCatalogMaterial(
  entry: THREE.Material,
  kind: ReturnType<typeof resolveDiagram3dMaterialKind>,
): THREE.Material {
  if (kind === "physical" && entry instanceof THREE.MeshStandardMaterial) {
    const physical = new THREE.MeshPhysicalMaterial();
    physical.copy(entry);
    return physical;
  }
  return entry.clone();
}

function meshMatchesMaterialTarget(mesh: THREE.Mesh, material: Diagram3dMaterialV1): boolean {
  const target = material.materialTarget ?? "all";
  if (target === "all") {
    return true;
  }
  const name = material.materialName?.trim();
  if (!name) {
    return false;
  }
  const source = mesh.material;
  const materials = Array.isArray(source) ? source : [source];
  return materials.some((entry) => entry.name === name);
}

function applyTintToMaterial(
  cloned: THREE.Material,
  material: Diagram3dMaterialV1,
  resolved: ResolvedDiagram3dMaterial,
  opacity: number,
): void {
  if (cloned instanceof THREE.MeshPhysicalMaterial) {
    applyResolvedToPhysicalMaterial(cloned, material, resolved, opacity);
    return;
  }
  if (cloned instanceof THREE.MeshStandardMaterial) {
    applyResolvedToStandardMaterial(cloned, material, resolved, opacity);
    return;
  }
  if (cloned instanceof THREE.MeshLambertMaterial) {
    applyResolvedToLambertMaterial(cloned, material, resolved, opacity);
    return;
  }
  if (cloned instanceof THREE.MeshPhongMaterial) {
    applyResolvedToPhongMaterial(cloned, material, resolved, opacity);
    return;
  }
  if (cloned instanceof THREE.MeshBasicMaterial) {
    applyResolvedToBasicMaterial(cloned, material, resolved, opacity);
    return;
  }
  if (material.wireframe != null) {
    cloned.wireframe = resolved.wireframe;
    cloned.needsUpdate = true;
  }
}

export function useDiagram3dCatalogMaterialTint(
  root: THREE.Object3D | null,
  material: Diagram3dMaterialV1 | undefined,
  opacity: number,
): void {
  useLayoutEffect(() => {
    if (root == null || material == null) {
      return;
    }
    const kind = resolveDiagram3dMaterialKind(material);
    const resolved = mergeDiagram3dMaterial(DEFAULT_DIAGRAM_3D_MESH_MATERIAL, material);
    const clonedMaterials = new Map<THREE.Material, THREE.Material>();

    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }
      if (!meshMatchesMaterialTarget(child, material)) {
        return;
      }
      const source = child.material;
      const materials = Array.isArray(source) ? source : [source];
      const nextMaterials = materials.map((entry) => {
        let cloned = clonedMaterials.get(entry);
        if (cloned == null) {
          cloned = cloneCatalogMaterial(entry, kind);
          clonedMaterials.set(entry, cloned);
        }

        applyTintToMaterial(cloned, material, resolved, opacity);
        if (!diagram3dMaterialHasAnyTextureUrl(material)) {
          clearDiagram3dMaterialTextureMaps(cloned);
        }

        return cloned;
      });
      child.material = Array.isArray(source) ? nextMaterials : nextMaterials[0]!;
    });
  }, [material, opacity, root]);

  useEffect(() => {
    if (root == null || material == null || !diagram3dMaterialHasAnyTextureUrl(material)) {
      return;
    }

    const resolvedMaps = resolveDiagram3dMaterialTextureMaps(material);
    const activeSlots = DIAGRAM_3D_TEXTURE_MAP_SLOTS.filter((slot) => resolvedMaps[slot] != null);
    if (activeSlots.length === 0) {
      return;
    }

    let cancelled = false;
    const assigned: Array<{
      material: THREE.Material;
      slot: Diagram3dTextureMapSlot;
      texture: THREE.Texture;
    }> = [];

    void (async () => {
      const loaded = await Promise.all(
        activeSlots.map(async (slot) => ({
          slot,
          texture: await loadDiagram3dTexture(resolvedMaps[slot]!, slot, material.mapRepeat),
        })),
      );

      if (cancelled) {
        for (const entry of loaded) {
          disposeDiagram3dTexture(entry.texture);
        }
        return;
      }

      root.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) {
          return;
        }
        if (!meshMatchesMaterialTarget(child, material)) {
          return;
        }
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of materials) {
          if (!isTintableMaterial(mat)) {
            continue;
          }
          for (const entry of loaded) {
            mat[entry.slot] = entry.texture;
            assigned.push({ material: mat, slot: entry.slot, texture: entry.texture });
          }
          mat.needsUpdate = true;
        }
      });
    })();

    return () => {
      cancelled = true;
      for (const entry of assigned) {
        if (entry.material[entry.slot] === entry.texture) {
          entry.material[entry.slot] = null;
          entry.material.needsUpdate = true;
        }
        disposeDiagram3dTexture(entry.texture);
      }
    };
  }, [material, root]);
}
