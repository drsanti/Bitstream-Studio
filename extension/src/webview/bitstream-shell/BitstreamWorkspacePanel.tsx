import { lazy, Suspense, type LazyExoticComponent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { BitstreamWorkspaceId } from "../bitstream-app/state/bitstreamWorkspaceMode.store";

function lazyNamed<T extends Record<string, React.ComponentType<object>>>(
  factory: () => Promise<T>,
  exportName: keyof T,
): LazyExoticComponent<React.ComponentType<object>> {
  return lazy(() =>
    factory().then((module) => ({
      default: module[exportName] as React.ComponentType<object>,
    })),
  );
}

const WORKSPACE_SPINNER_CLASS: Record<BitstreamWorkspaceId, string> = {
  "sensor-telemetry": "text-emerald-400/90",
  "sensor-studio": "text-violet-400/90",
  presentation: "text-sky-400/90",
  "course-studio": "text-amber-400/90",
};

const WORKSPACE_PANELS: Record<
  BitstreamWorkspaceId,
  LazyExoticComponent<React.ComponentType<object>>
> = {
  "course-studio": lazyNamed(
    () => import("../course-studio/CourseStudioWorkspace"),
    "CourseStudioWorkspace",
  ),
  presentation: lazyNamed(
    () => import("../presentation/PresentationWorkspace"),
    "PresentationWorkspace",
  ),
  "sensor-studio": lazyNamed(() => import("../sensor-studio/app/SensorStudioApp"), "SensorStudioApp"),
  "sensor-telemetry": lazyNamed(
    () => import("../sensor-telemetry/SensorTelemetryWorkspace"),
    "SensorTelemetryWorkspace",
  ),
};

function WorkspaceLoadingFallback({ workspace }: { workspace: BitstreamWorkspaceId }) {
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spinnerClass = WORKSPACE_SPINNER_CLASS[workspace];

  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <Loader2
        className={`h-10 w-10 shrink-0 ${spinnerClass} ${reducedMotion ? "" : "animate-spin"}`}
        strokeWidth={2.25}
        aria-hidden
      />
      <div className="flex max-w-md flex-col items-center gap-1.5 text-center">
        <span className="text-base font-medium text-zinc-300">Loading workspace…</span>
        <span className="text-xs text-zinc-500">
          Dev mode loads only the active workspace tab to keep first paint fast.
        </span>
      </div>
    </div>
  );
}

export function BitstreamWorkspacePanel({
  workspace,
  fallback,
}: {
  workspace: BitstreamWorkspaceId;
  fallback?: ReactNode;
}) {
  const Panel = WORKSPACE_PANELS[workspace];
  return (
    <Suspense fallback={fallback ?? <WorkspaceLoadingFallback workspace={workspace} />}>
      <Panel />
    </Suspense>
  );
}
