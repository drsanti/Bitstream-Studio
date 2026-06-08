import { Video } from "lucide-react";
import { useState } from "react";
import { TRNHintText, TRNSelect } from "../../../../../../../ui/TRN";
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
import {
  materialTextureSlotLabel,
  readGlbMaterialTextureSlot,
  STUDIO_GLB_MATERIAL_TEXTURE_SLOT_KEY,
  STUDIO_GLB_MATERIAL_TEXTURE_SLOTS,
  type StudioGlbMaterialTextureSlotV1,
} from "../../../../gltf/studio-glb-material-texture";
import { readGlbExtractTag } from "../../../../model/model-generated-bindings";
import { useMaterialVideoActiveUi } from "../../../../nodes/camera/material-video-chrome";
import { useCss3dFeedVisibleUi } from "../../../../nodes/camera/css3d-camera-feed-chrome";
import { useVisionPoseUi, formatVisionPoseLoadLabel } from "../../../../nodes/camera/vision-pose-chrome";
import {
  readVisionPoseConfig,
  resolveVisionPoseTargetFps,
  type VisionPoseInferenceBackend,
  type VisionPoseModelVariant,
  type VisionPoseQualityPreset,
} from "../../../../../../core/camera/vision-pose-config";
import {
  getVisionMediapipeEndpoints,
  isPreferBundledMediapipeEnabled,
  resetVisionMediapipeEndpoints,
  setPreferBundledMediapipeEnabled,
  setVisionMediapipeEndpoints,
  visionMediapipeEndpointsStorageKey,
} from "../../../../../../core/camera/vision-mediapipe-endpoints";
import { TRNButton } from "../../../../../../../ui/TRN";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { VisionMediapipePackMissingChip } from "./VisionMediapipePackMissingChip";

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

export function MaterialVideoSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const slot = readGlbMaterialTextureSlot(cfg);
  const blend = readFiniteNumber(cfg.blend, 1);
  const toneMapped = cfg.toneMapped === true;
  const glbTag = readGlbExtractTag(cfg);
  const active = useMaterialVideoActiveUi(selectedNode.id);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Material map"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Applies a wired Video Texture to a named GLB material slot in linked Model Viewer previews."
        defaultExpanded
      >
        {glbTag?.kind === "material" ? (
          <TRNHintText className="mb-1 text-[11px]">
            Target material: **{glbTag.ref}**
          </TRNHintText>
        ) : (
          <TRNHintText className="mb-1 text-[11px]">
            Spawn from Library **Model → Materials** with a Model Source selected, or bind a material
            extract manually.
          </TRNHintText>
        )}
        <div className="mb-1 flex items-center gap-2">
          <FlowNodeHeaderBadge tone={active ? "live" : "neutral"} pulseDot={active}>
            {active ? "Live" : "Idle"}
          </FlowNodeHeaderBadge>
        </div>
        <InspectorPropertyRow
          label="Map slot"
          description="Which material map receives the live camera texture."
        >
          <TRNSelect
            value={slot}
            options={STUDIO_GLB_MATERIAL_TEXTURE_SLOTS.map((s) => ({
              value: s,
              label: materialTextureSlotLabel(s),
            }))}
            ariaLabel="Material video map slot"
            size="sm"
            onValueChange={(next) =>
              onUpdateConfigField(
                STUDIO_GLB_MATERIAL_TEXTURE_SLOT_KEY,
                next as StudioGlbMaterialTextureSlotV1,
              )
            }
          />
        </InspectorPropertyRow>
        <InspectorNumericScrubRow
          label="Blend / gain"
          hint="Effective drive strength when Gain input is unwired (0–1)."
          value={blend}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => onUpdateConfigField("blend", next)}
        />
        <InspectorCompactToggleRow
          label="Tone mapped"
          hint="Sets material.toneMapped while the live video map is active."
          checked={toneMapped}
          onCheckedChange={(next) => onUpdateConfigField("toneMapped", next)}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

