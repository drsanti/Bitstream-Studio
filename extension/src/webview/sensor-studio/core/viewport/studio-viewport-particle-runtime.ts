import * as THREE from "three";

import type { Scene3DConfigV1 } from "../scene3d/scene3d-config";
import { parseHexToThreeColor } from "../scene3d/scene3d-config";

const PARTICLE_COUNT = 2000;

export type PreviewParticleRuntimeState = {
  points: THREE.Points | null;
  positions: Float32Array;
  velocities: Float32Array;
  lives: Float32Array;
  lastTrigger: number;
  layoutKey: string;
};

export function createPreviewParticleRuntimeState(): PreviewParticleRuntimeState {
  return {
    points: null,
    positions: new Float32Array(PARTICLE_COUNT * 3),
    velocities: new Float32Array(PARTICLE_COUNT * 3),
    lives: new Float32Array(PARTICLE_COUNT),
    lastTrigger: 0,
    layoutKey: "",
  };
}

function particleLayoutKey(cfg: Scene3DConfigV1["particleEmitter"]): string {
  if (cfg == null || !cfg.enabled) {
    return "off";
  }
  return `${cfg.preset}|${cfg.colorHex}|${cfg.target}`;
}

function disposeParticleState(state: PreviewParticleRuntimeState, scene: THREE.Scene): void {
  if (state.points != null) {
    scene.remove(state.points);
    state.points.geometry.dispose();
    (state.points.material as THREE.Material).dispose();
    state.points = null;
  }
  state.layoutKey = "";
  state.lastTrigger = 0;
  state.lives.fill(0);
}

function applyParticleMaterialStyle(
  material: THREE.PointsMaterial,
  preset: string,
  colorHex: string,
): void {
  material.color.copy(parseHexToThreeColor(colorHex));
  material.size = preset === "sparks" ? 0.15 : 0.4;
  material.opacity = preset === "sparks" ? 0.9 : 0.4;
  material.blending = preset === "sparks" ? THREE.AdditiveBlending : THREE.NormalBlending;
  material.needsUpdate = true;
}

