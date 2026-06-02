import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GlbPreviewUserTransport } from "../../../sensor-studio/features/editor/gltf/glb-preview-user-transport.js";
import {
  readAnimationLabMixerEngine,
  readAnimationLabPlaybackMode,
  readAnimationLabSoloCrossFadeS,
  persistAnimationLabMixerEngine,
  persistAnimationLabPlaybackMode,
  persistAnimationLabSoloCrossFadeS,
} from "./animation-lab-persistence.js";
import {
  normalizeAnimationLabCatalogHints,
  resolveAnimationLabCatalogHints,
} from "./animation-lab-catalog-hints.js";
import { applyAnimationLabCatalogHints } from "./apply-animation-lab-catalog-hints.js";
import {
  DEFAULT_ANIMATION_LAB_CLIP_SETTINGS,
  EMPTY_GLB_ANIMATION_LAB_LIVE_PLAYBACK,
  EMPTY_GLB_ANIMATION_LAB_RUNTIME,
  type AnimationLabCatalogHints,
  type GlbAnimationLabClipSettings,
  type GlbAnimationLabContextValue,
  type GlbAnimationLabLivePlayback,
  type GlbAnimationLabMixerEngine,
  type GlbAnimationLabPlaybackMode,
  type GlbAnimationLabRuntimeReport,
} from "./glb-animation-lab.types.js";

const GlbAnimationLabContext = createContext<GlbAnimationLabContextValue | null>(null);

let sequenceActiveClipListener: ((name: string | null) => void) | null = null;
let livePlaybackListener: ((live: GlbAnimationLabLivePlayback) => void) | null = null;

export function notifyAnimationLabSequenceActiveClip(name: string | null): void {
  sequenceActiveClipListener?.(name);
}

export function notifyAnimationLabLivePlayback(live: GlbAnimationLabLivePlayback): void {
  livePlaybackListener?.(live);
}

