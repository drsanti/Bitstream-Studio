import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  advanceGlbAnimationSequenceAfterMixerTick,
  filterGlbAnimationDrivesForPreview,
  resetGlbAnimationSequencePlaybackState,
  type GlbAnimationSequencePlaybackState,
} from "../../../sensor-studio/features/editor/gltf/studio-glb-animation-playback-mode.js";
import {
  applyStudioGlbAnimationMixerDrives,
  createStudioGlbAnimationMixerState,
} from "../../../sensor-studio/features/editor/gltf/studio-glb-animation-preview-mixer.js";
import { GlbPreviewModelRoot } from "../3d-rotation/shared/GlbPreviewModelRoot.js";
import { ROTATION_PREVIEW_MIN_MATERIAL_ENV_MAP_INTENSITY } from "../3d-rotation/shared/rotationPreviewConstants.js";
import {
  analyzeGlbClipOverlap,
  clipFrameFromTime,
} from "./analyze-glb-clip-overlap.js";
import {
  normalizeAnimationLabCatalogHints,
  resolveAnimationLabCatalogHints,
} from "./animation-lab-catalog-hints.js";
import { applyAnimationLabLegacyPlayback } from "./glb-animation-lab-playback.js";
import { buildAnimationLabDrives } from "./build-animation-lab-drives.js";
import { resolveAnimationLabActionKey } from "./animation-lab-action-key.js";
import { publishAnimationLabTimelineTimeS, resetAnimationLabTimelineStore } from "./animation-lab-timeline-store.js";
import {
  notifyAnimationLabLivePlayback,
  notifyAnimationLabSequenceActiveClip,
  useGlbAnimationLab,
} from "./glb-animation-lab-context.js";
import type { GlbAnimationLabClipSettings, GlbAnimationLabPlaybackMode } from "./glb-animation-lab.types.js";
import type { GlbPreviewUserTransport } from "../../../sensor-studio/features/editor/gltf/glb-preview-user-transport.js";
import { useAnimationLabSceneStore } from "./animation-lab-scene.store.js";
import { AnimationLabCss3dAnchorSync } from "./css3d/AnimationLabCss3dAnchorSync.js";

function clipDisplayName(clip: THREE.AnimationClip, index: number): string {
  const nm = typeof clip.name === "string" ? clip.name.trim() : "";
  return nm.length > 0 ? nm : `clip-${index}`;
}

function ensureEnvMapIntensityForSceneEnvironment(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (
        mat instanceof THREE.MeshStandardMaterial ||
        mat instanceof THREE.MeshPhysicalMaterial
      ) {
        if (mat.envMapIntensity < 0.001) {
          mat.envMapIntensity = ROTATION_PREVIEW_MIN_MATERIAL_ENV_MAP_INTENSITY;
        }
        mat.needsUpdate = true;
      }
    }
  });
}

type LabSnapshot = {
  mixerEngine: "studio" | "legacy";
  playbackMode: GlbAnimationLabPlaybackMode;
  activeClipName: string | null;
  clipOrder: readonly string[];
  clipSettings: Readonly<Record<string, GlbAnimationLabClipSettings>>;
  transport: GlbPreviewUserTransport;
  isScrubbing: boolean;
  scrubTimeS: number;
  soloCrossFadeS: number;
  activeClipRestartNonce: number;
};

function resolveLivePlaybackTimeS(args: {
  snap: LabSnapshot;
  actions: ReadonlyMap<string, THREE.AnimationAction>;
  clipNames: readonly string[];
  sequenceActiveClipName: string | null;
}): number {
  const { snap, actions, clipNames, sequenceActiveClipName } = args;
  if (snap.isScrubbing || snap.transport === "stopped") {
    return snap.scrubTimeS;
  }

  const actionKeys = new Set(actions.keys());

  if (snap.playbackMode === "parallel-all") {
    let maxT = snap.scrubTimeS;
    for (const ac of actions.values()) {
      maxT = Math.max(maxT, ac.time);
    }
    return maxT;
  }

  const preferred =
    snap.playbackMode === "sequence" ? sequenceActiveClipName : snap.activeClipName;
  const key = resolveAnimationLabActionKey(actionKeys, preferred ?? clipNames[0] ?? null);
  const ac = key != null ? actions.get(key) : undefined;
  return ac != null ? ac.time : snap.scrubTimeS;
}

