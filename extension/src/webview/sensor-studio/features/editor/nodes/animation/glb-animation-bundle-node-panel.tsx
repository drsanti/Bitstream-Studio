import { useMemo } from "react";
import { Clapperboard, Link2, Link2Off, Pause, Play } from "lucide-react";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import { useStudioGltfExtraction } from "../../gltf/useStudioGltfExtraction";
import { readStudioGlbAnimationPlaybackMode } from "../../gltf/studio-glb-animation-playback-mode";
import { resolveStudioSourceModelGlbUrl } from "../../model/model-generated-bindings";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { modelSelectEmitDisplayName } from "./model-select-emit-display-name";
import { resolveBundleModelRefForInspector } from "./resolve-bundle-model-ref-for-inspector";
import { isGlbBundleInspectorTransportActive } from "../../components/inspector/settings/sections/glb-bundle-inspector-session";

export type GlbAnimationBundleNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

function readClipSummary(dc: Record<string, unknown> | undefined): {
  configured: number;
  enabled: number;
} {
  const raw = dc?.clips;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { configured: 0, enabled: 0 };
  }
  const entries = Object.values(raw as Record<string, unknown>);
  let enabled = 0;
  for (const entry of entries) {
    if (entry == null || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const clip = entry as { enabled?: unknown };
    if (clip.enabled !== false) {
      enabled += 1;
    }
  }
  return { configured: entries.length, enabled };
}

function playbackModeChipLabel(
  mode: ReturnType<typeof readStudioGlbAnimationPlaybackMode>,
): string {
  if (mode === "sequence") {
    return "Sequence";
  }
  if (mode === "parallel-all") {
    return "Parallel";
  }
  return "Single";
}

function linkStatusCopy(
  status: ReturnType<typeof resolveBundleModelRefForInspector>["status"],
): { label: string; tone: "ok" | "warn" | "muted" } {
  if (status === "ok") {
    return { label: "Linked", tone: "ok" };
  }
  if (status === "viewer_no_model") {
    return { label: "No model on viewer", tone: "warn" };
  }
  return { label: "Wire to viewer", tone: "muted" };
}

/**
 * Compact flow canvas body for **GLB Animation Bundle** — connection, mode, transport, clip counts.
 * Full editing lives in the inspector **Animation** tab.
 */
export function GlbAnimationBundleNodePanel(props: GlbAnimationBundleNodePanelProps) {
  const { nodeId, defaultConfig: defaultConfigProp } = props;
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const { descriptors } = useStudioAssetDescriptors();

  const defaultConfig = useMemo(() => {
    const fromStore = nodes.find((n) => n.id === nodeId)?.data.defaultConfig;
    return (fromStore ?? defaultConfigProp) as Record<string, unknown>;
  }, [defaultConfigProp, nodeId, nodes]);

  const refStatus = useMemo(
    () => resolveBundleModelRefForInspector(nodes, edges, nodeId),
    [edges, nodeId, nodes],
  );

  const glbUrl = useMemo(() => {
    if (refStatus.status !== "ok") {
      return null;
    }
    return resolveStudioSourceModelGlbUrl(nodes, refStatus.modelFlowId);
  }, [nodes, refStatus]);

  const extraction = useStudioGltfExtraction(glbUrl);

  const playbackMode = readStudioGlbAnimationPlaybackMode(defaultConfig);
  const transportActive = isGlbBundleInspectorTransportActive(defaultConfig, playbackMode);
  const { configured, enabled } = readClipSummary(defaultConfig);

  const modelLine = useMemo(() => {
    if (refStatus.status !== "ok") {
      return null;
    }
    const modelNode = nodes.find((n) => n.id === refStatus.modelFlowId);
    const dc = modelNode?.data.defaultConfig as Record<string, unknown> | undefined;
    const emit = dc != null ? modelSelectEmitDisplayName(dc, descriptors) : "";
    if (emit.length > 0) {
      return emit;
    }
    const lab = modelNode?.data.label;
    return typeof lab === "string" && lab.trim().length > 0 ? lab.trim() : "Model";
  }, [descriptors, nodes, refStatus]);

  const glbClipCount =
    extraction.state === "ok" && extraction.result != null
      ? extraction.result.animations.length
      : null;

  const clipLine =
    glbClipCount != null
      ? `${enabled} enabled · ${glbClipCount} in GLB`
      : configured > 0
        ? `${enabled} enabled · ${configured} configured`
        : "No clips configured";

  const link = linkStatusCopy(refStatus.status);

  return (
    <ReadingPanel className="nodrag nopan mt-0 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={
            link.tone === "ok"
              ? "inline-flex items-center gap-1 rounded border border-emerald-800/50 bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-100/95"
              : link.tone === "warn"
                ? "inline-flex items-center gap-1 rounded border border-amber-800/45 bg-amber-950/35 px-1.5 py-0.5 text-[10px] font-medium text-amber-100/90"
                : "inline-flex items-center gap-1 rounded border border-zinc-700/70 bg-zinc-900/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400"
          }
        >
          {link.tone === "ok" ? (
            <Link2 className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
          ) : (
            <Link2Off className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
          )}
          {link.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-zinc-700/70 bg-zinc-900/55 px-1.5 py-0.5 text-[10px] font-medium text-zinc-200">
          <Clapperboard className="h-3 w-3 shrink-0 text-cyan-300/85" aria-hidden />
          {playbackModeChipLabel(playbackMode)}
        </span>
        <span
          className={
            transportActive
              ? "inline-flex items-center gap-1 rounded border border-cyan-800/45 bg-cyan-950/35 px-1.5 py-0.5 text-[10px] font-medium text-cyan-100/95"
              : "inline-flex items-center gap-1 rounded border border-zinc-700/70 bg-zinc-900/55 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400"
          }
        >
          {transportActive ? (
            <Play className="h-3 w-3 shrink-0" aria-hidden />
          ) : (
            <Pause className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
          )}
          {transportActive ? "Playing" : "Paused"}
        </span>
      </div>
      {modelLine != null ? (
        <div className="truncate text-[11px] font-semibold leading-snug text-zinc-100">{modelLine}</div>
      ) : (
        <div className="text-[10px] leading-snug text-zinc-500">
          Connect <span className="font-medium text-zinc-300">Animation</span> → Model Viewer → Model
          (URL).
        </div>
      )}
      <div className="text-[10px] tabular-nums text-zinc-500">{clipLine}</div>
    </ReadingPanel>
  );
}
