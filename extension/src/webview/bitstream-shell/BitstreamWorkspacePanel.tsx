import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { BitstreamWorkspaceId } from "../bitstream-app/state/bitstreamWorkspaceMode.store";
import { isViteDevMode } from "../utils/isViteDevMode.js";
import { BitstreamStudioLoadingScreen } from "./ui/BitstreamStudioLoadingScreen.js";
import {
  createWorkspaceLoadProgressReporter,
  formatWorkspaceLoadProgressDetail,
  getCachedWorkspaceModule,
  loadWorkspaceModule,
  type WorkspaceLoadProgress,
} from "./workspaceChunkLoader.js";

const INITIAL_PROGRESS: WorkspaceLoadProgress = {
  percent: 0,
  phase: "starting",
  modulesLoaded: 0,
  bytesLoaded: 0,
};

function WorkspaceLoadingFallback({
  workspace,
  progress,
}: {
  workspace: BitstreamWorkspaceId;
  progress: WorkspaceLoadProgress;
}) {
  return (
    <BitstreamStudioLoadingScreen
      layout="embedded"
      workspace={workspace}
      progressPercent={progress.percent}
      progressDetail={formatWorkspaceLoadProgressDetail(progress)}
    />
  );
}

function WorkspaceChunkPanel({
  workspace,
  showLoading,
}: {
  workspace: BitstreamWorkspaceId;
  showLoading: boolean;
}) {
  const [Component, setComponent] = useState<ComponentType<object> | null>(() =>
    getCachedWorkspaceModule(workspace),
  );
  const [progress, setProgress] = useState<WorkspaceLoadProgress>(INITIAL_PROGRESS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedWorkspaceModule(workspace);
    if (cached != null) {
      setComponent(() => cached);
      return;
    }

    let disposed = false;
    const reporter = createWorkspaceLoadProgressReporter((next) => {
      if (!disposed) {
        setProgress(next);
      }
    });

    void loadWorkspaceModule(workspace)
      .then((module) => {
        if (disposed) {
          return;
        }
        reporter.complete();
        setProgress((prev) => ({ ...prev, percent: 100, phase: "finalizing" }));
        setComponent(() => module);
      })
      .catch((err: unknown) => {
        if (disposed) {
          return;
        }
        const message = err instanceof Error ? err.message : "Workspace failed to load.";
        setError(message);
      })
      .finally(() => {
        reporter.dispose();
      });

    return () => {
      disposed = true;
      reporter.dispose();
    };
  }, [workspace]);

  if (error != null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <p className="text-sm font-medium text-rose-200">Workspace failed to load</p>
        <p className="max-w-sm text-xs text-zinc-500">{error}</p>
      </div>
    );
  }

  if (Component == null) {
    if (!showLoading) {
      return null;
    }
    return <WorkspaceLoadingFallback workspace={workspace} progress={progress} />;
  }

  return <Component />;
}

export function BitstreamWorkspacePanel({
  workspace,
  fallback,
  showLoading = true,
}: {
  workspace: BitstreamWorkspaceId;
  fallback?: ReactNode;
  /** When false, background keep-alive mounts load silently (dev toolbar stack). */
  showLoading?: boolean;
}) {
  if (!showLoading && fallback === null) {
    return <WorkspaceChunkPanel workspace={workspace} showLoading={false} />;
  }
  if (fallback != null) {
    return fallback;
  }
  return <WorkspaceChunkPanel workspace={workspace} showLoading={showLoading} />;
}

/**
 * Vite dev — mount each workspace on first visit and keep it mounted (visibility toggle).
 * Tab switches preserve React state; VSIX remounts a single lazy panel per tab.
 */
function BitstreamDevWorkspaceStack({ activeWorkspace }: { activeWorkspace: BitstreamWorkspaceId }) {
  const [visitedIds, setVisitedIds] = useState<BitstreamWorkspaceId[]>(() => [activeWorkspace]);

  useEffect(() => {
    setVisitedIds((prev) => (prev.includes(activeWorkspace) ? prev : [...prev, activeWorkspace]));
  }, [activeWorkspace]);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      {visitedIds.map((ws) => {
        const active = ws === activeWorkspace;
        return (
          <div
            key={ws}
            className={
              active
                ? "flex min-h-0 min-w-0 flex-1 flex-col"
                : "pointer-events-none invisible absolute inset-0 -z-10 overflow-hidden opacity-0"
            }
            aria-hidden={!active}
          >
            <BitstreamWorkspacePanel workspace={ws} showLoading={active} fallback={active ? undefined : null} />
          </div>
        );
      })}
    </div>
  );
}

/** Workspace body — dev keep-alive stack vs VSIX lazy single panel (remount on tab change). */
export function BitstreamWorkspaceMount({ workspace }: { workspace: BitstreamWorkspaceId }) {
  if (isViteDevMode()) {
    return <BitstreamDevWorkspaceStack activeWorkspace={workspace} />;
  }

  return (
    <div key={workspace} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <BitstreamWorkspacePanel workspace={workspace} />
    </div>
  );
}
