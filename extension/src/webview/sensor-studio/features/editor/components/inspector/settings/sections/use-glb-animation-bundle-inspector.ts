import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useStudioAssetDescriptors } from "../../../../../asset-browser/useStudioAssetDescriptors";
import { useStudioGltfExtraction } from "../../../../gltf/useStudioGltfExtraction";
import { readStudioGlbAnimationPlaybackMode } from "../../../../gltf/studio-glb-animation-playback-mode";
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
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  EMPTY_GLB_BUNDLE_INSPECTOR_SESSION,
  type GlbBundleInspectorSession,
  glbBundleInspectorSessionConfigPatch,
  useGlbBundleInspectorSessionStore,
} from "./glb-bundle-inspector-session";

const ANIMATION_CLIP_CARD_ORDER_KEY = "animationClipCardOrder" as const;
const ANIMATION_SOLO_CLIP_REF_KEY = "animationSoloClipRef" as const;

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

function advanceBundleClipTimeS(args: {
  clip: FlowWireAnimationClipV1;
  deltaS: number;
  durationS: number;
  forceOnce: boolean;
  pingPongDirRef: MutableRefObject<Map<string, 1 | -1>>;
  ref: string;
}): { timeS: number; finishedOnce: boolean } {
  const { clip, deltaS, durationS, forceOnce, pingPongDirRef, ref } = args;
  const mode: StudioGlbAnimationLoopModeV1 = forceOnce ? "once" : (clip.loopMode ?? "loop");
  if (mode === "pingpong" && !pingPongDirRef.current.has(ref)) {
    pingPongDirRef.current.set(ref, 1);
  }
  const dir = mode === "pingpong" ? (pingPongDirRef.current.get(ref) ?? 1) : 1;
  const speed = typeof clip.speed === "number" && Number.isFinite(clip.speed) ? clip.speed : 1;
  let t = clip.timeS + deltaS * speed * dir;
  const { trimStartS: start, trimEndS: end } = resolveFlowWireClipTrimRange(clip, durationS);
  let finishedOnce = false;

  if (mode === "once") {
    if (t >= end) {
      t = end;
      finishedOnce = true;
    } else if (t <= start) {
      t = start;
    }
  } else if (mode === "loop") {
    const span = Math.max(1e-6, end - start);
    t = start + ((t - start) % span + span) % span;
  } else if (t >= end) {
    t = end;
    pingPongDirRef.current.set(ref, -1);
  } else if (t <= start) {
    t = start;
    pingPongDirRef.current.set(ref, 1);
  }

  return { timeS: t, finishedOnce };
}

export type GlbAnimationBundleInspectorModel = {
  refStatus: ReturnType<typeof resolveBundleModelRefForInspector>;
  targetNodeLabel: string;
  connectedEmitName: string;
  targetStatsLine: string;
  showClipCards: boolean;
  clipIdsOrdered: readonly string[];
  clipMap: Record<string, unknown>;
  defaultConfig: Record<string, unknown> | undefined;
  durationByRef: ReadonlyMap<string, number>;
  labelByRef: ReadonlyMap<string, string>;
  playbackMode: ReturnType<typeof readStudioGlbAnimationPlaybackMode>;
  soloClipRef: string;
  playingRefs: readonly string[];
  blendPlaying: boolean;
  expandedClipIndices: readonly number[];
  commitClipPatch: (ref: string, patch: Partial<FlowWireAnimationClipV1>) => void;
  liveClipPatch: (ref: string, patch: Partial<FlowWireAnimationClipV1>) => void;
  setPlayingRefs: (next: readonly string[] | ((prev: readonly string[]) => readonly string[])) => void;
  setBlendPlaying: (playing: boolean) => void;
  setExpandedClipIndices: (
    next: readonly number[] | ((prev: readonly number[]) => readonly number[]),
  ) => void;
  pauseInspectorTransport: () => void;
  extractionState: ReturnType<typeof useStudioGltfExtraction>["state"];
};

