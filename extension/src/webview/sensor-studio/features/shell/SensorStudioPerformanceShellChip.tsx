import { Gauge } from "lucide-react";
import { useCallback } from "react";
import {
  BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS,
  BITSTREAM_SHELL_TOOLBAR_TELEMETRY_CHIP_TEXT_CLASS,
} from "../../../bitstream-shell/ui/workspace-chrome-chip";
import { TRNTooltip } from "../../../ui/TRN/TRNTooltip";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";
import { useSensorStudioPerformanceStore } from "../../state/sensor-studio-performance.store";
import { useCanvasInspectorFocusStore } from "../../state/canvas-inspector-focus.store";
import { useStudioWorkbenchFocusStore } from "../../state/studio-workbench-focus.store";
import {
  formatSensorStudioPerformanceShellChipLabel,
  shouldShowSensorStudioPerformanceShellChip,
} from "./sensor-studio-performance-shell-chip";

const CHIP_FRAME_CLASS =
  "inline-flex h-[21px] w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 font-sans text-[11px] font-medium tracking-wide leading-none text-zinc-200/95 select-none hover:border-violet-400/40 hover:bg-violet-500/15";

function PaneDot(props: { active: boolean; label: string }) {
  const { active, label } = props;
  return (
    <span className={active ? "text-emerald-300/90" : "text-zinc-500"}>
      <span aria-hidden>{active ? "●" : "○"}</span> {label}
    </span>
  );
}

/** Compact Sensor Studio sim / 3D fps chip for the shell toolbar (Phase 2). */
export function SensorStudioPerformanceShellChip() {
  const prefs = useSensorStudioPerformanceStore((s) => s.preferences);
  const stats = useSensorStudioPerformanceStore((s) => s.liveStats);

  const visible = shouldShowSensorStudioPerformanceShellChip(prefs, stats);
  const label = formatSensorStudioPerformanceShellChipLabel(stats);

  const openPerformanceInspector = useCallback(() => {
    useFlowEditorStore.getState().onSelectionChange([]);
    useStudioWorkbenchFocusStore.getState().setActiveEditorType("flow");
    useCanvasInspectorFocusStore.getState().focusPerformanceCard();
  }, []);

  if (!visible) {
    return null;
  }

  const flowCap =
    prefs.flowSimulationMaxFps === 0 ? "Unlimited" : `${prefs.flowSimulationMaxFps} fps`;
  const renderCap =
    prefs.stage3dMaxFps === 0 ? "Unlimited" : `${prefs.stage3dMaxFps} fps`;

  const tooltip = (
    <div className="min-w-0 max-w-[260px] whitespace-pre-line text-left text-[11px]">
      <div className="font-semibold text-zinc-100">Performance</div>
      <div className="mt-1 text-zinc-300">
        Flow tick{" "}
        {stats != null && !stats.documentHidden
          ? `${stats.flowTickFps} / ${flowCap}`
          : "—"}
      </div>
      <div className="text-zinc-300">
        3D render{" "}
        {stats != null && !stats.documentHidden && stats.render3dActive
          ? `${stats.render3dFps} / ${renderCap}`
          : stats != null && stats.stage3dLoopActive
            ? `0 / ${renderCap}`
            : "— (idle)"}
      </div>
      {stats != null ? (
        <div className="mt-1.5 flex flex-wrap gap-x-2 text-zinc-500">
          <PaneDot active={stats.flowPaneVisible} label="Flow" />
          <PaneDot active={stats.dashboardPaneVisible} label="Dashboard" />
          <PaneDot active={stats.stagePaneVisible} label="Stage" />
        </div>
      ) : null}
      <div className="mt-1.5 text-zinc-500">Click to open Inspector → Performance.</div>
    </div>
  );

  return (
    <TRNTooltip
      placement="bottom-end"
      openDelayMs={650}
      disableHoverFx
      triggerWrapper="span"
      triggerClassName="!p-0 shrink-0"
      triggerAriaLabel={`Sensor Studio performance: ${label}. Click to open Performance settings.`}
      content={tooltip}
      trigger={
        <button
          type="button"
          className={CHIP_FRAME_CLASS}
          onClick={openPerformanceInspector}
        >
          <Gauge
            size={12}
            aria-hidden
            className={`${BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS} text-violet-200/90`}
          />
          <span
            className={`${BITSTREAM_SHELL_TOOLBAR_TELEMETRY_CHIP_TEXT_CLASS} ${BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS} text-violet-100/95`}
          >
            {label}
          </span>
        </button>
      }
    />
  );
}