function resolveLivePlaybackClipName(args: {
  snap: LabSnapshot;
  actions: ReadonlyMap<string, THREE.AnimationAction>;
  clipNames: readonly string[];
  sequenceActiveClipName: string | null;
}): string | null {
  const { snap, actions, clipNames, sequenceActiveClipName } = args;
  if (snap.playbackMode === "parallel-all") {
    return null;
  }
  const preferred =
    snap.playbackMode === "sequence" ? sequenceActiveClipName : snap.activeClipName;
  return resolveAnimationLabActionKey(new Set(actions.keys()), preferred ?? clipNames[0] ?? null);
}

export function GlbAnimationLabBody({ url }: { url: string }) {
  const lab = useGlbAnimationLab();
  const { scene, animations } = useGLTF(url);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clipActionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const setRuntimeReportRef = useRef(lab?.setRuntimeReport);

  useEffect(() => {
    setRuntimeReportRef.current = lab?.setRuntimeReport;
  }, [lab?.setRuntimeReport]);
  const envPatchedUrlRef = useRef<string | null>(null);
  const studioMixerStateRef = useRef(createStudioGlbAnimationMixerState());
  const sequenceStateRef = useRef<GlbAnimationSequencePlaybackState>({ activeClipName: null });
  const lastPublishedLiveFrameRef = useRef(-1);
  const lastPublishedLiveTimeRef = useRef(-1);
  const dedupeKeyRef = useRef("");
  const snapshotRef = useRef<LabSnapshot>({
    mixerEngine: "studio",
    playbackMode: "per-clip",
    activeClipName: null,
    clipOrder: [],
    clipSettings: {},
    transport: "stopped",
    isScrubbing: false,
    scrubTimeS: 0,
    soloCrossFadeS: 0.15,
    activeClipRestartNonce: 0,
  });

  if (lab != null) {
    dedupeKeyRef.current = lab.dedupeKey;
    snapshotRef.current = {
      mixerEngine: lab.mixerEngine,
      playbackMode: lab.playbackMode,
      activeClipName: lab.activeClipName,
      clipOrder: lab.clipOrder,
      clipSettings: lab.clipSettings,
      transport: lab.transport,
      isScrubbing: lab.isScrubbing,
      scrubTimeS: lab.scrubTimeS,
      soloCrossFadeS: lab.soloCrossFadeS,
      activeClipRestartNonce: lab.activeClipRestartNonce,
    };
  }

  useEffect(() => {
    useAnimationLabSceneStore.getState().setRoot(scene);
    return () => {
      useAnimationLabSceneStore.getState().setRoot(null);
      scene.parent?.remove(scene);
    };
  }, [scene]);

  useEffect(() => {
    if (envPatchedUrlRef.current === url) {
      return;
    }
    envPatchedUrlRef.current = url;
    ensureEnvMapIntensityForSceneEnvironment(scene);
    resetGlbAnimationSequencePlaybackState(sequenceStateRef.current);
    studioMixerStateRef.current = createStudioGlbAnimationMixerState();
  }, [scene, url]);

  useEffect(() => {
    resetGlbAnimationSequencePlaybackState(sequenceStateRef.current);
    notifyAnimationLabSequenceActiveClip(null);
  }, [lab?.playbackMode, url]);

  useEffect(() => {
    const clips = animations ?? [];
    const clipNames: string[] = [];
    const clipDurationByName: Record<string, number> = {};
    let maxDurationS = 0;

    if (clips.length === 0) {
      mixerRef.current = null;
      clipActionsRef.current = new Map();
      setRuntimeReportRef.current?.({
        gltfClipCount: 0,
        clipNames: [],
        boundActionCount: 0,
        maxClipDurationS: 0,
        clipDurationByName: {},
        overlap: null,
        catalogHints: null,
      });
      return;
    }

    const mixer = new THREE.AnimationMixer(scene);
    const map = new Map<string, THREE.AnimationAction>();
    for (let i = 0; i < clips.length; i += 1) {
      const clip = clips[i]!;
      const nm = clipDisplayName(clip, i);
      if (nm.length === 0) {
        continue;
      }
      clipNames.push(nm);
      clipDurationByName[nm] = clip.duration;
      maxDurationS = Math.max(maxDurationS, clip.duration);
      const ac = mixer.clipAction(clip);
      ac.clampWhenFinished = true;
      ac.setLoop(THREE.LoopRepeat, Infinity);
      ac.play();
      ac.paused = true;
      map.set(nm, ac);
    }
    mixerRef.current = mixer;
    clipActionsRef.current = map;
    studioMixerStateRef.current = createStudioGlbAnimationMixerState();
    resetGlbAnimationSequencePlaybackState(sequenceStateRef.current);

    const overlap = analyzeGlbClipOverlap({ clips, clipNames });
    const rawHints =
      dedupeKeyRef.current.length > 0
        ? resolveAnimationLabCatalogHints(dedupeKeyRef.current)
        : null;
    const catalogHints =
      rawHints != null && clipNames.length > 0
        ? normalizeAnimationLabCatalogHints(rawHints, clipNames)
        : rawHints;

    setRuntimeReportRef.current?.({
      gltfClipCount: clips.length,
      clipNames,
      boundActionCount: map.size,
      maxClipDurationS: maxDurationS,
      clipDurationByName,
      overlap,
      catalogHints:
        catalogHints != null && Object.keys(catalogHints).length > 0 ? catalogHints : null,
    });
    lastPublishedLiveFrameRef.current = -1;
    lastPublishedLiveTimeRef.current = -1;
    resetAnimationLabTimelineStore();
  }, [animations, scene, url]);

  useFrame((_, delta) => {
    const mixer = mixerRef.current;
    const actions = clipActionsRef.current;
    if (mixer == null || actions.size === 0) {
      return;
    }

    const snap = snapshotRef.current;
    const clipNames = [...actions.keys()];

    if (snap.mixerEngine === "legacy") {
      applyAnimationLabLegacyPlayback({
        clipActions: actions,
        transport: snap.transport,
        playbackMode: snap.playbackMode,
        activeClipName: snap.activeClipName,
        isScrubbing: snap.isScrubbing,
        scrubTimeS: snap.scrubTimeS,
      });
      const shouldAdvanceLegacy =
        !snap.isScrubbing &&
        snap.transport === "playing" &&
        (snap.playbackMode === "parallel-all" ||
          snap.playbackMode === "sequence" ||
          snap.activeClipName != null);
      if (shouldAdvanceLegacy) {
        mixer.update(delta);
      }
    } else {

    const order =
      snap.clipOrder.length > 0
        ? snap.clipOrder.filter((n) => actions.has(n))
        : clipNames;

    const drives = buildAnimationLabDrives({
      clipNames: order,
      playbackMode: snap.playbackMode,
      activeClipName: snap.activeClipName,
      clipSettings: snap.clipSettings,
      transport: snap.transport,
      isScrubbing: snap.isScrubbing,
      scrubTimeS: snap.scrubTimeS,
      soloCrossFadeS: snap.soloCrossFadeS,
      activeClipRestartNonce: snap.activeClipRestartNonce,
    });

    const filtered = filterGlbAnimationDrivesForPreview({
      drives,
      playbackMode: snap.playbackMode,
      clipOrder: order,
      sequenceState: sequenceStateRef.current,
    });

    applyStudioGlbAnimationMixerDrives({
      clipActions: actions,
      drives: filtered,
      state: studioMixerStateRef.current,
    });

    if (snap.playbackMode === "sequence") {
      notifyAnimationLabSequenceActiveClip(sequenceStateRef.current.activeClipName);
    }

    const shouldAdvance =
      !snap.isScrubbing &&
      snap.transport === "playing" &&
      Object.values(filtered).some((d) => d.holdTime === false);

    if (shouldAdvance) {
      mixer.update(delta);
      if (snap.playbackMode === "sequence") {
        advanceGlbAnimationSequenceAfterMixerTick({
          clipActions: actions,
          drives,
          clipOrder: order,
          sequenceState: sequenceStateRef.current,
        });
        notifyAnimationLabSequenceActiveClip(sequenceStateRef.current.activeClipName);
      }
    }
    }

    const liveClipName = resolveLivePlaybackClipName({
      snap,
      actions,
      clipNames,
      sequenceActiveClipName: sequenceStateRef.current.activeClipName,
    });
    const timeS = resolveLivePlaybackTimeS({
      snap,
      actions,
      clipNames,
      sequenceActiveClipName: sequenceStateRef.current.activeClipName,
    });
    publishAnimationLabTimelineTimeS(timeS);

    const frame = clipFrameFromTime(timeS);
    const timeMoved =
      lastPublishedLiveTimeRef.current < 0 ||
      Math.abs(timeS - lastPublishedLiveTimeRef.current) >= 1 / 60;
    if (frame !== lastPublishedLiveFrameRef.current || timeMoved) {
      lastPublishedLiveFrameRef.current = frame;
      lastPublishedLiveTimeRef.current = timeS;
      notifyAnimationLabLivePlayback({
        timeS,
        frame,
        fps: 30,
        clipName: liveClipName,
      });
    }
  });

  return (
    <>
      <GlbPreviewModelRoot
        scene={scene}
        catalogTransform={lab?.catalogHintsApplied?.transform}
      />
      <AnimationLabCss3dAnchorSync />
    </>
  );
}
