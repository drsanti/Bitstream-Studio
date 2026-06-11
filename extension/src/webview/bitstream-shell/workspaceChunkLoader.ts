import type { ComponentType } from "react";
import type { BitstreamWorkspaceId } from "../bitstream-app/state/bitstreamWorkspaceMode.store";

export type WorkspaceLoadProgress = {
  percent: number;
  phase: "starting" | "downloading" | "finalizing";
  modulesLoaded: number;
  bytesLoaded: number;
};

type WorkspaceModule = ComponentType<object>;

const workspaceModuleCache = new Map<BitstreamWorkspaceId, WorkspaceModule>();

const WORKSPACE_MODULE_LOADERS: Record<
  BitstreamWorkspaceId,
  () => Promise<WorkspaceModule>
> = {
  "course-studio": () =>
    import("../course-studio/CourseStudioWorkspace").then((m) => m.CourseStudioWorkspace),
  presentation: () =>
    import("../presentation/PresentationWorkspace").then((m) => m.PresentationWorkspace),
  "sensor-studio": () =>
    import("../sensor-studio/app/SensorStudioApp").then((m) => m.SensorStudioApp),
  "sensor-telemetry": () =>
    import("../sensor-telemetry/SensorTelemetryWorkspace").then((m) => m.SensorTelemetryWorkspace),
};

function isModuleResourceEntry(entry: PerformanceResourceTiming, startedAt: number): boolean {
  if (entry.startTime + 50 < startedAt) {
    return false;
  }
  if (entry.initiatorType === "script" || entry.initiatorType === "fetch") {
    return true;
  }
  return /\.(tsx?|jsx?|mjs|css)(\?|$)/i.test(entry.name);
}

/**
 * Estimates workspace chunk download progress from network resource timing.
 * Vite dev loads many small modules; VSIX loads fewer hashed chunks — both map to 0–99% until complete().
 */
export function createWorkspaceLoadProgressReporter(
  onUpdate: (progress: WorkspaceLoadProgress) => void,
): { complete: () => void; dispose: () => void } {
  const startedAt = performance.now();
  let maxPercent = 0;
  let modulesLoaded = 0;
  let bytesLoaded = 0;
  const seenResources = new Set<string>();

  const publish = (phase: WorkspaceLoadProgress["phase"]) => {
    onUpdate({
      percent: maxPercent,
      phase,
      modulesLoaded,
      bytesLoaded,
    });
  };

  const bump = (next: number, phase: WorkspaceLoadProgress["phase"]) => {
    maxPercent = Math.max(maxPercent, Math.min(99, next));
    publish(phase);
  };

  bump(4, "starting");

  const interval = window.setInterval(() => {
    const elapsed = performance.now() - startedAt;
    const timePct = 8 + 78 * (1 - Math.exp(-elapsed / 9000));
    bump(timePct, modulesLoaded > 0 ? "downloading" : "starting");
  }, 120);

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry instanceof PerformanceResourceTiming)) {
        continue;
      }
      if (!isModuleResourceEntry(entry, startedAt)) {
        continue;
      }
      if (seenResources.has(entry.name)) {
        continue;
      }
      seenResources.add(entry.name);
      modulesLoaded += 1;
      if (entry.transferSize > 0) {
        bytesLoaded += entry.transferSize;
      } else if (entry.encodedBodySize > 0) {
        bytesLoaded += entry.encodedBodySize;
      }
      const modulePct = 12 + 75 * (1 - Math.exp(-modulesLoaded / 28));
      const bytePct =
        bytesLoaded > 0 ? 12 + 75 * (1 - Math.exp(-bytesLoaded / (900 * 1024))) : modulePct;
      bump(Math.max(modulePct, bytePct), "downloading");
    }
  });

  try {
    observer.observe({ type: "resource", buffered: true });
  } catch {
    // PerformanceObserver unavailable — time-based estimate only.
  }

  return {
    complete: () => {
      maxPercent = 100;
      publish("finalizing");
    },
    dispose: () => {
      window.clearInterval(interval);
      observer.disconnect();
    },
  };
}

export function isWorkspaceModuleCached(workspace: BitstreamWorkspaceId): boolean {
  return workspaceModuleCache.has(workspace);
}

export function getCachedWorkspaceModule(
  workspace: BitstreamWorkspaceId,
): WorkspaceModule | null {
  return workspaceModuleCache.get(workspace) ?? null;
}

export async function loadWorkspaceModule(workspace: BitstreamWorkspaceId): Promise<WorkspaceModule> {
  const cached = workspaceModuleCache.get(workspace);
  if (cached != null) {
    return cached;
  }
  const module = await WORKSPACE_MODULE_LOADERS[workspace]();
  workspaceModuleCache.set(workspace, module);
  return module;
}

export function formatWorkspaceLoadProgressDetail(progress: WorkspaceLoadProgress): string {
  if (progress.phase === "finalizing") {
    return "Starting workspace…";
  }
  if (progress.bytesLoaded >= 1024 * 1024) {
    const mb = progress.bytesLoaded / (1024 * 1024);
    return `Downloaded ${mb.toFixed(1)} MB`;
  }
  if (progress.bytesLoaded >= 1024) {
    const kb = progress.bytesLoaded / 1024;
    return `Downloaded ${Math.round(kb)} KB`;
  }
  if (progress.modulesLoaded > 0) {
    return `${progress.modulesLoaded} module${progress.modulesLoaded === 1 ? "" : "s"} loaded`;
  }
  return "Preparing download…";
}
