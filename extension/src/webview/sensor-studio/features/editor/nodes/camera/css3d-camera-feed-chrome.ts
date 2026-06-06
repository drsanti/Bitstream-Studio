import { useEffect, useState } from "react";
import { studioCameraRuntime } from "../../../../core/camera/studio-camera-runtime";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export function useCss3dFeedVisibleUi(nodeId: string): boolean {
  const wire = useFlowEditorStore(
    (s) => s.nodes.find((n) => n.id === nodeId)?.data.liveVideoBusWire,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      const node = useFlowEditorStore.getState().nodes.find((n) => n.id === nodeId);
      const bus = node?.data.liveVideoBusWire;
      if (bus == null) {
        setVisible(false);
        return;
      }
      const cfg = node?.data.defaultConfig as Record<string, unknown> | undefined;
      const visibleCfg =
        typeof node?.data.liveInputBooleanByHandle?.visible === "boolean"
          ? node.data.liveInputBooleanByHandle.visible
          : cfg?.visible !== false;
      const opacityRaw =
        typeof node?.data.liveInputNumberByHandle?.opacity === "number"
          ? node.data.liveInputNumberByHandle.opacity
          : typeof cfg?.opacity === "number"
            ? cfg.opacity
            : 1;
      const streamActive =
        studioCameraRuntime.getCameraUiState(bus.sourceNodeId).status === "active";
      setVisible(visibleCfg && streamActive && opacityRaw > 0);
    };
    sync();
    const t = window.setInterval(sync, 250);
    return () => window.clearInterval(t);
  }, [nodeId, wire?.sourceNodeId]);

  return visible;
}

export function resolveCss3dFeedHeaderBadge(visible: boolean): {
  label: string;
  tone: FlowNodeHeaderBadgeTone;
  pulseDot: boolean;
} {
  if (visible) {
    return { label: "On", tone: "live", pulseDot: false };
  }
  return { label: "Off", tone: "neutral", pulseDot: false };
}
