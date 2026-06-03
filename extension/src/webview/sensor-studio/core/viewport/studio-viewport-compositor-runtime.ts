import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import type { Scene3DConfigV1 } from "../scene3d/scene3d-config";
import { parseHexToThreeColor } from "../scene3d/scene3d-config";

export type PreviewContactShadowRuntimeState = {
  mesh: THREE.Mesh | null;
  texture: THREE.CanvasTexture | null;
  layoutKey: string;
};

export type PreviewBloomRuntimeState = {
  composer: EffectComposer | null;
  bloomPass: UnrealBloomPass | null;
  layoutKey: string;
};

export function createPreviewContactShadowRuntimeState(): PreviewContactShadowRuntimeState {
  return { mesh: null, texture: null, layoutKey: "" };
}

export function createPreviewBloomRuntimeState(): PreviewBloomRuntimeState {
  return { composer: null, bloomPass: null, layoutKey: "" };
}

function contactShadowLayoutKey(cfg: Scene3DConfigV1["contactShadows"], groundY: number): string {
  if (cfg == null || !cfg.enabled) {
    return "off";
  }
  return `${cfg.opacity}|${cfg.blur}|${cfg.scale}|${cfg.colorHex}|${groundY}`;
}

function createRadialShadowTexture(blur: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx != null) {
    const inner = Math.max(0, Math.min(size / 2 - 1, size / 2 - blur * 4));
    const gradient = ctx.createRadialGradient(size / 2, size / 2, inner, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function disposeContactShadowState(state: PreviewContactShadowRuntimeState, scene: THREE.Scene): void {
  if (state.mesh != null) {
    scene.remove(state.mesh);
    state.mesh.geometry.dispose();
    (state.mesh.material as THREE.Material).dispose();
    state.mesh = null;
  }
  if (state.texture != null) {
    state.texture.dispose();
    state.texture = null;
  }
  state.layoutKey = "";
}

/** Soft ground disc approximating node-animator contact shadows. */
export function syncPreviewContactShadows(
  scene: THREE.Scene,
  state: PreviewContactShadowRuntimeState,
  cfg: Scene3DConfigV1["contactShadows"],
  groundY: number,
): void {
  const key = contactShadowLayoutKey(cfg, groundY);
  if (key === "off") {
    if (state.mesh != null) {
      disposeContactShadowState(state, scene);
    }
    return;
  }
  const shadow = cfg!;
  if (state.mesh != null && state.layoutKey === key) {
    return;
  }
  disposeContactShadowState(state, scene);
  state.texture = createRadialShadowTexture(shadow.blur);
  const color = parseHexToThreeColor(shadow.colorHex);
  const material = new THREE.MeshBasicMaterial({
    color,
    map: state.texture,
    transparent: true,
    opacity: shadow.opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = groundY + 0.01;
  mesh.scale.set(shadow.scale, shadow.scale, 1);
  mesh.renderOrder = -1;
  scene.add(mesh);
  state.mesh = mesh;
  state.layoutKey = key;
}

function bloomLayoutKey(
  cfg: Scene3DConfigV1["postProcessing"],
  width: number,
  height: number,
): string {
  if (cfg == null || !cfg.enabled || !cfg.enableBloom) {
    return "off";
  }
  return `${cfg.bloomIntensity}|${cfg.bloomThreshold}|${width}|${height}`;
}

function disposeBloomState(state: PreviewBloomRuntimeState): void {
  state.composer?.dispose();
  state.composer = null;
  state.bloomPass = null;
  state.layoutKey = "";
}

export function syncPreviewBloomComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  state: PreviewBloomRuntimeState,
  cfg: Scene3DConfigV1["postProcessing"],
  width: number,
  height: number,
): boolean {
  const key = bloomLayoutKey(cfg, width, height);
  if (key === "off") {
    if (state.composer != null) {
      disposeBloomState(state);
    }
    return false;
  }
  const post = cfg!;
  if (state.composer != null && state.layoutKey === key && state.bloomPass != null) {
    state.bloomPass.strength = post.bloomIntensity;
    state.bloomPass.threshold = post.bloomThreshold;
    return true;
  }
  disposeBloomState(state);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), post.bloomIntensity, 0.4, post.bloomThreshold);
  composer.addPass(bloomPass);
  composer.setSize(width, height);
  state.composer = composer;
  state.bloomPass = bloomPass;
  state.layoutKey = key;
  return true;
}

export function renderPreviewFrame(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  bloomState: PreviewBloomRuntimeState,
  cfg: Scene3DConfigV1["postProcessing"],
  width: number,
  height: number,
): void {
  const useBloom = syncPreviewBloomComposer(renderer, scene, camera, bloomState, cfg, width, height);
  if (useBloom && bloomState.composer != null) {
    bloomState.composer.render();
    return;
  }
  renderer.render(scene, camera);
}

export function disposePreviewCompositorRuntime(
  scene: THREE.Scene,
  contactState: PreviewContactShadowRuntimeState,
  bloomState: PreviewBloomRuntimeState,
): void {
  disposeContactShadowState(contactState, scene);
  disposeBloomState(bloomState);
}
