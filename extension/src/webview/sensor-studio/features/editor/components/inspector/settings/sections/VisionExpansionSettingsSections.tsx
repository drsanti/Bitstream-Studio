import { Video } from "lucide-react";
import { TRNHintText } from "../../../../../../../ui/TRN";
import { FlowNodeHeaderBadge } from "../../../../nodes/flow-node/FlowNodeHeaderBadge";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorSelectRow } from "../../InspectorDenseControls";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  useVisionFaceUi,
  useVisionHandsUi,
  useVisionLandmarksDebugUi,
  useVisionObjectUi,
} from "../../../../nodes/camera/vision-expansion-chrome";
import { readVisionFaceConfig } from "../../../../../../core/camera/vision-face-config";
import { readVisionHandsConfig } from "../../../../../../core/camera/vision-hands-config";
import { readVisionLandmarksDebugConfig } from "../../../../../../core/camera/vision-landmarks-debug-config";
import { readVisionObjectConfig } from "../../../../../../core/camera/vision-object-config";
import {
  resolveVisionQualityTargetFps,
  type VisionQualityPreset,
} from "../../../../../../core/camera/vision-shared-config";

function VisionInferenceInspectorFields(props: {
  parsed: {
    enabled: boolean;
    qualityPreset: VisionQualityPreset;
    targetFps: number;
    minDetectionConfidence: number;
    triggerOnEnter: boolean;
    triggerOnExit: boolean;
    inferenceBackend: "main" | "worker";
  };
  ui: {
    status: "idle" | "loading" | "ready" | "error";
    detected?: boolean;
    errorMessage?: string;
  };
  onUpdateConfigField: NodeInspectorSettingsSectionProps["onUpdateConfigField"];
  modelHint: string;
  showEvents?: boolean;
}) {
  const { parsed, ui, onUpdateConfigField, modelHint, showEvents = true } = props;
  return (
    <>
      <div className="mb-1 flex items-center gap-2">
        <FlowNodeHeaderBadge
          tone={ui.detected ? "live" : ui.status === "error" ? "invalid" : "neutral"}
          pulseDot={ui.status === "loading"}
        >
          {ui.status === "error"
            ? "Error"
            : ui.detected
              ? "Detected"
              : ui.status === "loading"
                ? "Loading"
                : "Idle"}
        </FlowNodeHeaderBadge>
      </div>
      {ui.errorMessage != null ? (
        <p className="mb-1 text-[10px] leading-snug text-rose-200/85">{ui.errorMessage}</p>
      ) : null}
      <InspectorCompactToggleRow
        label="Enabled"
        hint="When disabled, outputs stay idle and inference is skipped."
        checked={parsed.enabled}
        onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
      />
      <InspectorSelectRow
        label="Quality preset"
        description="Sets default inference FPS cap."
        ariaLabel="Vision quality preset"
        value={parsed.qualityPreset}
        options={[
          { value: "low", label: "Low (8 fps)" },
          { value: "med", label: "Medium (15 fps)" },
          { value: "high", label: "High (24 fps)" },
        ]}
        onChange={(next) => {
          onUpdateConfigField("qualityPreset", next as VisionQualityPreset);
          onUpdateConfigField(
            "targetFps",
            resolveVisionQualityTargetFps(next as VisionQualityPreset),
          );
        }}
      />
      <InspectorNumericScrubRow
        label="Target FPS"
        hint={modelHint}
        value={parsed.targetFps}
        min={1}
        max={30}
        step={1}
        onChange={(next) => onUpdateConfigField("targetFps", Math.round(next))}
      />
      <InspectorNumericScrubRow
        label="Min detection"
        value={parsed.minDetectionConfidence}
        min={0}
        max={1}
        step={0.01}
        onChange={(next) => onUpdateConfigField("minDetectionConfidence", next)}
      />
      <InspectorSelectRow
        label="Inference backend"
        description="Worker keeps MediaPipe off the main thread (recommended when Stage + GLB are active)."
        ariaLabel="Vision inference backend"
        value={parsed.inferenceBackend}
        options={[
          { value: "worker", label: "Web worker" },
          { value: "main", label: "Main thread (CPU)" },
        ]}
        onChange={(next) =>
          onUpdateConfigField("inferenceBackend", next === "worker" ? "worker" : "main")
        }
      />
      {showEvents ? (
        <InspectorCollapsibleSection
          title="Events"
          icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          iconHint="Wire **Trigger** to event consumers."
          defaultExpanded={false}
        >
          <InspectorCompactToggleRow
            label="Trigger on enter"
            checked={parsed.triggerOnEnter}
            onCheckedChange={(next) => onUpdateConfigField("triggerOnEnter", next)}
          />
          <InspectorCompactToggleRow
            label="Trigger on exit"
            checked={parsed.triggerOnExit}
            onCheckedChange={(next) => onUpdateConfigField("triggerOnExit", next)}
          />
        </InspectorCollapsibleSection>
      ) : null}
    </>
  );
}

export function VisionHandsSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const parsed = readVisionHandsConfig(cfg);
  const ui = useVisionHandsUi(selectedNode.id);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Inference"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="MediaPipe Hand Landmarker — requires network on first model load."
        defaultExpanded
      >
        <VisionInferenceInspectorFields
          parsed={parsed}
          ui={ui}
          onUpdateConfigField={onUpdateConfigField}
          modelHint="Hand tracking FPS cap (default 12 on node card)."
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

