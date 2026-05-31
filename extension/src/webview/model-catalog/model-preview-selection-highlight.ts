import * as THREE from 'three';
import type { PreviewSelectionHighlightMode } from './persisted-settings.js';

const HIGHLIGHT_COLOR = 0x22d3ee;
const EMISSIVE_INTENSITY = 0.35;
const OUTLINE_SCALE = 1.04;

type EmissiveRestore = {
  mesh: THREE.Mesh;
  materials: THREE.Material | THREE.Material[];
};

function isHighlightMaterial(
  material: THREE.Material,
): material is THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  return (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhysicalMaterial
  );
}

function resolveMesh(object: THREE.Object3D): THREE.Mesh | null {
  if (object instanceof THREE.Mesh && object.geometry != null) {
    return object;
  }
  let found: THREE.Mesh | null = null;
  object.traverse((child) => {
    if (found != null) {
      return;
    }
    if (child instanceof THREE.Mesh && child.geometry != null) {
      found = child;
    }
  });
  return found;
}

function createAxisAlignedBoxWireframe(color: number): THREE.LineSegments {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(geometry);
  geometry.dispose();
  const material = new THREE.LineBasicMaterial({ color });
  return new THREE.LineSegments(edges, material);
}

/**
 * Applies one visual selection style at a time for Model Preview mesh picks.
 */
export class ModelPreviewSelectionHighlight {
  private readonly scene: THREE.Scene;
  private mode: PreviewSelectionHighlightMode = 'emissive';
  private target: THREE.Object3D | null = null;
  private emissiveRestore: EmissiveRestore | null = null;
  private edgeHelper: THREE.LineSegments | null = null;
  private edgeParent: THREE.Object3D | null = null;
  private triangleWireframeHelper: THREE.LineSegments | null = null;
  private triangleWireframeParent: THREE.Object3D | null = null;
  private boxHelper: THREE.LineSegments | null = null;
  private boxTarget: THREE.Object3D | null = null;
  private outlineMesh: THREE.Mesh | null = null;
  private outlineParent: THREE.Object3D | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  getMode(): PreviewSelectionHighlightMode {
    return this.mode;
  }

  setMode(mode: PreviewSelectionHighlightMode): void {
    if (mode === this.mode) {
      return;
    }
    const previousTarget = this.target;
    this.clearVisuals();
    this.mode = mode;
    if (previousTarget != null && mode !== 'off') {
      this.apply(previousTarget);
    }
  }

  apply(object: THREE.Object3D): void {
    this.clearVisuals();
    this.target = object;
    if (this.mode === 'off') {
      return;
    }

    switch (this.mode) {
      case 'emissive':
        this.applyEmissive(object);
        break;
      case 'edges':
        this.applyEdges(object);
        break;
      case 'wireframe':
        this.applyTriangleWireframe(object);
        break;
      case 'box':
        this.applyBox(object);
        break;
      case 'outline':
        this.applyOutline(object);
        break;
      default:
        break;
    }
  }

  clear(): void {
    this.clearVisuals();
    this.target = null;
  }

  update(): void {
    if (this.mode === 'box' && this.boxHelper != null && this.boxTarget != null) {
      const bounds = new THREE.Box3().setFromObject(this.boxTarget);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      this.boxHelper.scale.copy(size);
      this.boxHelper.position.copy(center);
    }
  }

  dispose(): void {
    this.clear();
  }

  private clearVisuals(): void {
    this.clearEmissive();
    this.clearEdges();
    this.clearTriangleWireframe();
    this.clearBox();
    this.clearOutline();
  }

  private applyEmissive(object: THREE.Object3D): void {
    const mesh = resolveMesh(object);
    if (mesh == null) {
      return;
    }

    const sourceMaterials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const nextMaterials = sourceMaterials.map((material) => {
      if (!isHighlightMaterial(material)) {
        return material;
      }
      const clone = material.clone();
      clone.emissive.setHex(HIGHLIGHT_COLOR);
      clone.emissiveIntensity = EMISSIVE_INTENSITY;
      return clone;
    });

    this.emissiveRestore = {
      mesh,
      materials: mesh.material,
    };
    mesh.material = Array.isArray(mesh.material)
      ? nextMaterials
      : nextMaterials[0];
  }