export function Css3dCameraFeedSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const anchorMode = cfg.anchorMode === "world" ? "world" : "screen";
  const anchor = (cfg.anchor as Record<string, unknown> | undefined) ?? {};
  const sizePx = (cfg.sizePx as Record<string, unknown> | undefined) ?? {};
  const opacity = readFiniteNumber(cfg.opacity, 1);
  const borderRadiusPx = readFiniteNumber(cfg.borderRadiusPx, 8);
  const visible = useCss3dFeedVisibleUi(selectedNode.id);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Overlay"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Screen = viewport HUD panel. World = CSS3D panel synced with the scene camera."
        defaultExpanded
      >
        <div className="mb-1 flex items-center gap-2">
          <FlowNodeHeaderBadge tone={visible ? "live" : "neutral"} pulseDot={false}>
            {visible ? "Visible" : "Hidden"}
          </FlowNodeHeaderBadge>
        </div>
        <InspectorCompactToggleRow
          label="Visible"
          hint="Default visibility when the Visible input pin is unwired."
          checked={cfg.visible !== false}
          onCheckedChange={(next) => onUpdateConfigField("visible", next)}
        />
        <InspectorSelectRow
          label="Anchor mode"
          description="Screen uses normalized viewport coordinates; world uses scene units."
          ariaLabel="CSS3D anchor mode"
          value={anchorMode}
          options={[
            { value: "screen", label: "Screen (HUD)" },
            { value: "world", label: "World (CSS3D)" },
          ]}
          onChange={(next) => onUpdateConfigField("anchorMode", next)}
        />
        <InspectorNumericScrubRow
          label="Opacity"
          value={opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => onUpdateConfigField("opacity", next)}
        />
        <InspectorNumericScrubRow
          label="Width (px)"
          value={readFiniteNumber(sizePx.w, 320)}
          min={64}
          max={1920}
          step={8}
          onChange={(next) =>
            onUpdateConfigField("sizePx", {
              ...sizePx,
              w: Math.round(next),
              h: readFiniteNumber(sizePx.h, 180),
            })
          }
        />
        <InspectorNumericScrubRow
          label="Height (px)"
          value={readFiniteNumber(sizePx.h, 180)}
          min={48}
          max={1080}
          step={8}
          onChange={(next) =>
            onUpdateConfigField("sizePx", {
              ...sizePx,
              w: readFiniteNumber(sizePx.w, 320),
              h: Math.round(next),
            })
          }
        />
        <InspectorNumericScrubRow
          label="Anchor X"
          hint={anchorMode === "screen" ? "0–1 viewport fraction (0.85 ≈ right edge)." : "World X"}
          value={readFiniteNumber(anchor.x, anchorMode === "screen" ? 0.85 : 0)}
          min={anchorMode === "screen" ? 0 : -50}
          max={anchorMode === "screen" ? 1 : 50}
          step={anchorMode === "screen" ? 0.01 : 0.1}
          onChange={(next) =>
            onUpdateConfigField("anchor", {
              ...anchor,
              x: next,
              y: readFiniteNumber(anchor.y, anchorMode === "screen" ? 0.15 : 0),
              z: readFiniteNumber(anchor.z, 0),
            })
          }
        />
        <InspectorNumericScrubRow
          label="Anchor Y"
          hint={anchorMode === "screen" ? "0–1 viewport fraction (0.15 ≈ top band)." : "World Y"}
          value={readFiniteNumber(anchor.y, anchorMode === "screen" ? 0.15 : 0)}
          min={anchorMode === "screen" ? 0 : -50}
          max={anchorMode === "screen" ? 1 : 50}
          step={anchorMode === "screen" ? 0.01 : 0.1}
          onChange={(next) =>
            onUpdateConfigField("anchor", {
              ...anchor,
              x: readFiniteNumber(anchor.x, anchorMode === "screen" ? 0.85 : 0),
              y: next,
              z: readFiniteNumber(anchor.z, 0),
            })
          }
        />
        {anchorMode === "world" ? (
          <InspectorNumericScrubRow
            label="Anchor Z"
            value={readFiniteNumber(anchor.z, 0)}
            min={-50}
            max={50}
            step={0.1}
            onChange={(next) =>
              onUpdateConfigField("anchor", {
                ...anchor,
                x: readFiniteNumber(anchor.x, 0),
                y: readFiniteNumber(anchor.y, 0),
                z: next,
              })
            }
          />
        ) : null}
        <InspectorNumericScrubRow
          label="Corner radius (px)"
          value={borderRadiusPx}
          min={0}
          max={64}
          step={1}
          onChange={(next) => onUpdateConfigField("borderRadiusPx", Math.round(next))}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

