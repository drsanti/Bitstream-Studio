import * as THREE from "three";
import type { AnimationLabTwinComponentDef } from "../digital-twin.types.js";

const GENERIC_CAMERA_NAMES = new Set([
  "camera",
  "perspectivecamera",
  "orthographiccamera",
]);

/** Spinning parts inflate the live AABB and make semantic tags bob up/down. */
const SPINNING_MESH_NAME = /prop|blade|rotor|fan|spinner/i;

export function meshExcludedFromStableTwinBounds(meshName: string): boolean {
  return SPINNING_MESH_NAME.test(meshName.trim());
}

function tokenizeAnchor(anchor: string): string[] {
  const base = anchor.replace(/Action$/i, "").trim();
  const parts = base
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  return parts.length > 0 ? parts : [base.toLowerCase()];
}

function nodeMatchesTokens(nodeName: string, tokens: readonly string[]): boolean {
  const n = nodeName.toLowerCase();
  return tokens.every((t) => n.includes(t));
}

function isNodeEligibleForTwinAnchor(node: THREE.Object3D, tokens: readonly string[]): boolean {
  const name = node.name.trim().toLowerCase();
  if (name.length === 0) {
    return false;
  }
  if (GENERIC_CAMERA_NAMES.has(name) && !(node instanceof THREE.Bone || node instanceof THREE.Mesh)) {
    return false;
  }
  if (tokens.includes("camera") && GENERIC_CAMERA_NAMES.has(name)) {
    return false;
  }
  return true;
}

function nodeAnchorScore(
  node: THREE.Object3D,
  worldPos: THREE.Vector3,
  center: THREE.Vector3,
  span: number,
): number {
  let score = worldPos.distanceTo(center);
  if (node instanceof THREE.Bone) {
    score -= span * 0.25;
  } else if (node instanceof THREE.SkinnedMesh) {
    score -= span * 0.2;
  } else if (node instanceof THREE.Mesh) {
    score -= span * 0.12;
  }
  score -= Math.min(node.name.length * 0.002, 0.15);
  return score;
}

function findBestMatchingNode(
  namedNodes: readonly THREE.Object3D[],
  tokens: readonly string[],
  center: THREE.Vector3,
  box: THREE.Box3,
  span: number,
): THREE.Object3D | null {
  const margin = span * 0.15;
  const expanded = box.clone().expandByScalar(margin);

  let best: THREE.Object3D | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const node of namedNodes) {
    if (!isNodeEligibleForTwinAnchor(node, tokens)) {
      continue;
    }
    if (!nodeMatchesTokens(node.name, tokens)) {
      continue;
    }
    const worldPos = new THREE.Vector3();
    node.getWorldPosition(worldPos);
    if (!expanded.containsPoint(worldPos)) {
      continue;
    }
    const score = nodeAnchorScore(node, worldPos, center, span);
    if (score < bestScore) {
      bestScore = score;
      best = node;
    }
  }

  if (best != null) {
    return best;
  }

  const primary = tokens[0];
  if (primary == null || primary === "camera") {
    return null;
  }

  for (const node of namedNodes) {
    if (!isNodeEligibleForTwinAnchor(node, tokens)) {
      continue;
    }
    if (!node.name.toLowerCase().includes(primary)) {
      continue;
    }
    const worldPos = new THREE.Vector3();
    node.getWorldPosition(worldPos);
    if (!expanded.containsPoint(worldPos)) {
      continue;
    }
    const score = nodeAnchorScore(node, worldPos, center, span);
    if (score < bestScore) {
      bestScore = score;
      best = node;
    }
  }

  return best;
}

/** Offset in model-root local space (stable fuselage frame, not live spinning AABB). */
function semanticLocalOffset(
  component: AnimationLabTwinComponentDef,
  index: number,
  count: number,
  size: THREE.Vector3,
): THREE.Vector3 {
  const anchor = (component.glbAnchor ?? component.id).toLowerCase();
  const group = (component.group ?? "").toLowerCase();

  if (anchor.includes("camera") || component.id === "camera") {
    return new THREE.Vector3(0, -size.y * 0.12, size.z * 0.42);
  }
  if (anchor.includes("gimbal") || group.includes("gimbal")) {
    const gimbalIndex = anchor.includes("2") ? 1 : 0;
    const side = gimbalIndex === 0 ? -1 : 1;
    return new THREE.Vector3(side * size.x * 0.12, size.y * 0.28, size.z * 0.08);
  }
  if (group.includes("sensor") || component.id.includes("imu")) {
    return new THREE.Vector3(0, size.y * 0.38, 0);
  }

  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  const r = Math.max(size.x, size.z) * 0.42;
  return new THREE.Vector3(Math.cos(angle) * r, size.y * 0.42, Math.sin(angle) * r);
}

/** Fuselage bounds — excludes propeller/blade meshes so the frame does not pump while spinning. */
export function computeStableMeshBounds(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  let hasMesh = false;
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    if (meshExcludedFromStableTwinBounds(obj.name)) {
      return;
    }
    box.expandByObject(obj);
    hasMesh = true;
  });
  if (!hasMesh) {
    return new THREE.Box3().setFromObject(root);
  }
  return box;
}