export function useGlbAnimationBundleInspector(
  props: NodeInspectorSettingsSectionProps,
): GlbAnimationBundleInspectorModel {
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
      const d =
        typeof r.durationS === "number" && Number.isFinite(r.durationS) && r.durationS > 0
          ? r.durationS
          : 0;
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

  const defaultConfig = bundleFromStore?.data.defaultConfig as Record<string, unknown> | undefined;
  const clipMap = useMemo(() => readClipMap(defaultConfig), [defaultConfig]);

  const clipIdsOrdered = useMemo(() => {
    const canonical = animationRows.map((r) => r.ref);
    const raw = defaultConfig?.[ANIMATION_CLIP_CARD_ORDER_KEY];
    const stored = Array.isArray(raw)
      ? raw
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          .map((x) => x.trim())
      : undefined;
    return mergeAnimationClipCardOrder(stored, canonical);
  }, [animationRows, defaultConfig]);

  const soloClipRefRaw = defaultConfig?.[ANIMATION_SOLO_CLIP_REF_KEY];
  const soloClipRef =
    typeof soloClipRefRaw === "string" && soloClipRefRaw.trim().length > 0 ? soloClipRefRaw.trim() : "";

  const playbackMode = readStudioGlbAnimationPlaybackMode(defaultConfig);

  const nodeId = selectedNode.id;
  const ensureHydrated = useGlbBundleInspectorSessionStore((s) => s.ensureHydrated);
  const patchInspectorSession = useGlbBundleInspectorSessionStore((s) => s.patchSession);
  const playingRefs = useGlbBundleInspectorSessionStore(
    (s) =>
      s.byNodeId[nodeId]?.playingRefs ?? EMPTY_GLB_BUNDLE_INSPECTOR_SESSION.playingRefs,
  );
  const blendPlaying = useGlbBundleInspectorSessionStore(
    (s) => s.byNodeId[nodeId]?.blendPlaying ?? false,
  );
  const expandedClipIndices = useGlbBundleInspectorSessionStore(
    (s) =>
      s.byNodeId[nodeId]?.expandedClipIndices ??
      EMPTY_GLB_BUNDLE_INSPECTOR_SESSION.expandedClipIndices,
  );
  const sequenceActiveRef = useRef<string | null>(null);
  const pingPongDirRef = useRef<Map<string, 1 | -1>>(new Map());

  const persistInspectorSession = useCallback(
    (session: GlbBundleInspectorSession) => {
      useFlowEditorStore
        .getState()
        .applyNodeConfigFieldsLiveByNodeId(nodeId, glbBundleInspectorSessionConfigPatch(session));
    },
    [nodeId],
  );

  const setPlayingRefs = useCallback(
    (next: readonly string[] | ((prev: readonly string[]) => readonly string[])) => {
      const prev = useGlbBundleInspectorSessionStore.getState().getSession(nodeId);
      const resolved = typeof next === "function" ? next(prev.playingRefs) : next;
      const session = patchInspectorSession(nodeId, { playingRefs: resolved });
      persistInspectorSession(session);
    },
    [nodeId, patchInspectorSession, persistInspectorSession],
  );

  const setBlendPlaying = useCallback(
    (playing: boolean) => {
      const session = patchInspectorSession(nodeId, { blendPlaying: playing });
      persistInspectorSession(session);
    },
    [nodeId, patchInspectorSession, persistInspectorSession],
  );

  const setExpandedClipIndices = useCallback(
    (
      next: readonly number[] | ((prev: readonly number[]) => readonly number[]),
    ) => {
      const prev = useGlbBundleInspectorSessionStore.getState().getSession(nodeId).expandedClipIndices;
      const resolved = typeof next === "function" ? next(prev) : next;
      const normalized = [...new Set(resolved)].sort((a, b) => a - b);
      const session = patchInspectorSession(nodeId, { expandedClipIndices: normalized });
      persistInspectorSession(session);
    },
    [nodeId, patchInspectorSession, persistInspectorSession],
  );

  const pauseInspectorTransport = useCallback(() => {
    sequenceActiveRef.current = null;
    const session = patchInspectorSession(nodeId, {
      playingRefs: [],
      blendPlaying: false,
      sequenceActiveRef: null,
    });
    persistInspectorSession(session);
  }, [nodeId, patchInspectorSession, persistInspectorSession]);

  useEffect(() => {
    ensureHydrated(nodeId, defaultConfig);
  }, [defaultConfig, ensureHydrated, nodeId]);

  useEffect(() => {
    sequenceActiveRef.current =
      useGlbBundleInspectorSessionStore.getState().getSession(nodeId).sequenceActiveRef;
  }, [nodeId]);

  useEffect(() => {
    return () => {
      const session = patchInspectorSession(nodeId, { playingRefs: [], blendPlaying: false });
      persistInspectorSession(session);
    };
  }, [nodeId, patchInspectorSession, persistInspectorSession]);

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
    return `${r.animations.length} animation clip${r.animations.length === 1 ? "" : "s"} · ${r.parts.length} part${r.parts.length === 1 ? "" : "s"} · ${r.materials.length} material${r.materials.length === 1 ? "" : "s"} · ${r.morphs.length} morph${r.morphs.length === 1 ? "" : "s"} · ${r.lights.length} light${r.lights.length === 1 ? "" : "s"} · ${r.cameras.length} camera${r.cameras.length === 1 ? "" : "s"}`;
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
      const node = st.nodes.find((n) => n.id === nodeId);
      const dc = node?.data.defaultConfig as Record<string, unknown> | undefined;
      const next = mergeGlbBundleClipState(readClipMap(dc), ref, patch);
      void st.applyNodeConfigFieldsLiveByNodeId(nodeId, { clips: next });
    },
    [nodeId],
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
    if (blendPlaying && playbackMode === "sequence") {
      sequenceActiveRef.current = null;
      const session = patchInspectorSession(nodeId, { sequenceActiveRef: null });
      persistInspectorSession(session);
    }
    if (!blendPlaying) {
      sequenceActiveRef.current = null;
    }
  }, [blendPlaying, nodeId, patchInspectorSession, persistInspectorSession, playbackMode]);

  useEffect(() => {
    const soloPlaying = playingRefs.length > 0 && playbackMode === "per-clip";
    const blendRunning =
      blendPlaying && (playbackMode === "sequence" || playbackMode === "parallel-all");
    if (!soloPlaying && !blendRunning) {
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
        setBlendPlaying(false);
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

      if (soloPlaying) {
        for (const ref of playingRefs) {
          const c0 =
            clipsAcc[ref] ?? mergeGlbBundleClipState(rawClips as Record<string, unknown>, ref, {})[ref]!;
          if (c0.enabled === false) {
            continue;
          }
          const { timeS, finishedOnce } = advanceBundleClipTimeS({
            clip: c0,
            deltaS: delta,
            durationS: durationByRef.get(ref) ?? 0,
            forceOnce: false,
            pingPongDirRef,
            ref,
          });
          if (finishedOnce) {
            setPlayingRefs((prev) => prev.filter((x) => x !== ref));
          }
          clipsAcc[ref] = { ...c0, timeS, enabled: true };
        }
      } else if (playbackMode === "parallel-all") {
        for (const ref of clipIdsOrdered) {
          const c0 =
            clipsAcc[ref] ?? mergeGlbBundleClipState(rawClips as Record<string, unknown>, ref, {})[ref]!;
          if (c0.enabled === false) {
            continue;
          }
          const { timeS } = advanceBundleClipTimeS({
            clip: c0,
            deltaS: delta,
            durationS: durationByRef.get(ref) ?? 0,
            forceOnce: false,
            pingPongDirRef,
            ref,
          });
          clipsAcc[ref] = { ...c0, timeS, enabled: true };
        }
      } else {
        let active = sequenceActiveRef.current;
        if (active == null || !clipIdsOrdered.includes(active)) {
          active =
            clipIdsOrdered.find((ref) => {
              const c = clipsAcc[ref];
              return c != null && c.enabled !== false;
            }) ?? clipIdsOrdered[0] ?? null;
          sequenceActiveRef.current = active;
        }
        if (active != null) {
          const c0 =
            clipsAcc[active] ??
            mergeGlbBundleClipState(rawClips as Record<string, unknown>, active, {})[active]!;
          const { timeS, finishedOnce } = advanceBundleClipTimeS({
            clip: c0,
            deltaS: delta,
            durationS: durationByRef.get(active) ?? 0,
            forceOnce: true,
            pingPongDirRef,
            ref: active,
          });
          clipsAcc[active] = { ...c0, timeS, enabled: true, loopMode: "once" };
          if (finishedOnce) {
            const idx = clipIdsOrdered.indexOf(active);
            const next =
              idx >= 0 && idx + 1 < clipIdsOrdered.length ? clipIdsOrdered[idx + 1]! : null;
            sequenceActiveRef.current = next;
            const seqSession = patchInspectorSession(nodeId, { sequenceActiveRef: next });
            persistInspectorSession(seqSession);
            if (next == null) {
              setBlendPlaying(false);
            }
          }
        }
      }

      void st.applyNodeConfigFieldsLiveByNodeId(bundleId, { clips: clipsAcc });
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [
    blendPlaying,
    clipIdsOrdered,
    durationByRef,
    nodeId,
    patchInspectorSession,
    persistInspectorSession,
    playbackMode,
    playingRefs,
    selectedNode.id,
    setBlendPlaying,
    setPlayingRefs,
  ]);

  return {
    refStatus,
    targetNodeLabel,
    connectedEmitName,
    targetStatsLine,
    showClipCards,
    clipIdsOrdered,
    clipMap,
    defaultConfig,
    durationByRef,
    labelByRef,
    playbackMode,
    soloClipRef,
    playingRefs,
    blendPlaying,
    expandedClipIndices,
    commitClipPatch,
    liveClipPatch,
    setPlayingRefs,
    setBlendPlaying,
    setExpandedClipIndices,
    pauseInspectorTransport,
    extractionState: extraction.state,
  };
}
