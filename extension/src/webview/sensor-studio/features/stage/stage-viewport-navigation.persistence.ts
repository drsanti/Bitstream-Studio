/** Session-only Stage viewport navigation (not committed to scene3d / flow graph). */

import type { StudioViewportProjectionMode } from "../../core/viewport/studio-viewport-projection";
import type { StudioViewportMousePreset } from "../../core/viewport/studio-viewport-mouse-preset";
import type { StudioViewportGizmoMode } from "../../core/viewport/studio-viewport-gizmo-mode";
import type { StudioViewportViewSnapMode } from "../../core/viewport/studio-viewport-view-snaps";

const PREFIX = "ternion.sensor-studio.stageViewport.";

const KEYS = {
  projection: `${PREFIX}navigation.projection.v1`,
  orthoZoom: `${PREFIX}navigation.orthoZoom.v1`,
  mousePreset: `${PREFIX}navigation.mousePreset.v1`,
  viewSnapMode: `${PREFIX}navigation.viewSnapMode.v1`,
  gizmoMode: `${PREFIX}navigation.gizmoMode.v1`,
} as const;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function readStoredStageViewportProjection(): StudioViewportProjectionMode {
  const raw = safeGet(KEYS.projection);
  return raw === "orthographic" ? "orthographic" : "perspective";
}

export function writeStoredStageViewportProjection(
  mode: StudioViewportProjectionMode,
): void {
  safeSet(KEYS.projection, mode);
}

export function readStoredStageViewportOrthoZoom(): number | null {
  const raw = safeGet(KEYS.orthoZoom);
  if (raw == null || raw.length === 0) {
    return null;
  }
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function writeStoredStageViewportOrthoZoom(zoom: number): void {
  if (!Number.isFinite(zoom) || zoom <= 0) {
    return;
  }
  safeSet(KEYS.orthoZoom, String(zoom));
}

export function readStoredStageViewportMousePreset(): StudioViewportMousePreset {
  const raw = safeGet(KEYS.mousePreset);
  return raw === "blender" ? "blender" : "three";
}

export function writeStoredStageViewportMousePreset(
  preset: StudioViewportMousePreset,
): void {
  safeSet(KEYS.mousePreset, preset);
}

export function readStoredStageViewportViewSnapMode(): StudioViewportViewSnapMode {
  const raw = safeGet(KEYS.viewSnapMode);
  return raw === "world-locked" ? "world-locked" : "camera-relative";
}

export function writeStoredStageViewportViewSnapMode(
  mode: StudioViewportViewSnapMode,
): void {
  safeSet(KEYS.viewSnapMode, mode);
}

export function readStoredStageViewportGizmoMode(): StudioViewportGizmoMode {
  const raw = safeGet(KEYS.gizmoMode);
  return raw === "rotate" || raw === "scale" ? raw : "translate";
}

export function writeStoredStageViewportGizmoMode(mode: StudioViewportGizmoMode): void {
  safeSet(KEYS.gizmoMode, mode);
}
