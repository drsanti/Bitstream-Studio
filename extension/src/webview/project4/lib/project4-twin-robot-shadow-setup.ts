import * as THREE from "three";

/**
 * When **`Ground`** is **`MeshBasicMaterial`**, received directional shadows do not show clearly.
 * Upgrade Basic → **`MeshStandardMaterial`** (same color / map / opacity) only under the **`Ground`** hierarchy.
 */
function upgradeBasicMaterialsOnGroundMeshes(mesh: THREE.Mesh): void {
  const upgradeOne = (m: THREE.Material): THREE.Material => {
    if (m instanceof THREE.MeshBasicMaterial) {
      const std = new THREE.MeshStandardMaterial({
        color: m.color.clone(),
        map: m.map,
        aoMap: m.aoMap,
        transparent: m.transparent,
        opacity: m.opacity,
        side: m.side,
        roughness: 0.9,
        metalness: 0.03,
      });
      m.dispose();
      return std;
    }
    return m;
  };

  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map(upgradeOne);
  } else {
    mesh.material = upgradeOne(mesh.material);
  }
}

/**
 * After **`useGLTF`** attaches `scene`, enable **`castShadow`** / **`receiveShadow`** on every **`Mesh`**
 * (including **`SkinnedMesh`** / **`InstancedMesh`**).
 * Meshes under imported node **`Ground`** get Basic→Standard upgrade so the floor can display shadows.
 */
export function applyProject4TwinRobotShadowSetup(sceneRoot: THREE.Object3D): void {
  const groundSubtreeMeshes = new Set<THREE.Mesh>();
  const groundRoot = sceneRoot.getObjectByName("Ground");
  if (groundRoot != null) {
    groundRoot.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        groundSubtreeMeshes.add(o);
      }
    });
  }

  sceneRoot.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (groundSubtreeMeshes.has(obj)) {
      upgradeBasicMaterialsOnGroundMeshes(obj);
    }
  });
}
