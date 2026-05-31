import * as THREE from 'three';
import type { PreviewModelDisplayMode } from './persisted-settings.js';

const MODEL_WIREFRAME_LINE_COLOR = 0x64748b;
const MODEL_WIREFRAME_ONLY_COLOR = 0x94a3b8;
const MODEL_WIREFRAME_OVERLAY_OPACITY = 0.45;

type MaterialRestore = {
  mesh: THREE.Mesh;
  materials: THREE.Material | THREE.Material[];
};

type LineOverlay = {
  parent: THREE.Object3D;
  line: THREE.LineSegments;
};

function meshMaterials(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function setMeshMaterials(
  mesh: THREE.Mesh,
  materials: THREE.Material[],
): void {
  mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
}

/**
 * Whole-model display modes for Model Preview (shaded / triangle wireframe / both).
 */
export class ModelPreviewModelDisplay {
  private root: THREE.Object3D | null = null;
  private mode: PreviewModelDisplayMode = 'shaded';
  private materialRestores: MaterialRestore[] = [];
  private lineOverlays: LineOverlay[] = [];

  setRoot(root: THREE.Object3D | null): void {
    this.clearVisuals();
    this.root = root;
    this.applyMode();
  }

  setMode(mode: PreviewModelDisplayMode): void {
    if (mode === this.mode) {
      return;
    }
    this.clearVisuals();
    this.mode = mode;
    this.applyMode();
  }

  getMode(): PreviewModelDisplayMode {
    return this.mode;
  }

  dispose(): void {
    this.clearVisuals();
    this.root = null;
  }

  private applyMode(): void {
    if (this.root == null || this.mode === 'shaded') {
      return;
    }

    if (this.mode === 'wireframe') {
      this.applyWireframeOnly(this.root);
      return;
    }

    if (this.mode === 'shaded-wireframe') {
      this.applyShadedWireframeOverlay(this.root);
    }
  }

  private applyWireframeOnly(root: THREE.Object3D): void {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object.geometry == null) {
        return;
      }

      const sourceMaterials = meshMaterials(object);
      const wireMaterials = sourceMaterials.map((material) => {
        const wire = new THREE.MeshBasicMaterial({
          color: MODEL_WIREFRAME_ONLY_COLOR,
          wireframe: true,
          transparent: material.transparent,
          opacity: material.opacity,
          depthWrite: material.depthWrite,
        });
        wire.side = material.side;
        return wire;
      });

      this.materialRestores.push({
        mesh: object,
        materials: object.material,
      });
      setMeshMaterials(object, wireMaterials);
    });
  }

  private applyShadedWireframeOverlay(root: THREE.Object3D): void {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object.geometry == null) {
        return;
      }

      if (object instanceof THREE.SkinnedMesh) {
        return;
      }

      let wireframeGeometry: THREE.WireframeGeometry;
      try {
        wireframeGeometry = new THREE.WireframeGeometry(object.geometry);
      } catch {
        return;
      }

      const lineMaterial = new THREE.LineBasicMaterial({
        color: MODEL_WIREFRAME_LINE_COLOR,
        transparent: true,
        opacity: MODEL_WIREFRAME_OVERLAY_OPACITY,
        depthTest: true,
      });
      const overlay = new THREE.LineSegments(wireframeGeometry, lineMaterial);
      object.add(overlay);
      this.lineOverlays.push({ parent: object, line: overlay });
    });
  }

  private clearVisuals(): void {
    for (const entry of this.materialRestores) {
      const active = meshMaterials(entry.mesh);
      const original = Array.isArray(entry.materials)
        ? entry.materials
        : [entry.materials];
      for (let i = 0; i < active.length; i++) {
        if (active[i] !== original[i]) {
          active[i].dispose();
        }
      }
      entry.mesh.material = entry.materials;
    }
    this.materialRestores = [];

    for (const entry of this.lineOverlays) {
      entry.parent.remove(entry.line);
      entry.line.geometry.dispose();
      (entry.line.material as THREE.Material).dispose();
    }
    this.lineOverlays = [];
  }
}

export const PREVIEW_MODEL_DISPLAY_LABELS: Record<PreviewModelDisplayMode, string> =
  {
    shaded: 'Shaded',
    wireframe: 'Wireframe',
    'shaded-wireframe': 'Shaded + wireframe',
  };