  private clearEmissive(): void {
    if (this.emissiveRestore == null) {
      return;
    }
    const { mesh, materials } = this.emissiveRestore;
    const active = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const original = Array.isArray(materials) ? materials : [materials];
    for (let i = 0; i < active.length; i++) {
      if (active[i] !== original[i]) {
        active[i].dispose();
      }
    }
    mesh.material = materials;
    this.emissiveRestore = null;
  }

  private applyEdges(object: THREE.Object3D): void {
    const mesh = resolveMesh(object);
    if (mesh == null || mesh.geometry == null) {
      return;
    }

    const edgesGeometry = new THREE.EdgesGeometry(mesh.geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: HIGHLIGHT_COLOR,
      depthTest: true,
    });
    const helper = new THREE.LineSegments(edgesGeometry, lineMaterial);
    mesh.add(helper);
    this.edgeHelper = helper;
    this.edgeParent = mesh;
  }

  private clearEdges(): void {
    if (this.edgeHelper == null || this.edgeParent == null) {
      return;
    }
    this.edgeParent.remove(this.edgeHelper);
    this.edgeHelper.geometry.dispose();
    (this.edgeHelper.material as THREE.Material).dispose();
    this.edgeHelper = null;
    this.edgeParent = null;
  }

  private applyTriangleWireframe(object: THREE.Object3D): void {
    const mesh = resolveMesh(object);
    if (mesh == null || mesh.geometry == null) {
      return;
    }

    let wireframeGeometry: THREE.WireframeGeometry;
    try {
      wireframeGeometry = new THREE.WireframeGeometry(mesh.geometry);
    } catch {
      return;
    }

    const lineMaterial = new THREE.LineBasicMaterial({
      color: HIGHLIGHT_COLOR,
      depthTest: true,
    });
    const helper = new THREE.LineSegments(wireframeGeometry, lineMaterial);
    mesh.add(helper);
    this.triangleWireframeHelper = helper;
    this.triangleWireframeParent = mesh;
  }

  private clearTriangleWireframe(): void {
    if (
      this.triangleWireframeHelper == null ||
      this.triangleWireframeParent == null
    ) {
      return;
    }
    this.triangleWireframeParent.remove(this.triangleWireframeHelper);
    this.triangleWireframeHelper.geometry.dispose();
    (this.triangleWireframeHelper.material as THREE.Material).dispose();
    this.triangleWireframeHelper = null;
    this.triangleWireframeParent = null;
  }

  private applyBox(object: THREE.Object3D): void {
    const helper = createAxisAlignedBoxWireframe(HIGHLIGHT_COLOR);
    this.scene.add(helper);
    this.boxHelper = helper;
    this.boxTarget = object;
    this.update();
  }

  private clearBox(): void {
    if (this.boxHelper == null) {
      return;
    }
    this.scene.remove(this.boxHelper);
    this.boxHelper.geometry.dispose();
    (this.boxHelper.material as THREE.Material).dispose();
    this.boxHelper = null;
    this.boxTarget = null;
  }

  private applyOutline(object: THREE.Object3D): void {
    const mesh = resolveMesh(object);
    if (mesh == null || mesh.geometry == null) {
      this.applyBox(object);
      return;
    }

    if (mesh instanceof THREE.SkinnedMesh) {
      this.applyBox(object);
      return;
    }

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: HIGHLIGHT_COLOR,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const outline = new THREE.Mesh(mesh.geometry, outlineMaterial);
    outline.scale.set(OUTLINE_SCALE, OUTLINE_SCALE, OUTLINE_SCALE);
    outline.renderOrder = mesh.renderOrder - 1;
    mesh.add(outline);
    this.outlineMesh = outline;
    this.outlineParent = mesh;
  }

  private clearOutline(): void {
    if (this.outlineMesh == null || this.outlineParent == null) {
      return;
    }
    this.outlineParent.remove(this.outlineMesh);
    (this.outlineMesh.material as THREE.Material).dispose();
    this.outlineMesh = null;
    this.outlineParent = null;
  }
}

export const PREVIEW_SELECTION_HIGHLIGHT_LABELS: Record<
  PreviewSelectionHighlightMode,
  string
> = {
  off: 'Off',
  emissive: 'Glow',
  edges: 'Edges',
  wireframe: 'Wireframe',
  box: 'Box',
  outline: 'Outline',
};
