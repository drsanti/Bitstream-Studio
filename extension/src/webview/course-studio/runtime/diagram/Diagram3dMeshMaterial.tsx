import type { Diagram3dMaterialV1 } from "../../schemas/diagram.v1";
import {
  DEFAULT_DIAGRAM_3D_MESH_MATERIAL,
  diagram3dMaterialNeedsTransparency,
  mergeDiagram3dMaterial,
  type ResolvedDiagram3dMaterial,
} from "./diagram3dMaterial";
import {
  diagram3dMaterialHasAnyTextureUrl,
} from "./diagram3dTextureMaps";
import type { Diagram3dThreeTextureMaps } from "./useDiagram3dMaterialTextureMaps";
import { useDiagram3dMaterialTextureMaps } from "./useDiagram3dMaterialTextureMaps";

function textureProps(maps: Diagram3dThreeTextureMaps | undefined) {
  if (maps == null) {
    return {};
  }
  return {
    map: maps.map,
    normalMap: maps.normalMap,
    roughnessMap: maps.roughnessMap,
    metalnessMap: maps.metalnessMap,
    emissiveMap: maps.emissiveMap,
    aoMap: maps.aoMap,
  };
}

function Diagram3dMeshMaterialCore({
  defaults = DEFAULT_DIAGRAM_3D_MESH_MATERIAL,
  material,
  opacity = 1,
  emissiveBoost = 0,
  textureMaps,
}: {
  defaults?: ResolvedDiagram3dMaterial;
  material?: Diagram3dMaterialV1;
  opacity?: number;
  emissiveBoost?: number;
  textureMaps?: Diagram3dThreeTextureMaps;
}) {
  const resolved = mergeDiagram3dMaterial(defaults, material);
  const transparent = diagram3dMaterialNeedsTransparency(resolved, opacity);
  const emissiveIntensity = resolved.emissiveIntensity + emissiveBoost;
  const maps = textureProps(textureMaps);
  const common = {
    color: resolved.color,
    transparent,
    opacity,
    wireframe: resolved.wireframe,
    ...maps,
  };

  switch (resolved.kind) {
    case "physical":
      return (
        <meshPhysicalMaterial
          {...common}
          emissive={resolved.emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={resolved.metalness}
          roughness={resolved.roughness}
          clearcoat={resolved.clearcoat}
          clearcoatRoughness={resolved.clearcoatRoughness}
          transmission={resolved.transmission}
          ior={resolved.ior}
          thickness={resolved.thickness}
        />
      );
    case "basic":
      return <meshBasicMaterial {...common} />;
    case "lambert":
      return (
        <meshLambertMaterial
          {...common}
          emissive={resolved.emissive}
          emissiveIntensity={emissiveIntensity}
        />
      );
    case "phong":
      return (
        <meshPhongMaterial
          {...common}
          emissive={resolved.emissive}
          emissiveIntensity={emissiveIntensity}
          shininess={Math.round((1 - resolved.roughness) * 100)}
        />
      );
    case "toon":
      return <meshToonMaterial {...common} />;
    case "standard":
    default:
      return (
        <meshStandardMaterial
          {...common}
          emissive={resolved.emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={resolved.metalness}
          roughness={resolved.roughness}
        />
      );
  }
}

function Diagram3dMeshMaterialWithTextures({
  defaults,
  material,
  opacity,
  emissiveBoost,
}: {
  defaults?: ResolvedDiagram3dMaterial;
  material?: Diagram3dMaterialV1;
  opacity?: number;
  emissiveBoost?: number;
}) {
  const textureMaps = useDiagram3dMaterialTextureMaps(material);
  return (
    <Diagram3dMeshMaterialCore
      defaults={defaults}
      material={material}
      opacity={opacity}
      emissiveBoost={emissiveBoost}
      textureMaps={textureMaps}
    />
  );
}

export function Diagram3dMeshMaterial({
  defaults = DEFAULT_DIAGRAM_3D_MESH_MATERIAL,
  material,
  opacity = 1,
  emissiveBoost = 0,
}: {
  defaults?: ResolvedDiagram3dMaterial;
  material?: Diagram3dMaterialV1;
  opacity?: number;
  emissiveBoost?: number;
}) {
  if (!diagram3dMaterialHasAnyTextureUrl(material)) {
    return (
      <Diagram3dMeshMaterialCore
        defaults={defaults}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    );
  }

  return (
    <Diagram3dMeshMaterialWithTextures
      defaults={defaults}
      material={material}
      opacity={opacity}
      emissiveBoost={emissiveBoost}
    />
  );
}