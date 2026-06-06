import { Video } from "lucide-react";
import { TRNHintText } from "../../../../../ui/TRN";
import { FlowNodeHeaderBadge } from "../../../../nodes/flow-node/FlowNodeHeaderBadge";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorSelectRow } from "../../InspectorDenseControls";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  cameraInputCardErrorLine,
  resolveCameraInputHeaderBadge,
  useCameraInputRuntimeUi,
} from "../../../../nodes/camera/camera-input-chrome";
import {
  resolveVideoTextureHeaderBadge,
  useVideoTextureReadyUi,
} from "../../../../nodes/camera/video-texture-chrome";

function readFiniteNumber(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function CameraInputSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const enabled = cfg.enabled === true;
  const deviceId = typeof cfg.deviceId === "string" ? cfg.deviceId : "default";
  const width = readFiniteNumber(cfg.width, 1280);
  const height = readFiniteNumber(cfg.height, 720);
  const targetFps = readFiniteNumber(cfg.targetFps, 30);
  const facingMode = cfg.facingMode === "environment" ? "environment" : "user";
  const mirrorPreview = cfg.mirrorPreview !== false;

  const runtime = useCameraInputRuntimeUi(selectedNode.id);
  const headerBadge = resolveCameraInputHeaderBadge(runtime, enabled);
  const errorLine = cameraInputCardErrorLine(runtime, enabled);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Capture"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Permission-gated webcam input. Wire Video to Video Texture or future vision nodes."
        defaultExpanded
      >
        {enabled ? (
          <div className="mb-1 rounded border border-zinc-700/60 bg-zinc-950/40 px-2 py-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {headerBadge != null ? (
                <FlowNodeHeaderBadge tone={headerBadge.tone} pulseDot={headerBadge.pulseDot}>
                  {headerBadge.label}
                </FlowNodeHeaderBadge>
              ) : (
                <span className="text-[10px] font-medium text-zinc-500">Off</span>
              )}
            </div>
            {errorLine != null ? (
              <p className="mt-1 text-[10px] leading-snug text-rose-200/85">{errorLine}</p>
            ) : null}
          </div>
        ) : null}
        <InspectorCompactToggleRow
          label="Enabled"
          hint="When enabled, the webview requests camera permission and starts the video stream."
          checked={enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <InspectorSelectRow
          label="Device"
          description="Device id string. Use default unless you need a specific camera."
          ariaLabel="Camera device id"
          value={deviceId}
          options={[{ value: "default", label: "Default" }]}
          onChange={(next) => onUpdateConfigField("deviceId", next)}
        />
        <InspectorSelectRow
          label="Facing"
          description="Prefer front (user) or rear (environment) camera when supported."
          ariaLabel="Camera facing mode"
          value={facingMode}
          options={[
            { value: "user", label: "Front (user)" },
            { value: "environment", label: "Rear (environment)" },
          ]}
          onChange={(next) => onUpdateConfigField("facingMode", next)}
        />
        <InspectorCompactToggleRow
          label="Mirror preview"
          hint="Horizontally flip the on-card preview only (3D texture is not mirrored)."
          checked={mirrorPreview}
          onCheckedChange={(next) => onUpdateConfigField("mirrorPreview", next)}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Stream"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Resolution and frame-rate hints passed to getUserMedia."
        defaultExpanded
      >
        <InspectorNumericScrubRow
          label="Width"
          value={width}
          min={160}
          max={3840}
          step={160}
          onChange={(next) => onUpdateConfigField("width", Math.round(next))}
        />
        <InspectorNumericScrubRow
          label="Height"
          value={height}
          min={120}
          max={2160}
          step={120}
          onChange={(next) => onUpdateConfigField("height", Math.round(next))}
        />
        <InspectorNumericScrubRow
          label="Target FPS"
          value={targetFps}
          min={1}
          max={60}
          step={1}
          onChange={(next) => onUpdateConfigField("targetFps", Math.round(next))}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

export function VideoTextureSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const flipY = cfg.flipY === true;
  const ready = useVideoTextureReadyUi(selectedNode.id);
  const badge = resolveVideoTextureHeaderBadge(ready);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Texture"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Converts a wired Video bus into a Three.js VideoTexture handle for material nodes."
        defaultExpanded
      >
        <div className="mb-1 flex items-center gap-2">
          <FlowNodeHeaderBadge tone={badge.tone} pulseDot={badge.pulseDot}>
            {badge.label}
          </FlowNodeHeaderBadge>
        </div>
        <TRNHintText>
          Wire **Camera Input → Video** into **In**. Downstream material nodes (Phase B) consume the
          **Texture** output.
        </TRNHintText>
        <InspectorCompactToggleRow
          label="Flip Y"
          hint="Matches Three.js UV orientation for some material setups."
          checked={flipY}
          onCheckedChange={(next) => onUpdateConfigField("flipY", next)}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}
