import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRNHintText } from "../../../../../../../ui/TRN";
import { useStudioAssetDescriptors } from "../../../../../asset-browser/useStudioAssetDescriptors";
import { useStudioGltfExtraction } from "../../../../gltf/useStudioGltfExtraction";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { resolveStudioSourceModelGlbUrl } from "../../../../model/model-generated-bindings";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";
import { modelSelectEmitDisplayName } from "../../../../nodes/animation/model-select-emit-display-name";
import { resolveBundleModelRefForInspector } from "../../../../nodes/animation/resolve-bundle-model-ref-for-inspector";
import {
  mergeGlbBundleClipState,
  resolveFlowWireClipTrimRange,
  type FlowWireAnimationClipV1,
  type StudioGlbAnimationLoopModeV1,
} from "../../../../nodes/animation/flow-wire-animation";
import { readStudioGlbAnimationPlaybackMode } from "../../../../gltf/studio-glb-animation-playback-mode";
import { GlbBundleAnimationControlPanel } from "./GlbBundleAnimationControlPanel";

const ANIMATION_CLIP_CARD_ORDER_KEY = "animationClipCardOrder" as const;
const ANIMATION_SOLO_CLIP_REF_KEY = "animationSoloClipRef" as const;

/** Merge persisted clip card order with the current GLB clip list (drops stale refs, appends new). */
function mergeAnimationClipCardOrder(
  stored: readonly string[] | null | undefined,
  canonicalRefs: readonly string[],
): string[] {
  const canonSet = new Set(canonicalRefs);
  const out: string[] = [];
  const seen = new Set<string>();
  if (stored != null) {
    for (const id of stored) {
      if (typeof id !== "string" || id.trim().length === 0) {
        continue;
      }
      const t = id.trim();
      if (!canonSet.has(t) || seen.has(t)) {
        continue;
      }
      out.push(t);
      seen.add(t);
    }
  }
  for (const id of canonicalRefs) {
    if (!seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  return out;
}

function readClipMap(dc: Record<string, unknown> | undefined): Record<string, unknown> {
  const raw = dc?.clips;
  if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function GlbAnimationBundleSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const bundleFromStore = useFlowEditorStore((s) => s.nodes.find((n) => n.id === selectedNode.id));
  const { descriptors } = useStudioAssetDescriptors();

  const refStatus = useMemo(
    () => resolveBundleModelRefForInspector(nodes, edges, selectedNode.id),
    [nodes, edges, selectedNode.id],
  );

  const glbUrl = useMemo(() => {
    if (refStatus.status !== "ok") {
      return null;
    }
    return resolveStudioSourceModelGlbUrl(nodes, refStatus.modelFlowId);
  }, [nodes, refStatus]);

  const extraction = useStudioGltfExtraction(glbUrl);

  const animationRows = useMemo(
    () => (extraction.state === "ok" && extraction.result != null ? extraction.result.animations : []),
    [extraction.state, extraction.result],
  );

  const durationByRef = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of animationRows) {
      const d = typeof r.durationS === "number" && Number.isFinite(r.durationS) && r.durationS > 0 ? r.durationS : 0;
      m.set(r.ref, d);
    }
    return m;
  }, [animationRows]);

  const labelByRef = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of animationRows) {
      m.set(r.ref, r.label);
    }
    return m;
  }, [animationRows]);

  const clipIdsOrdered = useMemo(() => {
    const canonical = animationRows.map((r) => r.ref);
    const dc = bundleFromStore?.data.defaultConfig as Record<string, unknown> | undefined;
    const raw = dc?.[ANIMATION_CLIP_CARD_ORDER_KEY];
    const stored = Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim())
      : undefined;
    return mergeAnimationClipCardOrder(stored, canonical);
  }, [animationRows, bundleFromStore?.data.defaultConfig]);

  const defaultConfig = bundleFromStore?.data.defaultConfig as Record<string, unknown> | undefined;
  const clipMap = useMemo(() => readClipMap(defaultConfig), [defaultConfig]);

  const soloClipRefRaw = defaultConfig?.[ANIMATION_SOLO_CLIP_REF_KEY];
  const soloClipRef =
    typeof soloClipRefRaw === "string" && soloClipRefRaw.trim().length > 0 ? soloClipRefRaw.trim() : "";

  const playbackMode = readStudioGlbAnimationPlaybackMode(defaultConfig);

  const [playingRefs, setPlayingRefs] = useState<readonly string[]>([]);
  const pingPongDirRef = useRef<Map<string, 1 | -1>>(new Map());

  const targetNodeLabel = useMemo(() => {
    if (refStatus.status !== "ok") {
      return "";
    }
    const modelNode = nodes.find((n) => n.id === refStatus.modelFlowId);
    const lab = modelNode?.data.label;
    if (typeof lab === "string" && lab.trim().length > 0) {
      return lab.trim();
    }
    return "Model";
  }, [refStatus, nodes]);

  const connectedEmitName = useMemo(() => {
    if (refStatus.status !== "ok") {
      return "";
    }
    const modelNode = nodes.find((n) => n.id === refStatus.modelFlowId);
    const dc = modelNode?.data.defaultConfig as Record<string, unknown> | undefined;
    if (dc == null) {
      return "";
    }
    const fromEmit = modelSelectEmitDisplayName(dc, descriptors);
    if (fromEmit.length > 0) {
      return fromEmit;
    }
    return targetNodeLabel;
  }, [refStatus, nodes, descriptors, targetNodeLabel]);

  const targetStatsLine = useMemo(() => {
    if (refStatus.status !== "ok") {
      return "";
    }
    if (glbUrl == null || glbUrl.trim().length === 0) {
      return "No GLB URL on the Model node — pick a model in the Model node first.";
    }
    if (extraction.state === "loading") {
      return "Loading GLB metadata…";
    }
    if (extraction.state === "error") {
      return extraction.errorMessage ?? "Could not load GLB.";
    }
    if (extraction.state !== "ok" || extraction.result == null) {
      return "";
    }
    const r = extraction.result;
    const clips = r.animations.length;
    const parts = r.parts.length;
    const mats = r.materials.length;
    const morphs = r.morphs.length;
    const lights = r.lights.length;
    const cams = r.cameras.length;
    return `${clips} animation clip${clips === 1 ? "" : "s"} · ${parts} part${parts === 1 ? "" : "s"} · ${mats} material${mats === 1 ? "" : "s"} · ${morphs} morph${morphs === 1 ? "" : "s"} · ${lights} light${lights === 1 ? "" : "s"} · ${cams} camera${cams === 1 ? "" : "s"}`;
  }, [refStatus, glbUrl, extraction.state, extraction.result, extraction.errorMessage]);

  const showClipCards =
    refStatus.status === "ok" &&
    extraction.state === "ok" &&
    extraction.result != null &&
    clipIdsOrdered.length > 0;

  const commitClipPatch = useCallback(
    (ref: string, patch: Partial<FlowWireAnimationClipV1>) => {
      const dc = bundleFromStore?.data.defaultConfig as Record<string, unknown> | undefined;
      const next = mergeGlbBundleClipState(readClipMap(dc), ref, patch);
      void onUpdateConfigField("clips", next);
    },
    [bundleFromStore?.data.defaultConfig, onUpdateConfigField],
  );

  const liveClipPatch = useCallback(
    (ref: string, patch: Partial<FlowWireAnimationClipV1>) => {
      const st = useFlowEditorStore.getState();
      const node = st.nodes.find((n) => n.id === selectedNode.id);
      const dc = node?.data.defaultConfig as Record<string, unknown> | undefined;
      const next = mergeGlbBundleClipState(readClipMap(dc), ref, patch);
      void st.applySelectedNodeConfigFieldLive("clips", next);
    },
    [selectedNode.id],
  );

  useEffect(() => {
    if (!showClipCards || clipIdsOrdered.length === 0) {
      return;
    }
    const missing = clipIdsOrdered.filter((ref) => clipMap[ref] == null);
    if (missing.length === 0) {
      return;
    }
    let next = readClipMap(defaultConfig);
    for (const ref of missing) {
      next = mergeGlbBundleClipState(next, ref, { enabled: true });
    }
    void onUpdateConfigField("clips", next);
  }, [clipIdsOrdered, clipMap, defaultConfig, onUpdateConfigField, showClipCards]);

  useEffect(() => {
    if (playingRefs.length === 0 || playbackMode !== "per-clip") {
      return;
    }
    const bundleId = selectedNode.id;
    let raf = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const delta = Math.min(0.12, Math.max(0, (now - last) / 1000));
      last = now;
      const st = useFlowEditorStore.getState();
      const node = st.nodes.find((n) => n.id === bundleId);
      if (node?.data.nodeId !== "glb-animation-bundle") {
        setPlayingRefs([]);
        return;
      }
      const dc = node.data.defaultConfig as Record<string, unknown>;
      const rawClips = readClipMap(dc);
      const clipsAcc: Record<string, FlowWireAnimationClipV1> = {};
      for (const [k] of Object.entries(rawClips)) {
        const name = k.trim();
        if (name.length === 0) {
          continue;
        }
        clipsAcc[name] = mergeGlbBundleClipState(rawClips as Record<string, unknown>, name, {})[name]!;
      }
      for (const ref of playingRefs) {
        const c0 = clipsAcc[ref] ?? mergeGlbBundleClipState(rawClips as Record<string, unknown>, ref, {})[ref]!;
        if (c0.enabled === false) {
          continue;
        }
        const mode: StudioGlbAnimationLoopModeV1 = c0.loopMode ?? "loop";
        if (mode === "pingpong" && !pingPongDirRef.current.has(ref)) {
          pingPongDirRef.current.set(ref, 1);
        }
        const dir = mode === "pingpong" ? (pingPongDirRef.current.get(ref) ?? 1) : 1;
        const speed = typeof c0.speed === "number" && Number.isFinite(c0.speed) ? c0.speed : 1;
        let t = c0.timeS + delta * speed * dir;
        const dur = durationByRef.get(ref) ?? 0;
        const { trimStartS: start, trimEndS: end } = resolveFlowWireClipTrimRange(c0, dur);
        const span = Math.max(1e-6, end - start);

        if (mode === "once") {
          if (t >= end) {
            t = end;
            setPlayingRefs((prev) => prev.filter((x) => x !== ref));
          } else if (t <= start) {
            t = start;
          }
        } else if (mode === "loop") {
          t = start + ((t - start) % span + span) % span;
        } else {
          if (t >= end) {
            t = end;
            pingPongDirRef.current.set(ref, -1);
          } else if (t <= start) {
            t = start;
            pingPongDirRef.current.set(ref, 1);
          }
        }

        clipsAcc[ref] = { ...c0, timeS: t, enabled: true };
      }

      void st.applySelectedNodeConfigFieldLive("clips", clipsAcc);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [playingRefs, selectedNode.id, durationByRef, playbackMode]);

  return (
    <InspectorSettingsSectionFrame title="Target" fillAvailableHeight={refStatus.status === "ok"}>
      {refStatus.status === "ok" ? (
        <>
          <div className="shrink-0 rounded-md border border-emerald-900/35 bg-emerald-950/20 px-2.5 py-2 text-[11px] leading-snug text-emerald-50/95">
            <div className="text-sm font-medium text-emerald-100/95">{targetNodeLabel}</div>
            <div className="mt-0.5 text-base font-semibold tracking-tight text-emerald-50">{connectedEmitName}</div>
            <div
              className={
                extraction.state === "error"
                  ? "mt-1 text-[10px] text-red-300/95"
                  : "mt-1 text-[10px] text-emerald-200/75"
              }
            >
              {targetStatsLine}
            </div>
          </div>

          {showClipCards ? (
            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              <GlbBundleAnimationControlPanel
              clipIdsOrdered={clipIdsOrdered}
              clipMap={clipMap}
              defaultConfig={defaultConfig}
              durationByRef={durationByRef}
              labelByRef={labelByRef}
              playbackMode={playbackMode}
              soloClipRef={soloClipRef}
              playingRefs={playingRefs}
              onUpdateConfigField={onUpdateConfigField}
              onCommitClipPatch={commitClipPatch}
              onLiveClipPatch={liveClipPatch}
              onSetPlayingRefs={setPlayingRefs}
            />
            </div>
          ) : refStatus.status === "ok" &&
            extraction.state === "ok" &&
            extraction.result != null &&
            clipIdsOrdered.length === 0 ? (
            <TRNHintText className="shrink-0 text-[10px]" tone="info">
              This GLB has no animation clips to list.
            </TRNHintText>
          ) : null}
        </>
      ) : refStatus.status === "viewer_no_model" ? (
        <TRNHintText tone="warn">
          Animation output reaches a Model Viewer, but that viewer has no Model wired to{" "}
          <span className="font-mono">Model (URL)</span>. Wire your Model node into the viewer first.
        </TRNHintText>
      ) : (
        <TRNHintText tone="info">
          Connect this node&apos;s <span className="font-semibold">Animation</span> output into a{" "}
          <span className="font-semibold">Model Viewer</span>&apos;s <span className="font-semibold">Animation</span>{" "}
          input. When the viewer already receives a Model URL, the model name appears here.
        </TRNHintText>
      )}
    </InspectorSettingsSectionFrame>
  );
}
