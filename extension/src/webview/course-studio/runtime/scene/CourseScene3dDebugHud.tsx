import { useSyncExternalStore, useState } from "react";
import {
  getCourseScene3dDebugSnapshot,
  isCourseScene3dDebugHudEnabled,
  subscribeCourseScene3dDebug,
} from "./courseScene3dDebug";

function DebugHudLine({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="min-w-0 break-all text-zinc-200">{String(value)}</span>
    </div>
  );
}

export function CourseScene3dDebugHud({ sceneId }: { sceneId: string }) {
  const enabled = isCourseScene3dDebugHudEnabled();
  const [collapsed, setCollapsed] = useState(true);
  const snapshot = useSyncExternalStore(
    (listener) => subscribeCourseScene3dDebug(sceneId, listener),
    () => getCourseScene3dDebugSnapshot(sceneId),
    () => null,
  );

  if (!enabled) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute bottom-2 right-2 z-[70] max-w-[min(92vw,22rem)]">
      <button
        type="button"
        className="mb-1 rounded border border-emerald-700/60 bg-zinc-950/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90 backdrop-blur-sm"
        onClick={() => setCollapsed((value) => !value)}
      >
        3D debug {collapsed ? "▸" : "▾"}
      </button>
      {collapsed ? null : (
        <div className="rounded border border-zinc-700/70 bg-zinc-950/92 px-2.5 py-2 font-sans text-[10px] leading-relaxed text-zinc-300 shadow-lg backdrop-blur-md">
          {snapshot == null ? (
            <p className="text-zinc-500">Waiting for R3F probe…</p>
          ) : (
            <>
              <p className="mb-1 font-semibold text-emerald-300/90">
                Dev overlay — axes / grid / camera helpers in scene
              </p>
              <DebugHudLine label="host" value={`${snapshot.hostW}×${snapshot.hostH}`} />
              <DebugHudLine label="buffer" value={`${snapshot.bufferW}×${snapshot.bufferH}`} />
              <DebugHudLine label="r3f" value={`${snapshot.r3fW}×${snapshot.r3fH} @${snapshot.dpr}x`} />
              <DebugHudLine label="ctx lost" value={snapshot.contextLost} />
              <DebugHudLine label="frames" value={snapshot.frameCount} />
              <DebugHudLine label="loop" value={snapshot.frameloop} />
              <DebugHudLine label="mode" value={snapshot.designTime ? "edit" : "preview"} />
              <DebugHudLine label="proj" value={snapshot.projection} />
              <DebugHudLine label="cam" value={`${snapshot.cameraType} [${snapshot.cameraPos}]`} />
              <DebugHudLine label="lens" value={snapshot.cameraFovOrZoom} />
              <DebugHudLine label="forward" value={snapshot.cameraForward} />
              <DebugHudLine label="target" value={snapshot.orbitTarget} />
              <DebugHudLine label="ctrl on" value={snapshot.controlsEnabled} />
              <DebugHudLine label="backdrop" value={snapshot.backdropMode} />
              <DebugHudLine label="bg" value={snapshot.background} />
              <DebugHudLine label="ibl" value={snapshot.hasEnvironment} />
              <DebugHudLine label="roots" value={snapshot.rootCount} />
              <DebugHudLine label="models" value={snapshot.modelCount} />
              <DebugHudLine label="meshes" value={snapshot.meshCount} />
              <DebugHudLine label="lights" value={snapshot.lightCount} />
              <DebugHudLine label="children" value={snapshot.sceneChildren} />
              <DebugHudLine label="canvases" value={snapshot.canvasCount} />
              <DebugHudLine label="canvas css" value={snapshot.canvasCss} />
              <DebugHudLine label="canvas α" value={snapshot.canvasOpacity} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