export function VisionFaceSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const parsed = readVisionFaceConfig(cfg);
  const ui = useVisionFaceUi(selectedNode.id);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Inference"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="MediaPipe Face Landmarker — requires network on first model load."
        defaultExpanded
      >
        <VisionInferenceInspectorFields
          parsed={parsed}
          ui={ui}
          onUpdateConfigField={onUpdateConfigField}
          modelHint="Face tracking FPS cap."
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

export function VisionObjectSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const parsed = readVisionObjectConfig(cfg);
  const ui = useVisionObjectUi(selectedNode.id);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Inference"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="EfficientDet Lite0 object detector — COCO labels."
        defaultExpanded
      >
        <VisionInferenceInspectorFields
          parsed={parsed}
          ui={ui}
          onUpdateConfigField={onUpdateConfigField}
          modelHint="Object detection FPS cap (keep low for performance)."
        />
        <InspectorNumericScrubRow
          label="Score threshold"
          hint="Minimum category score for detections."
          value={parsed.scoreThreshold}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => onUpdateConfigField("scoreThreshold", next)}
        />
        <InspectorNumericScrubRow
          label="Max results"
          value={parsed.maxResults}
          min={1}
          max={10}
          step={1}
          onChange={(next) => onUpdateConfigField("maxResults", Math.round(next))}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

export function VisionLandmarksDebugSettingsSection(
  props: NodeInspectorSettingsSectionProps,
) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const parsed = readVisionLandmarksDebugConfig(cfg);
  const ui = useVisionLandmarksDebugUi(selectedNode.id);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Debug export"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Runs lite pose inference and exports compact landmark JSON."
        defaultExpanded
      >
        <div className="mb-1 flex items-center gap-2">
          <FlowNodeHeaderBadge
            tone={ui.status === "error" ? "invalid" : ui.count > 0 ? "live" : "neutral"}
            pulseDot={ui.status === "loading"}
          >
            {ui.status === "error"
              ? "Error"
              : ui.status === "loading"
                ? "Loading"
                : ui.count > 0
                  ? `${ui.count} landmarks`
                  : "Idle"}
          </FlowNodeHeaderBadge>
        </div>
        {ui.errorMessage != null ? (
          <p className="mb-1 text-[10px] leading-snug text-rose-200/85">{ui.errorMessage}</p>
        ) : null}
        <InspectorCompactToggleRow
          label="Enabled"
          checked={parsed.enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <InspectorSelectRow
          label="Quality preset"
          ariaLabel="Landmarks debug quality preset"
          value={parsed.qualityPreset}
          options={[
            { value: "low", label: "Low (8 fps)" },
            { value: "med", label: "Medium (15 fps)" },
          ]}
          onChange={(next) => {
            onUpdateConfigField("qualityPreset", next as VisionQualityPreset);
            onUpdateConfigField(
              "targetFps",
              resolveVisionQualityTargetFps(next as VisionQualityPreset),
            );
          }}
        />
        <InspectorNumericScrubRow
          label="Target FPS"
          value={parsed.targetFps}
          min={1}
          max={15}
          step={1}
          onChange={(next) => onUpdateConfigField("targetFps", Math.round(next))}
        />
        <InspectorNumericScrubRow
          label="Max points in JSON"
          hint="Truncates exported landmark array length (4–33)."
          value={parsed.maxPoints}
          min={4}
          max={33}
          step={1}
          onChange={(next) => onUpdateConfigField("maxPoints", Math.round(next))}
        />
        <InspectorCompactToggleRow
          label="Draw skeleton overlay"
          hint="SVG BlazePose overlay on viewports (shares landmark cache with Vision Pose)."
          checked={parsed.drawSketchOverlay}
          onCheckedChange={(next) => onUpdateConfigField("drawSketchOverlay", next)}
        />
        <InspectorCompactToggleRow
          label="Draw 3D landmark debug"
          hint="BlazePose lines/points parented to the orbit camera in the Three.js scene (Stage / Model Viewer)."
          checked={parsed.drawLandmarks3d}
          onCheckedChange={(next) => onUpdateConfigField("drawLandmarks3d", next)}
        />
        <InspectorSelectRow
          label="Inference backend"
          description="Worker keeps lite pose inference off the main thread."
          ariaLabel="Landmarks debug inference backend"
          value={parsed.inferenceBackend}
          options={[
            { value: "worker", label: "Web worker" },
            { value: "main", label: "Main thread (CPU)" },
          ]}
          onChange={(next) =>
            onUpdateConfigField("inferenceBackend", next === "worker" ? "worker" : "main")
          }
        />
        <InspectorNumericScrubRow
          label="Min landmark visibility"
          value={parsed.minSketchVisibility}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => onUpdateConfigField("minSketchVisibility", next)}
        />
        <TRNHintText className="mt-1">
          Wire **json** to string displays or downstream logging nodes. Values are normalized x/y
          plus visibility in v.
        </TRNHintText>
      </InspectorCollapsibleSection>
    </div>
  );
}
