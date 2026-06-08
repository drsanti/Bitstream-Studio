import type { SensorStudioLivePerformanceStats } from "../../../../core/runtime/sensor-studio-performance-telemetry";
import { formatFlowInteractionActiveKindLabel } from "../../../../core/runtime/flow-interaction-tick-gate";
import {
  formatSensorStudioMaxFpsLabel,
  type SensorStudioMaxFpsPreset,
} from "../../../../persistence/sensor-studio-performance-preferences";

function formatMs(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) {
    return "—";
  }
  return `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;
}

function capLabel(preset: SensorStudioMaxFpsPreset): string {
  return preset === 0 ? "Unlimited" : String(preset);
}

function PaneDot(props: { active: boolean; label: string }) {
  const { active, label } = props;
  return (
    <span className={active ? "text-emerald-300/90" : "text-zinc-500"}>
      <span aria-hidden>{active ? "●" : "○"}</span> {label}
    </span>
  );
}

export function SensorStudioFlowSimulationLiveStats(props: {
  stats: SensorStudioLivePerformanceStats | null;
  cap: SensorStudioMaxFpsPreset;
  showLive: boolean;
}) {
  const { stats, cap, showLive } = props;
  if (!showLive) {
    return null;
  }
  if (stats == null) {
    return (
      <p className="text-[10px] leading-snug text-zinc-500">Collecting samples…</p>
    );
  }
  if (stats.documentHidden) {
    return (
      <p className="text-[10px] leading-snug text-zinc-500">
        Live — fps · paused (tab hidden)
      </p>
    );
  }
  const effectiveCap = stats.flowTickEffectiveCap ?? cap;
  const interactionKind = formatFlowInteractionActiveKindLabel(
    stats.flowInteractionActiveKind,
  );
  return (
    <div className="space-y-1 border-t border-zinc-800/60 pt-2">
      <p className="text-[10px] leading-snug text-zinc-300">
        Live{" "}
        <span className="text-zinc-100">
          {stats.flowInteractionPaused ? "—" : `${stats.flowTickFps} fps`}
        </span>
        {" · "}cap {capLabel(effectiveCap)}
        {" · "}tick {formatMs(stats.flowTickAvgMs)}
        {stats.flowInteractionPaused && interactionKind.length > 0 ? (
          <span className="text-cyan-300/85">
            {" · "}paused ({interactionKind})
          </span>
        ) : stats.flowInteractionEditing && !stats.flowInteractionPaused ? (
          <span className="text-cyan-300/85">
            {" · "}editing
            {interactionKind.length > 0 ? ` (${interactionKind})` : ""}
          </span>
        ) : null}
        {stats.flowHeavy ? (
          <span className="text-amber-300/90">
            {" · "}
            {stats.flowHeavyReason === "slow-tick" ? "heavy" : "below cap"}
          </span>
        ) : effectiveCap > 0 &&
          !stats.flowInteractionPaused &&
          stats.flowTickFps >= effectiveCap - 1 ? (
          <span className="text-emerald-300/80"> · at cap</span>
        ) : null}
      </p>
      <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] leading-snug text-zinc-500">
        <PaneDot active={stats.flowPaneVisible} label="Flow" />
        <PaneDot active={stats.dashboardPaneVisible} label="Dashboard" />
        <PaneDot active={stats.stagePaneVisible} label="Stage" />
        {stats.flowSceneLoopActive ? (
          <span className="text-zinc-400">· scene loop on</span>
        ) : null}
      </p>
      {stats.flowHeavy ? (
        <p className="text-[10px] leading-snug text-amber-300/85">
          {stats.flowHeavyReason === "slow-tick"
            ? `${stats.nodeCount} nodes · ${stats.edgeCount} edges — graph eval is slow (tick ≥ 25 ms).`
            : stats.flowTickAvgMs != null && stats.flowTickAvgMs < 10
              ? `${stats.nodeCount} nodes · ${stats.edgeCount} edges — tick eval is fast (${formatMs(stats.flowTickAvgMs)}); main-thread UI refresh is likely limiting fps.`
              : `${stats.nodeCount} nodes · ${stats.edgeCount} edges — effective tick rate is below the cap.`}
        </p>
      ) : null}
    </div>
  );
}

export function SensorStudioRender3dLiveStats(props: {
  stats: SensorStudioLivePerformanceStats | null;
  cap: SensorStudioMaxFpsPreset;
  showLive: boolean;
}) {
  const { stats, cap, showLive } = props;
  if (!showLive) {
    return null;
  }
  if (stats == null) {
    return (
      <p className="text-[10px] leading-snug text-zinc-500">Collecting samples…</p>
    );
  }
  if (stats.documentHidden) {
    return (
      <p className="text-[10px] leading-snug text-zinc-500">
        Live — fps · paused (tab hidden)
      </p>
    );
  }
  if (!stats.render3dActive) {
    let idle = "No active WebGL loop";
    if (!stats.stagePaneVisible && !stats.flowPaneVisible) {
      idle = "Suspended — Flow and Stage panes collapsed";
    } else if (!stats.stagePaneVisible) {
      idle = "Stage loop suspended (pane collapsed)";
    } else if (!stats.stage3dLoopActive) {
      idle = "3D loop idle";
    }
    return (
      <p className="border-t border-zinc-800/60 pt-2 text-[10px] leading-snug text-zinc-500">
        Live — fps · {idle}
      </p>
    );
  }
  return (
    <p className="border-t border-zinc-800/60 pt-2 text-[10px] leading-snug text-zinc-300">
      Live <span className="text-zinc-100">{stats.render3dFps} fps</span>
      {" · "}cap {formatSensorStudioMaxFpsLabel(cap)}
      {" · "}render {formatMs(stats.render3dAvgMs)}
      {!stats.stagePaneVisible && stats.flowPaneVisible ? (
        <span className="text-zinc-500"> · flow previews only</span>
      ) : null}
    </p>
  );
}