function ensureParticlePoints(
  scene: THREE.Scene,
  state: PreviewParticleRuntimeState,
  cfg: NonNullable<Scene3DConfigV1["particleEmitter"]>,
): THREE.Points {
  if (state.points != null && state.layoutKey === particleLayoutKey(cfg)) {
    applyParticleMaterialStyle(state.points.material as THREE.PointsMaterial, cfg.preset, cfg.colorHex);
    return state.points;
  }
  disposeParticleState(state, scene);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(state.positions, 3));
  const material = new THREE.PointsMaterial({
    color: parseHexToThreeColor(cfg.colorHex),
    size: cfg.preset === "sparks" ? 0.15 : 0.4,
    transparent: true,
    opacity: cfg.preset === "sparks" ? 0.9 : 0.4,
    blending: cfg.preset === "sparks" ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  state.points = points;
  state.layoutKey = particleLayoutKey(cfg);
  return points;
}

function findDeadParticleIndex(lives: Float32Array): number {
  for (let i = 0; i < lives.length; i++) {
    if (lives[i] <= 0) {
      return i;
    }
  }
  return -1;
}

function spawnBurstParticles(
  state: PreviewParticleRuntimeState,
  cfg: NonNullable<Scene3DConfigV1["particleEmitter"]>,
  origin: THREE.Vector3,
): void {
  const isSmoke = cfg.preset === "smoke";
  const isSteam = cfg.preset === "steam";
  for (let n = 0; n < 200; n++) {
    const idx = findDeadParticleIndex(state.lives);
    if (idx === -1) {
      break;
    }
    state.lives[idx] = cfg.life || 1;
    const speed = isSmoke ? 1 + Math.random() : isSteam ? 8 + Math.random() * 4 : 5 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    state.velocities[idx * 3] = speed * Math.sin(phi) * Math.cos(theta);
    state.velocities[idx * 3 + 1] = speed * Math.cos(phi);
    state.velocities[idx * 3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
    if (isSteam) {
      state.velocities[idx * 3 + 1] = Math.abs(state.velocities[idx * 3 + 1]!) + 5;
    }
    state.positions[idx * 3] = origin.x;
    state.positions[idx * 3 + 1] = origin.y;
    state.positions[idx * 3 + 2] = origin.z;
  }
}

function spawnRateParticles(
  state: PreviewParticleRuntimeState,
  cfg: NonNullable<Scene3DConfigV1["particleEmitter"]>,
  origin: THREE.Vector3,
  deltaSec: number,
): void {
  const isSmoke = cfg.preset === "smoke";
  const isSteam = cfg.preset === "steam";
  const toSpawn = Math.floor(cfg.rate * deltaSec * 50);
  for (let n = 0; n < toSpawn; n++) {
    const idx = findDeadParticleIndex(state.lives);
    if (idx === -1) {
      break;
    }
    state.lives[idx] = cfg.life || 1;
    if (isSmoke) {
      state.velocities[idx * 3] = (Math.random() - 0.5) * 1;
      state.velocities[idx * 3 + 1] = 1 + Math.random();
      state.velocities[idx * 3 + 2] = (Math.random() - 0.5) * 1;
    } else if (isSteam) {
      state.velocities[idx * 3] = (Math.random() - 0.5) * 0.5;
      state.velocities[idx * 3 + 1] = 6 + Math.random() * 4;
      state.velocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.5;
    } else {
      state.velocities[idx * 3] = (Math.random() - 0.5) * 4;
      state.velocities[idx * 3 + 1] = 5 + Math.random() * 5;
      state.velocities[idx * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    state.positions[idx * 3] = origin.x;
    state.positions[idx * 3 + 1] = origin.y;
    state.positions[idx * 3 + 2] = origin.z;
  }
}

function resolveParticleOrigin(
  modelRoot: THREE.Object3D | null,
  target: string,
  scratch: THREE.Vector3,
): THREE.Vector3 {
  if (modelRoot != null && target.length > 0) {
    const named = modelRoot.getObjectByName(target);
    if (named != null) {
      named.getWorldPosition(scratch);
      return scratch;
    }
  }
  if (modelRoot != null) {
    modelRoot.getWorldPosition(scratch);
    return scratch;
  }
  return scratch.set(0, 0, 0);
}

/** Advance pooled `THREE.Points` particles (node-animator parity presets). */
export function tickPreviewParticleEmitter(
  scene: THREE.Scene,
  state: PreviewParticleRuntimeState,
  cfg: Scene3DConfigV1["particleEmitter"],
  modelRoot: THREE.Object3D | null,
  deltaSec: number,
  originScratch: THREE.Vector3,
): void {
  if (cfg == null || !cfg.enabled) {
    if (state.points != null) {
      disposeParticleState(state, scene);
    }
    return;
  }

  const points = ensureParticlePoints(scene, state, cfg);

  if (cfg.trigger > 0.5 && state.lastTrigger <= 0.5) {
    spawnBurstParticles(state, cfg, resolveParticleOrigin(modelRoot, cfg.target, originScratch));
  }
  state.lastTrigger = cfg.trigger;

  if (cfg.rate > 0) {
    spawnRateParticles(
      state,
      cfg,
      resolveParticleOrigin(modelRoot, cfg.target, originScratch),
      deltaSec,
    );
  }

  const isSmoke = cfg.preset === "smoke";
  const isSteam = cfg.preset === "steam";
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (state.lives[i]! > 0) {
      state.lives[i]! -= deltaSec;
      state.positions[i * 3]! += state.velocities[i * 3]! * deltaSec;
      state.positions[i * 3 + 1]! += state.velocities[i * 3 + 1]! * deltaSec;
      state.positions[i * 3 + 2]! += state.velocities[i * 3 + 2]! * deltaSec;
      if (isSmoke) {
        state.velocities[i * 3 + 1]! += 0.5 * deltaSec;
        state.velocities[i * 3]! += (Math.random() - 0.5) * 0.1;
      } else if (isSteam) {
        state.velocities[i * 3 + 1]! -= 2.0 * deltaSec;
      } else {
        state.velocities[i * 3 + 1]! -= 9.8 * deltaSec;
      }
    } else {
      state.positions[i * 3] = 9999;
    }
  }

  points.geometry.attributes.position!.needsUpdate = true;
}

export function disposePreviewParticleRuntime(state: PreviewParticleRuntimeState, scene: THREE.Scene): void {
  disposeParticleState(state, scene);
}
