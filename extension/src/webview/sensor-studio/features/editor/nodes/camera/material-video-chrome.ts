import { useEffect, useState } from "react";
import { studioCameraRuntime } from "../../../../core/camera/studio-camera-runtime";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export function useMaterialVideoActiveUi(nodeId: string): boolean {
  const wire = useFlowEditorStore(
    (s) => s.nodes.find((n) => n.id === nodeId)?.data.liveVideoTextureWire,
  );
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => {
      const node = useFlowEditorStore.getState().nodes.find((n) => n.id === nodeId);
      const tex = node?.data.liveVideoTextureWire;
      if (tex == null) {
        setActive(false);
        return;
      }
      setActive(studioCameraRuntime.isVideoTextureReady(tex.sourceNodeId));
    };
    sync();
    const t = window.setInterval(sync, 250);
    return () => window.clearInterval(t);
  }, [nodeId, wire?.sourceNodeId]);

  return active;
}

export function resolveMaterialVideoHeaderBadge(active: boolean): {
  label: string;
  tone: FlowNodeHeaderBadgeTone;
  pulseDot: boolean;
} {
  if (active) {
    return { label: "Live", tone: "live", pulseDot: true };
  }
  return { label: "Idle", tone: "neutral", pulseDot: false };
}
