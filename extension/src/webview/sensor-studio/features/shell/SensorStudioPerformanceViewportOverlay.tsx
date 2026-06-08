import type { SensorStudioLivePerformanceStats } from "../../core/runtime/sensor-studio-performance-telemetry";
import type { SensorStudioMaxFpsPreset } from "../../persistence/sensor-studio-performance-preferences";
import { useSensorStudioPerformanceStore } from "../../state/sensor-studio-performance.store";
import { useStudioRuntimeVisibilityStore } from "../../state/studio-runtime-visibility.store";

function formatMs(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) {
    return "—";
  }
  return `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;
}

function capShort(preset: SensorStudioMaxFpsPreset): string {
  return preset === 0 ? "∞" : String(preset);
}

function FlowOverlayBody(props: {
  stats: SensorStudioLivePerformanceStats | null;
  cap: SensorStudioMaxFpsPreset;
  flowPaneVisible: boolean;
}) {
  const { stats, cap, flowPaneVisible } = props;

  if (stats?.documentHidden) {
    return (
      <>
        <div>PERF tick —/— fps</div>
        <div className="text-zinc-500">paused (tab hidden)</div>
      </>
    );
  }

  if (!flowPaneVisible) {
    return (
      <>
        <div>PERF tick —/— fps</div>
        <div className="text-zinc-500">Flow pane collapsed</div>
      </>
    );
  }

  const fps = stats?.flowTickFps ?? 0;
  const tickMs = formatMs(stats?.flowTickAvgMs ?? null);
  const nodes = stats?.nodeCount ?? 0;

  return (
    <>
      <div>
        PERF tick {fps}/{capShort(cap)} fps
        {stats?.flowHeavy ? (
          <span className="text-amber-300/90">
            {" · "}
            {stats.flowHeavyReason === "slow-tick" ? "heavy" : "below cap"}
          </span>
        ) : null}
      </div>
      <div className="text-zinc-400">
        {tickMs} · {nodes} n
        {stats?.flowSceneLoopActive ? (
          <span className="text-zinc-500"> · scene loop</span>
        ) : null}
      </div>
    </>
  );
}

function Stage3dOverlayBody(props: {
  stats: SensorStudioLivePerformanceStats | null;
  cap: SensorStudioMaxFpsPreset;
  stagePaneVisible: boolean;
}) {
  const { stats, cap, stagePaneVisible } = props;

  if (stats?.documentHidden) {
    return (
      <>
        <div>PERF 3D —/— fps</div>
        <div className="text-zinc-500">paused (tab hidden)</div>
      </>
    );
  }

  if (!stagePaneVisible) {
    return (
      <>
        <div>PERF 3D —/— fps</div>
        <div className="text-zinc-500">Stage pane collapsed</div>
      </>
    );
  }

  if (stats != null && !stats.render3dActive && !stats.stage3dLoopActive) {
    return (
      <>
        <div>PERF 3D —/{capShort(cap)} fps</div>
        <div className="text-zinc-500">3D loop idle</div>
      </>
    );
  }

  const fps = stats?.render3dFps ?? 0;
  const renderMs = formatMs(stats?.render3dAvgMs ?? null);
  const active = stats?.render3dActive || stats?.stage3dLoopActive;

  return (
    <>
      <div>
        PERF 3D {fps}/{capShort(cap)} fps
      </div>
      <div className="text-zinc-400">
        {renderMs}
        {active ? <span className="text-emerald-300/80"> · active</span> : null}
      </div>
    </>
  );
}

const SHELL_CLASS =
  "pointer-events-none absolute bottom-3 left-3 z-[18] max-w-[min(calc(100%-1.5rem),220px)] rounded-md border border-zinc-700/60 bg-zinc-950/88 px-2.5 py-1.5 text-[10px] leading-snug text-zinc-200 shadow-md backdrop-blur-sm";

/** Opt-in corner overlay for Flow or Stage viewports (Phase 3). */
export function SensorStudioPerformanceViewportOverlay(props: {
  variant: "flow" | "stage3d";
  /** Nudge above other bottom-left chrome (e.g. GLB playback controls). */
  className?: string;
}) {
  const { variant, className } = props;
  const showOverlay = useSensorStudioPerformanceStore(
    (s) => s.preferences.showPerformanceOverlay,
  );
  const stats = useSensorStudioPerformanceStore((s) => s.liveStats);
  const flowCap = useSensorStudioPerformanceStore((s) => s.preferences.flowSimulationMaxFps);
  const renderCap = useSensorStudioPerformanceStore((s) => s.preferences.stage3dMaxFps);
  const flowPaneVisible = useStudioRuntimeVisibilityStore((s) => s.flowPaneVisible);
  const stagePaneVisible = useStudioRuntimeVisibilityStore((s) => s.stagePaneVisible);

  if (!showOverlay) {
    return null;
  }

  return (
    <div
      className={[SHELL_CLASS, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-label={
        variant === "flow"
          ? "Flow performance overlay"
          : "Stage 3D performance overlay"
      }
    >
      {variant === "flow" ? (
        <FlowOverlayBody stats={stats} cap={flowCap} flowPaneVisible={flowPaneVisible} />
      ) : (
        <Stage3dOverlayBody
          stats={stats}
          cap={renderCap}
          stagePaneVisible={stagePaneVisible}
        />
      )}
    </div>
  );
}
