/**
 * User preferences: how the **Stage** (3D Scene) toolbar interacts with Scene Output and wired flow nodes.
 * Persisted in localStorage (flow document scope — same pattern as canvas inspector cards).
 */

import { useCallback, useState } from "react";

const STORAGE_KEY = "ternion.sensor-studio.stagePresentation.v1";

export type Stage3DOverridePolicy =
  /** Toolbar patches Scene Output and wired source nodes (default). */
  | "sync-wired-nodes"
  /** Toolbar patches Scene Output `scene3d` / `showGrid` only. */
  | "scene-output-only"
  /** Stage toolbar presentation controls hidden/disabled. */
  | "toolbar-readonly";

export type StagePresentationPreferences = {
  policy: Stage3DOverridePolicy;
  /** When `policy === sync-wired-nodes`, per-control wired-node sync (Scene Output always updated). */
  syncStudioModel: boolean;
  syncCubemap: boolean;
  syncBackdrop: boolean;
  syncIbl: boolean;
  /**
   * When true, hide Box/Sphere/Plane spawn toolbar until at least one mesh is wired
   * (useful when placement requires an existing surface).
   */
  hideSpawnWhenNoMeshes: boolean;
  /**
   * When true, auto-remove Scene Output **Models** wires while the committed scene is meshes-only.
   */
  autoDisconnectOrphanModelSources: boolean;
};

export const DEFAULT_STAGE_PRESENTATION_PREFERENCES: StagePresentationPreferences = {
  policy: "sync-wired-nodes",
  syncStudioModel: true,
  syncCubemap: true,
  syncBackdrop: true,
  syncIbl: true,
  hideSpawnWhenNoMeshes: false,
  autoDisconnectOrphanModelSources: false,
};

function safeGet(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function coerceStagePresentationPreferences(raw: unknown): StagePresentationPreferences {
  const d = DEFAULT_STAGE_PRESENTATION_PREFERENCES;
  if (raw == null || typeof raw !== "object") {
    return { ...d };
  }
  const o = raw as Record<string, unknown>;
  const policyRaw = o.policy;
  const policy =
    policyRaw === "sync-wired-nodes" ||
    policyRaw === "scene-output-only" ||
    policyRaw === "toolbar-readonly"
      ? policyRaw
      : d.policy;
  return {
    policy,
    syncStudioModel: o.syncStudioModel !== false,
    syncCubemap: o.syncCubemap !== false,
    syncBackdrop: o.syncBackdrop !== false,
    syncIbl: o.syncIbl !== false,
    hideSpawnWhenNoMeshes: o.hideSpawnWhenNoMeshes === true,
    autoDisconnectOrphanModelSources: o.autoDisconnectOrphanModelSources === true,
  };
}

export function readStagePresentationPreferences(): StagePresentationPreferences {
  const raw = safeGet();
  if (raw == null || raw.length === 0) {
    return { ...DEFAULT_STAGE_PRESENTATION_PREFERENCES };
  }
  try {
    return coerceStagePresentationPreferences(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_STAGE_PRESENTATION_PREFERENCES };
  }
}

export function writeStagePresentationPreferences(next: StagePresentationPreferences): void {
  safeSet(JSON.stringify(next));
}

export function stagePresentationOverridesWiredEnvironment(
  prefs: StagePresentationPreferences = readStagePresentationPreferences(),
): boolean {
  return prefs.policy === "sync-wired-nodes";
}

export function stagePresentationOverridesWiredStudioModel(
  prefs: StagePresentationPreferences = readStagePresentationPreferences(),
): boolean {
  return prefs.policy === "sync-wired-nodes" && prefs.syncStudioModel;
}

export function stagePresentationSyncCubemap(
  prefs: StagePresentationPreferences = readStagePresentationPreferences(),
): boolean {
  return prefs.policy === "sync-wired-nodes" && prefs.syncCubemap;
}

export function stagePresentationSyncBackdrop(
  prefs: StagePresentationPreferences = readStagePresentationPreferences(),
): boolean {
  return prefs.policy === "sync-wired-nodes" && prefs.syncBackdrop;
}

export function stagePresentationSyncIbl(
  prefs: StagePresentationPreferences = readStagePresentationPreferences(),
): boolean {
  return prefs.policy === "sync-wired-nodes" && prefs.syncIbl;
}

export function stageToolbarPresentationEnabled(
  prefs: StagePresentationPreferences = readStagePresentationPreferences(),
): boolean {
  return prefs.policy !== "toolbar-readonly";
}

export function stageSpawnToolbarEnabled(
  args: { hasSceneOutput: boolean; hasMeshes: boolean },
  prefs: StagePresentationPreferences = readStagePresentationPreferences(),
): boolean {
  if (!args.hasSceneOutput) {
    return false;
  }
  if (prefs.hideSpawnWhenNoMeshes && !args.hasMeshes) {
    return false;
  }
  return true;
}

export function stagePresentationAutoDisconnectOrphanModelSources(
  prefs: StagePresentationPreferences = readStagePresentationPreferences(),
): boolean {
  return prefs.autoDisconnectOrphanModelSources;
}

export function useStagePresentationPreferences(
  initial?: StagePresentationPreferences,
): {
  preferences: StagePresentationPreferences;
  patchPreferences: (patch: Partial<StagePresentationPreferences>) => void;
} {
  const [preferences, setPreferences] = useState(
    () => initial ?? readStagePresentationPreferences(),
  );
  const patchPreferences = useCallback((patch: Partial<StagePresentationPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      writeStagePresentationPreferences(next);
      return next;
    });
  }, []);
  return { preferences, patchPreferences };
}
