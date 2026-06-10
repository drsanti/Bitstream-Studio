import { lazy, Suspense, type LazyExoticComponent, type ReactNode } from "react";
import type { BitstreamWorkspaceId } from "../bitstream-app/state/bitstreamWorkspaceMode.store";
import { BitstreamStudioLoadingScreen } from "./ui/BitstreamStudioLoadingScreen.js";

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
  return (
    <BitstreamStudioLoadingScreen
      layout="embedded"
      workspace={workspace}
      hint="Dev mode loads only the active workspace tab to keep first paint fast."
    />
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
