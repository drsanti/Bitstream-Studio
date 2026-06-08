import {
  FLOW_INTERACTION_THROTTLE_FPS_PRESETS,
  formatFlowInteractionTickPolicyLabel,
  formatSensorStudioMaxFpsLabel,
  SENSOR_STUDIO_MAX_FPS_PRESETS,
  type FlowInteractionThrottleFpsPreset,
  type FlowInteractionTickPolicy,
  type SensorStudioMaxFpsPreset,
  type SensorStudioPerformancePreferences,
} from "../../../../persistence/sensor-studio-performance-preferences";
import { useSensorStudioPerformanceStore } from "../../../../state/sensor-studio-performance.store";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import { InspectorSegmentButtonGroup, type InspectorSegmentOption } from "./InspectorSegmentButtonGroup";
import {
  SensorStudioFlowSimulationLiveStats,
  SensorStudioRender3dLiveStats,
} from "./SensorStudioPerformanceLiveStats";

const FLOW_FPS_OPTIONS: InspectorSegmentOption<SensorStudioMaxFpsPreset>[] =
  SENSOR_STUDIO_MAX_FPS_PRESETS.map((value) => ({
    value,
    label: formatSensorStudioMaxFpsLabel(value),
  }));

const FLOW_INTERACTION_POLICY_OPTIONS: InspectorSegmentOption<FlowInteractionTickPolicy>[] =
  (["inherit", "pause", "throttle"] as const).map((value) => ({
    value,
    label: formatFlowInteractionTickPolicyLabel(value),
  }));

const FLOW_INTERACTION_THROTTLE_OPTIONS: InspectorSegmentOption<FlowInteractionThrottleFpsPreset>[] =
  FLOW_INTERACTION_THROTTLE_FPS_PRESETS.map((value) => ({
    value,
    label: `${value} fps`,
  }));

export function SensorStudioPerformancePreferencesSection(props: {
  preferences: SensorStudioPerformancePreferences;
  onPreferencesChange: (patch: Partial<SensorStudioPerformancePreferences>) => void;
}) {
  const { preferences, onPreferencesChange } = props;
  const liveStats = useSensorStudioPerformanceStore((s) => s.liveStats);
  const showLive = preferences.showLivePerformanceStats;

  return (
    <div className="space-y-2.5">
      <InspectorPropertyRow
        label="Flow simulation"
        description="Caps graph evaluation and live 2D node refresh. Lower values help slow PCs."
      >
        <div className="space-y-0">
          <InspectorSegmentButtonGroup
            ariaLabel="Flow simulation max frame rate"
            layout="grid-3"
            value={preferences.flowSimulationMaxFps}
            options={FLOW_FPS_OPTIONS}
            onChange={(next) => onPreferencesChange({ flowSimulationMaxFps: next })}
          />
          <SensorStudioFlowSimulationLiveStats
            showLive={showLive}
            stats={liveStats}
            cap={preferences.flowSimulationMaxFps}
          />
        </div>
      </InspectorPropertyRow>
      <InspectorPropertyRow
        label="While editing canvas"
        description="How flow simulation runs while you drag nodes or pan the flow canvas. Canvas painting stays smooth; only live graph updates change."
      >
        <div className="space-y-2">
          <InspectorSegmentButtonGroup
            ariaLabel="Flow simulation while editing canvas"
            layout="grid-3"
            value={preferences.flowInteractionTickPolicy}
            options={FLOW_INTERACTION_POLICY_OPTIONS}
            onChange={(next) =>
              onPreferencesChange({ flowInteractionTickPolicy: next })
            }
          />
          {preferences.flowInteractionTickPolicy === "throttle" ? (
            <InspectorSegmentButtonGroup
              ariaLabel="Reduced flow tick rate while editing canvas"
              layout="grid-3"
              value={preferences.flowInteractionThrottleFps}
              options={FLOW_INTERACTION_THROTTLE_OPTIONS}
              onChange={(next) =>
                onPreferencesChange({ flowInteractionThrottleFps: next })
              }
            />
          ) : null}
          <InspectorCompactToggleRow
            label="When dragging nodes"
            hint="Apply the policy above while a node is dragged on the flow canvas."
            checked={preferences.flowInteractionTriggers.nodeDrag}
            onCheckedChange={(next) =>
              onPreferencesChange({
                flowInteractionTriggers: { nodeDrag: next },
              })
            }
          />
          <InspectorCompactToggleRow
            label="When panning canvas"
            hint="Apply the policy above while panning or zooming the flow viewport."
            checked={preferences.flowInteractionTriggers.canvasPan}
            onCheckedChange={(next) =>
              onPreferencesChange({
                flowInteractionTriggers: { canvasPan: next },
              })
            }
          />
        </div>
      </InspectorPropertyRow>
      <InspectorPropertyRow
        label="3D previews"
        description="Caps Stage and in-flow Model Viewer WebGL loops. Suspends when the Stage pane is collapsed."
      >
        <div className="space-y-0">
          <InspectorSegmentButtonGroup
            ariaLabel="3D preview max frame rate"
            layout="grid-3"
            value={preferences.stage3dMaxFps}
            options={FLOW_FPS_OPTIONS}
            onChange={(next) => onPreferencesChange({ stage3dMaxFps: next })}
          />
          <SensorStudioRender3dLiveStats
            showLive={showLive}
            stats={liveStats}
            cap={preferences.stage3dMaxFps}
          />
        </div>
      </InspectorPropertyRow>
      <InspectorCompactToggleRow
        label="Show live performance stats"
        hint="Updates about once per second. Does not change simulation behavior."
        checked={showLive}
        onCheckedChange={(next) =>
          onPreferencesChange({ showLivePerformanceStats: next })
        }
      />
      <InspectorCompactToggleRow
        label="Show performance overlay"
        hint="Small PERF readout in the bottom-left of Flow and Stage viewports."
        checked={preferences.showPerformanceOverlay}
        onCheckedChange={(next) =>
          onPreferencesChange({ showPerformanceOverlay: next })
        }
      />
    </div>
  );
}