function prefersSemanticAnchor(component: AnimationLabTwinComponentDef, tokens: readonly string[]): boolean {
  const anchor = (component.glbAnchor ?? "").toLowerCase();
  if (/camera/i.test(anchor) && anchor.includes("action")) {
    return true;
  }
  if (tokens.length === 1 && tokens[0] === "camera") {
    return true;
  }
  return false;
}

type TwinAnchorNodeBinding = {
  kind: "node";
  componentId: string;
  node: THREE.Object3D;
  yLift: number;
  anchorOffset?: [number, number, number];
};

type TwinAnchorSemanticBinding = {
  kind: "semantic";
  componentId: string;
  centerLocal: THREE.Vector3;
  offsetLocal: THREE.Vector3;
  anchorOffset?: [number, number, number];
};

type TwinAnchorBinding = TwinAnchorNodeBinding | TwinAnchorSemanticBinding;

const _worldPos = new THREE.Vector3();
const _localPos = new THREE.Vector3();

function applyAnchorOffset(pos: THREE.Vector3, offset?: [number, number, number]): void {
  if (offset == null) {
    return;
  }
  pos.x += offset[0];
  pos.y += offset[1];
  pos.z += offset[2];
}

function resolveBindings(
  root: THREE.Object3D,
  components: readonly AnimationLabTwinComponentDef[],
): TwinAnchorBinding[] {
  const stableBox = computeStableMeshBounds(root);
  const stableCenter = stableBox.getCenter(new THREE.Vector3());
  const stableSize = stableBox.getSize(new THREE.Vector3());
  const span = Math.max(stableSize.x, stableSize.y, stableSize.z, 0.2);

  root.updateMatrixWorld(true);
  const centerLocal = root.worldToLocal(stableCenter.clone());

  const namedNodes: THREE.Object3D[] = [];
  root.traverse((obj) => {
    if (obj.name.trim().length > 0) {
      namedNodes.push(obj);
    }
  });

  const count = Math.max(components.length, 1);
  const bindings: TwinAnchorBinding[] = [];

  components.forEach((component, index) => {
    const searchKey = component.glbAnchor ?? component.id;
    const tokens = tokenizeAnchor(searchKey);
    const anchorOffset = component.anchorOffset;

    if (prefersSemanticAnchor(component, tokens)) {
      bindings.push({
        kind: "semantic",
        componentId: component.id,
        centerLocal: centerLocal.clone(),
        offsetLocal: semanticLocalOffset(component, index, count, stableSize),
        anchorOffset,
      });
      return;
    }

    const matched = findBestMatchingNode(
      namedNodes,
      tokens,
      stableCenter,
      stableBox,
      span,
    );

    if (matched != null) {
      bindings.push({
        kind: "node",
        componentId: component.id,
        node: matched,
        yLift: span * 0.06,
        anchorOffset,
      });
      return;
    }

    bindings.push({
      kind: "semantic",
      componentId: component.id,
      centerLocal: centerLocal.clone(),
      offsetLocal: semanticLocalOffset(component, index, count, stableSize),
      anchorOffset,
    });
  });

  return bindings;
}

function updateBindingPosition(root: THREE.Object3D, binding: TwinAnchorBinding): THREE.Vector3 {
  if (binding.kind === "node") {
    binding.node.getWorldPosition(_worldPos);
    _worldPos.y += binding.yLift;
    applyAnchorOffset(_worldPos, binding.anchorOffset);
    return _worldPos.clone();
  }

  _localPos.copy(binding.centerLocal).add(binding.offsetLocal);
  root.localToWorld(_localPos);
  applyAnchorOffset(_localPos, binding.anchorOffset);
  return _localPos.clone();
}

/** Cached bindings — node targets follow animation; semantic tags use a stable fuselage frame. */
export class TwinAnchorResolver {
  private readonly root: THREE.Object3D;
  private readonly bindings: TwinAnchorBinding[];

  constructor(root: THREE.Object3D, components: readonly AnimationLabTwinComponentDef[]) {
    this.root = root;
    this.bindings = resolveBindings(root, components);
  }

  updatePositions(): Record<string, THREE.Vector3> {
    this.root.updateMatrixWorld(true);
    const out: Record<string, THREE.Vector3> = {};
    for (const binding of this.bindings) {
      out[binding.componentId] = updateBindingPosition(this.root, binding);
    }
    return out;
  }
}

const resolverCache = new WeakMap<
  THREE.Object3D,
  { componentsKey: string; resolver: TwinAnchorResolver }
>();

export function twinComponentsCacheKey(components: readonly AnimationLabTwinComponentDef[]): string {
  return components.map((c) => c.id).join("\0");
}

export function getTwinAnchorResolver(
  root: THREE.Object3D,
  components: readonly AnimationLabTwinComponentDef[],
): TwinAnchorResolver {
  const componentsKey = twinComponentsCacheKey(components);
  const cached = resolverCache.get(root);
  if (cached != null && cached.componentsKey === componentsKey) {
    return cached.resolver;
  }
  const resolver = new TwinAnchorResolver(root, components);
  resolverCache.set(root, { componentsKey, resolver });
  return resolver;
}

/**
 * Resolves world positions for twin CSS3D tags (creates a fresh resolver each call).
 * Prefer {@link getTwinAnchorResolver} inside the render loop.
 */
export function computeTwinAnchorWorldPositions(
  root: THREE.Object3D,
  components: readonly AnimationLabTwinComponentDef[],
): Record<string, THREE.Vector3> {
  return getTwinAnchorResolver(root, components).updatePositions();
}
