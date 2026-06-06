import { useRef, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { studioCameraRuntime } from "../../../../core/camera/studio-camera-runtime";
import { TRNToggleSwitch } from "../../../../../ui/TRN";
import { FlowNodeIntrinsicWidthMarker } from "../flow-node/FlowNodeIntrinsicWidthMarker";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { ReadingLabel } from "../flow-node/readings/ReadingLabel";
import { FLOW_NODE_BODY_PANEL_CLASS } from "../flow-node/flow-node-intrinsic-width-utils";
import {
  cameraInputCardErrorLine,
  useCameraInputRuntimeUi,
} from "./camera-input-chrome";
import { useVideoTextureReadyUi } from "./video-texture-chrome";

function readBool(dc: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = dc[key];
  return typeof v === "boolean" ? v : fallback;
}

function CameraPreviewVideo(props: {
  nodeId: string;
  enabled: boolean;
  mirrorPreview: boolean;
}) {
  const { nodeId, enabled, mirrorPreview } = props;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el == null || !enabled) {
      if (el != null) {
        el.srcObject = null;
      }
      return;
    }

    const sync = () => {
      const target = videoRef.current;
      const source = studioCameraRuntime.getVideoElement(nodeId);
      if (target == null) {
        return;
      }
      if (source == null) {
        target.srcObject = null;
        return;
      }
      if (target.srcObject !== source.srcObject) {
        target.srcObject = source.srcObject;
      }
      void target.play().catch(() => undefined);
    };

    sync();
    const t = window.setInterval(sync, 250);
    return () => window.clearInterval(t);
  }, [nodeId, enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      className="max-h-28 w-full rounded border border-zinc-700/70 bg-black object-contain"
      style={mirrorPreview ? { transform: "scaleX(-1)" } : undefined}
      muted
      playsInline
      autoPlay
    />
  );
}

export function CameraInputNodePanel(props: {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
}) {
  const { nodeId, defaultConfig } = props;
  const enabled = readBool(defaultConfig, "enabled", false);
  const mirrorPreview = readBool(defaultConfig, "mirrorPreview", true);
  const update = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const runtime = useCameraInputRuntimeUi(nodeId);
  const errorLine = cameraInputCardErrorLine(runtime, enabled);

  return (
    <div
      className={twMerge(
        "nodrag nopan space-y-1.5 border-t border-zinc-800/55 px-2.5 py-2",
        FLOW_NODE_BODY_PANEL_CLASS,
      )}
      data-flow-node-body-panel
    >
      <FlowNodeIntrinsicWidthMarker labels={["Capture"]} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Capture
        </span>
        <TRNToggleSwitch
          checked={enabled}
          ariaLabel="Enable camera capture"
          onCheckedChange={(next) => update(nodeId, "enabled", next)}
        />
      </div>
      {errorLine != null ? (
        <div className="text-[10px] leading-snug text-rose-200/85">{errorLine}</div>
      ) : null}
      <CameraPreviewVideo nodeId={nodeId} enabled={enabled} mirrorPreview={mirrorPreview} />
    </div>
  );
}

export function VideoTextureNodePanel(props: { nodeId: string }) {
  const { nodeId } = props;
  const ready = useVideoTextureReadyUi(nodeId);

  return (
    <ReadingPanel className="space-y-1">
      <ReadingLabel className="mb-0.5 block">Texture</ReadingLabel>
      <div className="text-[11px] text-zinc-300">
        {ready ? "Video texture ready for scene wiring." : "Waiting for camera feed…"}
      </div>
    </ReadingPanel>
  );
}