export function GlbAnimationLabProvider(props: {
  children: ReactNode;
  fetchUrl: string;
  modelLabel: string;
  dedupeKey: string;
}) {
  const [mixerEngine, setMixerEngineState] = useState<GlbAnimationLabMixerEngine>(
    () => readAnimationLabMixerEngine(),
  );
  const [playbackMode, setPlaybackModeState] = useState<GlbAnimationLabPlaybackMode>(
    () => readAnimationLabPlaybackMode(),
  );
  const [clipOrder, setClipOrder] = useState<string[]>([]);
  const [activeClipName, setActiveClipName] = useState<string | null>(null);
  const [sequenceActiveClipName, setSequenceActiveClipName] = useState<string | null>(null);
  const [clipSettings, setClipSettings] = useState<Record<string, GlbAnimationLabClipSettings>>(
    {},
  );
  const [soloCrossFadeS, setSoloCrossFadeSState] = useState(() => readAnimationLabSoloCrossFadeS());
  const [transport, setTransport] = useState<GlbPreviewUserTransport>("stopped");
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTimeS, setScrubTimeS] = useState(0);
  const [runtime, setRuntime] = useState<GlbAnimationLabRuntimeReport>(EMPTY_GLB_ANIMATION_LAB_RUNTIME);
  const [activeClipRestartNonce, setActiveClipRestartNonce] = useState(0);
  const [livePlayback, setLivePlayback] = useState<GlbAnimationLabLivePlayback>(
    EMPTY_GLB_ANIMATION_LAB_LIVE_PLAYBACK,
  );
  const [catalogHintsApplied, setCatalogHintsApplied] = useState<AnimationLabCatalogHints | null>(
    null,
  );
  const catalogHintsAppliedKeyRef = useRef("");

  useEffect(() => {
    sequenceActiveClipListener = setSequenceActiveClipName;
    livePlaybackListener = setLivePlayback;
    return () => {
      sequenceActiveClipListener = null;
      livePlaybackListener = null;
    };
  }, []);

  const setMixerEngine = useCallback((engine: GlbAnimationLabMixerEngine) => {
    setMixerEngineState(engine);
    persistAnimationLabMixerEngine(engine);
  }, []);

  const setPlaybackMode = useCallback((mode: GlbAnimationLabPlaybackMode) => {
    setPlaybackModeState(mode);
    persistAnimationLabPlaybackMode(mode);
    setSequenceActiveClipName(null);
  }, []);

  const setSoloCrossFadeS = useCallback((seconds: number) => {
    const clamped = Math.min(2, Math.max(0, seconds));
    setSoloCrossFadeSState(clamped);
    persistAnimationLabSoloCrossFadeS(clamped);
  }, []);

  const setActiveClipNameWithCrossFade = useCallback((name: string | null) => {
    setActiveClipName((prev) => {
      if (prev !== name && name != null) {
        setActiveClipRestartNonce((n) => n + 1);
      }
      return name;
    });
  }, []);

  useEffect(() => {
    setClipOrder([]);
    setActiveClipName(null);
    setSequenceActiveClipName(null);
    setClipSettings({});
    setTransport("stopped");
    setIsScrubbing(false);
    setScrubTimeS(0);
    setRuntime(EMPTY_GLB_ANIMATION_LAB_RUNTIME);
    setActiveClipRestartNonce(0);
    setLivePlayback(EMPTY_GLB_ANIMATION_LAB_LIVE_PLAYBACK);
    setCatalogHintsApplied(null);
    catalogHintsAppliedKeyRef.current = "";
  }, [props.fetchUrl]);

  useEffect(() => {
    const names = runtime.clipNames;
    setClipOrder((prev) => {
      const kept = prev.filter((n) => names.includes(n));
      const added = names.filter((n) => !kept.includes(n));
      return [...kept, ...added];
    });
    setClipSettings((prev) => {
      const next = { ...prev };
      for (const name of names) {
        if (next[name] == null) {
          next[name] = { ...DEFAULT_ANIMATION_LAB_CLIP_SETTINGS };
        }
      }
      return next;
    });
  }, [runtime.clipNames]);

  useEffect(() => {
    if (runtime.boundActionCount === 0 || runtime.clipNames.length === 0) {
      return;
    }
    const applyKey = `${props.fetchUrl}::${props.dedupeKey}`;
    if (catalogHintsAppliedKeyRef.current === applyKey) {
      return;
    }
    catalogHintsAppliedKeyRef.current = applyKey;
    const raw = resolveAnimationLabCatalogHints(props.dedupeKey);
    if (raw != null) {
      const normalized = normalizeAnimationLabCatalogHints(raw, runtime.clipNames);
      applyAnimationLabCatalogHints({
        hints: normalized,
        clipNames: runtime.clipNames,
        setPlaybackMode,
        setActiveClipName: setActiveClipNameWithCrossFade,
        setClipOrder,
      });
      if (normalized.recommendedPlaybackMode == null) {
        setPlaybackMode("parallel-all");
      }
      setCatalogHintsApplied(normalized);
    } else {
      setCatalogHintsApplied(null);
      setPlaybackMode("parallel-all");
    }
    setIsScrubbing(false);
    setScrubTimeS(0);
    setTransport("playing");
  }, [
    props.dedupeKey,
    props.fetchUrl,
    runtime.boundActionCount,
    runtime.clipNames,
    setActiveClipNameWithCrossFade,
    setPlaybackMode,
  ]);

  useEffect(() => {
    if (activeClipName != null && runtime.clipNames.includes(activeClipName)) {
      return;
    }
    setActiveClipName(runtime.clipNames[0] ?? null);
  }, [activeClipName, runtime.clipNames]);

  useEffect(() => {
    if (transport === "stopped") {
      setSequenceActiveClipName(null);
    }
  }, [transport]);

  const moveClipInOrder = useCallback((name: string, direction: "up" | "down") => {
    setClipOrder((prev) => {
      const idx = prev.indexOf(name);
      if (idx < 0) {
        return prev;
      }
      const next = [...prev];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) {
        return prev;
      }
      const tmp = next[idx]!;
      next[idx] = next[swap]!;
      next[swap] = tmp;
      return next;
    });
    setActiveClipRestartNonce((n) => n + 1);
  }, []);

  const updateClipSettings = useCallback(
    (name: string, patch: Partial<GlbAnimationLabClipSettings>) => {
      setClipSettings((prev) => ({
        ...prev,
        [name]: { ...(prev[name] ?? DEFAULT_ANIMATION_LAB_CLIP_SETTINGS), ...patch },
      }));
    },
    [],
  );

  const setRuntimeReport = useCallback((report: GlbAnimationLabRuntimeReport) => {
    setRuntime(report);
  }, []);

  const highlightedClipName =
    playbackMode === "sequence" ? sequenceActiveClipName ?? activeClipName : activeClipName;

  const value = useMemo(
    (): GlbAnimationLabContextValue => ({
      fetchUrl: props.fetchUrl,
      modelLabel: props.modelLabel,
      dedupeKey: props.dedupeKey,
      mixerEngine,
      setMixerEngine,
      playbackMode,
      setPlaybackMode,
      clipOrder,
      moveClipInOrder,
      activeClipName: highlightedClipName,
      setActiveClipName: setActiveClipNameWithCrossFade,
      clipSettings,
      updateClipSettings,
      soloCrossFadeS,
      setSoloCrossFadeS,
      transport,
      setTransport,
      isScrubbing,
      setIsScrubbing,
      scrubTimeS,
      setScrubTimeS,
      runtime,
      setRuntimeReport,
      activeClipRestartNonce,
      livePlayback,
      catalogHintsApplied,
    }),
    [
      activeClipRestartNonce,
      catalogHintsApplied,
      clipOrder,
      clipSettings,
      highlightedClipName,
      isScrubbing,
      livePlayback,
      mixerEngine,
      playbackMode,
      props.dedupeKey,
      props.fetchUrl,
      props.modelLabel,
      runtime,
      scrubTimeS,
      setActiveClipNameWithCrossFade,
      setMixerEngine,
      setPlaybackMode,
      setRuntimeReport,
      setSoloCrossFadeS,
      soloCrossFadeS,
      transport,
      updateClipSettings,
      moveClipInOrder,
    ],
  );

  return (
    <GlbAnimationLabContext.Provider value={value}>{props.children}</GlbAnimationLabContext.Provider>
  );
}

export function useGlbAnimationLab(): GlbAnimationLabContextValue | null {
  return useContext(GlbAnimationLabContext);
}