export function VisionPoseSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig as Record<string, unknown>;
  const parsed = readVisionPoseConfig(cfg);
  const ui = useVisionPoseUi(selectedNode.id);
  const loadLabel = formatVisionPoseLoadLabel({
    status: ui.status,
    loadProgressPercent: ui.loadProgressPercent,
  });
  const [preferBundled, setPreferBundled] = useState(() => isPreferBundledMediapipeEnabled());

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Inference"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="MediaPipe Pose Landmarker runs in the webview (GPU when available). Requires network for WASM + model on first load."
        defaultExpanded
      >
        <VisionMediapipePackMissingChip catalogNodeId="vision-pose" config={cfg} />
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
                  ? loadLabel
                  : "Idle"}
          </FlowNodeHeaderBadge>
        </div>
        {ui.status === "loading" && ui.loadProgressPercent != null ? (
          <div className="mb-2 h-1 overflow-hidden rounded bg-zinc-800/90">
            <div
              className="h-full bg-emerald-400/85 transition-[width] duration-150 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, ui.loadProgressPercent))}%` }}
            />
          </div>
        ) : null}
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
          description="Sets default inference FPS cap (Low 8 / Med 15 / High 24)."
          ariaLabel="Vision pose quality preset"
          value={parsed.qualityPreset}
          options={[
            { value: "low", label: "Low (8 fps)" },
            { value: "med", label: "Medium (15 fps)" },
            { value: "high", label: "High (24 fps)" },
          ]}
          onChange={(next) => {
            onUpdateConfigField("qualityPreset", next as VisionPoseQualityPreset);
            onUpdateConfigField(
              "targetFps",
              resolveVisionPoseTargetFps(next as VisionPoseQualityPreset),
            );
          }}
        />
        <InspectorSelectRow
          label="Model"
          description="Lite is fastest; Heavy is most accurate."
          ariaLabel="Vision pose model variant"
          value={parsed.modelVariant}
          options={[
            { value: "lite", label: "Lite" },
            { value: "full", label: "Full" },
            { value: "heavy", label: "Heavy" },
          ]}
          onChange={(next) =>
            onUpdateConfigField("modelVariant", next as VisionPoseModelVariant)
          }
        />
        <InspectorNumericScrubRow
          label="Target FPS"
          hint="Hard cap for inference scheduling (independent of camera FPS)."
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
        <InspectorNumericScrubRow
          label="Min tracking"
          value={parsed.minTrackingConfidence}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => onUpdateConfigField("minTrackingConfidence", next)}
        />
        <InspectorSelectRow
          label="Inference backend"
          description="Worker runs MediaPipe off the main thread (classic worker + GPU). Falls back to main-thread CPU if worker init fails."
          ariaLabel="Vision pose inference backend"
          value={parsed.inferenceBackend}
          options={[
            { value: "worker", label: "Web worker (recommended)" },
            { value: "main", label: "Main thread (canvas copy, CPU)" },
          ]}
          onChange={(next) =>
            onUpdateConfigField("inferenceBackend", next as VisionPoseInferenceBackend)
          }
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Skeleton overlay"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Draws a 2D BlazePose skeleton over the viewport when a Video bus is wired."
        defaultExpanded={false}
      >
        <InspectorCompactToggleRow
          label="Draw skeleton overlay"
          hint="SVG overlay on Stage / Model Viewer / rotation preview viewports."
          checked={parsed.drawSketchOverlay}
          onCheckedChange={(next) => onUpdateConfigField("drawSketchOverlay", next)}
        />
        <InspectorCompactToggleRow
          label="Draw 3D landmark debug"
          hint="BlazePose skeleton parented to the orbit camera in the Three.js scene."
          checked={parsed.drawLandmarks3d}
          onCheckedChange={(next) => onUpdateConfigField("drawLandmarks3d", next)}
        />
        <InspectorNumericScrubRow
          label="Min landmark visibility"
          hint="Landmarks below this visibility are hidden in the overlay."
          value={parsed.minSketchVisibility}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => onUpdateConfigField("minSketchVisibility", next)}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Events"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Wire **Trigger** to event consumers (Toggle Boolean, Play Animation, etc.)."
        defaultExpanded={false}
      >
        <InspectorCompactToggleRow
          label="Trigger on enter"
          hint="Pulse **Trigger** when a body is first detected."
          checked={parsed.triggerOnEnter}
          onCheckedChange={(next) => onUpdateConfigField("triggerOnEnter", next)}
        />
        <InspectorCompactToggleRow
          label="Trigger on exit"
          hint="Pulse **Trigger** when detection is lost."
          checked={parsed.triggerOnExit}
          onCheckedChange={(next) => onUpdateConfigField("triggerOnExit", next)}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Model CDN (advanced)"
        icon={<Video className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Override MediaPipe WASM/model URLs for air-gapped hosts. Reload the webview after changing."
        defaultExpanded={false}
      >
        <TRNHintText className="mb-2">
          Dev loads from{" "}
          <span className="text-zinc-300">/__extension_src_assets/vision/mediapipe/</span>; VSIX uses{" "}
          <span className="text-zinc-300">LOCAL_ASSETS_BASE_URI/vision/mediapipe/</span> (bundled
          under <span className="text-zinc-300">out/webview/assets/</span>). Run{" "}
          <span className="text-zinc-300">npm run vision:copy-mediapipe</span> once, then restart{" "}
          <span className="text-zinc-300">dev:webview</span>. Toggle off to use CDN.
        </TRNHintText>
        <InspectorCompactToggleRow
          label="Prefer bundled models"
          hint="Local WASM + .task from extension/src/assets/vision/mediapipe (see README)."
          checked={preferBundled}
          onCheckedChange={(next) => {
            setPreferBundled(next);
            setPreferBundledMediapipeEnabled(next);
            if (next && typeof localStorage !== "undefined") {
              localStorage.removeItem(visionMediapipeEndpointsStorageKey());
            }
          }}
        />
        <InspectorPropertyRow label="WASM base">
          <input
            className="w-full rounded border border-zinc-700/80 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-200 disabled:opacity-50"
            defaultValue={getVisionMediapipeEndpoints().wasmBase}
            disabled={preferBundled}
            onBlur={(e) => {
              if (preferBundled) {
                return;
              }
              const next = e.currentTarget.value.trim();
              if (next.length > 0) {
                setVisionMediapipeEndpoints({ wasmBase: next });
              }
            }}
          />
        </InspectorPropertyRow>
        <TRNButton
          className="mt-2 h-7 border border-zinc-600/80 bg-zinc-800/80 px-3 text-[11px] text-zinc-200"
          onClick={() => {
            resetVisionMediapipeEndpoints();
            setPreferBundled(true);
            setPreferBundledMediapipeEnabled(true);
            window.location.reload();
          }}
        >
          Reset CDN defaults
        </TRNButton>
      </InspectorCollapsibleSection>
    </div>
  );
}
