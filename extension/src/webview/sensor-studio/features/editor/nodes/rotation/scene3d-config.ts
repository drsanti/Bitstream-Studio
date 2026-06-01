import * as THREE from "three";
import { resolveDefaultPreviewMeshGlbUrl } from "../../../../../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl.js";

function isPlausiblePersistedStudioAssetId(id: unknown): id is string {
  if (typeof id !== "string") {
    return false;
  }
  const t = id.trim();
  return t.length >= 3 && t.length <= 160 && /^[a-zA-Z0-9._:-]+$/.test(t);
}

/** Serialized form of `THREE.MOUSE` actions used by OrbitControls.mouseButtons. */
export type OrbitMouseButtonAction = "ROTATE" | "DOLLY" | "PAN";

/** Serialized `THREE.TOUCH` for one-finger gesture. */
export type OrbitTouchOneAction = "ROTATE" | "PAN";

/** Serialized `THREE.TOUCH` for two-finger gesture. */
export type OrbitTouchTwoAction = "DOLLY_PAN" | "DOLLY_ROTATE";

/** Studio-authored directional lamps (separate from embedded GLTF lights). */
export type StudioDirectionalLightV1 = {
  id: string;
  colorHex: string;
  intensity: number;
  position: { x: number; y: number; z: number };
};

/** Hard cap on directional entries (preview + inspector). */
export const MAX_STUDIO_DIRECTIONALS = 8;

/** Built-in studio lighting layouts (ambient + directionals only). */
export type StudioLightsPresetId = "ibl-forward" | "key-fill" | "soft-studio";

/** Replace `scene3d.lights` from a named preset (caller merges into full config). */
export function studioLightsFromPreset(id: StudioLightsPresetId): Scene3DConfigV1["lights"] {
  switch (id) {
    case "ibl-forward":
      return {
        ambient: { colorHex: "#ffffff", intensity: 0.22 },
        directionals: [
          {
            id: "studio-main",
            colorHex: "#ffffff",
            intensity: 0,
            position: { x: 2.5, y: 3.5, z: 2.0 },
          },
        ],
      };
    case "key-fill":
      return {
        ambient: { colorHex: "#ffffff", intensity: 0.18 },
        directionals: [
          {
            id: "key",
            colorHex: "#fff8f0",
            intensity: 1.15,
            position: { x: 4.0, y: 6.0, z: 3.0 },
          },
          {
            id: "fill",
            colorHex: "#e8f0ff",
            intensity: 0.35,
            position: { x: -3.5, y: 2.0, z: -2.0 },
          },
        ],
      };
    case "soft-studio":
      return {
        ambient: { colorHex: "#ffffff", intensity: 0.42 },
        directionals: [
          {
            id: "main",
            colorHex: "#ffffff",
            intensity: 0.52,
            position: { x: 3.0, y: 4.0, z: 2.5 },
          },
          {
            id: "rim",
            colorHex: "#cfe8ff",
            intensity: 0.22,
            position: { x: -2.0, y: 2.5, z: -3.0 },
          },
        ],
      };
    default: {
      const _x: never = id;
      return _x;
    }
  }
}

/**
 * How to combine authored studio lights/camera with lights & cameras embedded in the GLB.
 * - **keep**: use GLTF nodes as loaded.
 * - **strip**: remove embedded lights and cameras (studio rig only).
 * - **hybrid**: remove embedded cameras (orbit preview stays authoritative); keep embedded lights.
 */
export type EmbeddedRigPolicy = "keep" | "strip" | "hybrid";

export type Scene3DConfigV1 = {
  version: 1;
  model: {
    /** GLB/GLTF URL (relative or absolute). */
    url: string;
    /**
     * Optional stable id from the **studio asset manifest** / Asset Browser (validated loosely in
     * {@link coerceScene3DConfigV1} so new remote ids still round-trip). Omitted for arbitrary URLs.
     */
    studioAssetId?: string;
    embeddedRigPolicy: EmbeddedRigPolicy;
    transform: {
      position: { x: number; y: number; z: number };
      /** Degrees (editor-friendly). */
      rotationDeg: { x: number; y: number; z: number };
      scale: { x: number; y: number; z: number };
    };
  };
  environment: {
    presetIndex: number;
    /**
     * Optional **environment** id from the manifest / Asset Browser. When set, rotation preview
     * resolves six cubemap face URLs via `resolveStudioAsset` (covers sets not listed in T3D).
     */
    studioAssetId?: string;
    showBackgroundTexture: boolean;
    useCubemapIbl: boolean;
    /** Strength multiplier applied to `scene.environmentIntensity` when IBL is enabled. */
    iblStrength: number;
    /** When IBL is off, intensity is multiplied by this (metals still need some env). */
    iblOffStrengthFrac: number;
    /** Rotate environment around world Y (degrees). */
    yawDeg: number;
    /** Background color when background texture is disabled. */
    backgroundColorHex: string;
  };
  renderer: {
    dprMin: number;
    dprMax: number;
    antialias: boolean;
    /** Clear color behind the scene (used when bg texture is off). */
    clearColorHex: string;
    toneMapping: "aces";
    toneMappingExposure: number;
    outputColorSpace: "srgb";
    /** Shadow maps from studio directionals (heavier GPU load). */
    shadowsEnabled: boolean;
    /** Square shadow map resolution edge length (clamped to 512–4096, snapped to supported sizes). */
    shadowMapSize: number;
    /** Half-extent of the directional shadow orthographic frustum (± units around target area). */
    shadowOrthoExtent: number;
    /** Depth bias on shadow maps (reduces acne vs introduces gaps). */
    shadowBias: number;
    /** World-unit normal offset for shadow receiver sampling (Peter Pan vs artifact trade-off). */
    shadowNormalBias: number;
  };
  camera: {
    fovDeg: number;
    /** Fit padding factor (smaller = closer). */
    frameMargin: number;
    /** Direction from target to camera; normalized at runtime. */
    frameDirection: { x: number; y: number; z: number };
    nearDivisor: number;
    farMultiplier: number;
    transform: {
      position: { x: number; y: number; z: number };
      target: { x: number; y: number; z: number };
    };
  };
  controls: {
    enableDamping: boolean;
    dampingFactor: number;
    enablePan: boolean;
    enableRotate: boolean;
    enableZoom: boolean;
    screenSpacePanning: boolean;
    zoomToCursor: boolean;
    rotateSpeed: number;
    zoomSpeed: number;
    panSpeed: number;
    keyRotateSpeed: number;
    keyPanSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    /** Perspective: minimum distance from target (Three.js `minDistance`). */
    minDistance: number;
    /** Perspective: maximum distance; `null` means unlimited (`Infinity`). */
    maxDistance: number | null;
    /** Polar limits in degrees (converted to radians at runtime). */
    minPolarAngleDeg: number;
    maxPolarAngleDeg: number;
    /** Azimuth limits in degrees; `null` means unbounded. */
    minAzimuthDeg: number | null;
    maxAzimuthDeg: number | null;
    minTargetRadius: number;
    maxTargetRadius: number | null;
    mouseButtons: {
      left: OrbitMouseButtonAction;
      middle: OrbitMouseButtonAction;
      right: OrbitMouseButtonAction;
    };
    touches: {
      one: OrbitTouchOneAction;
      two: OrbitTouchTwoAction;
    };
  };
  lights: {
    ambient: { colorHex: string; intensity: number };
    directionals: StudioDirectionalLightV1[];
  };
  helpers: {
    grid: {
      enabled: boolean;
      size: number;
      divisions: number;
      /** Axis emphasis lines through origin (`GridHelper` center color). */
      colorCenterHex: string;
      /** Cell lines (`GridHelper` grid color). */
      colorGridHex: string;
      opacity: number;
      y: number;
    };
    axes: {
      enabled: boolean;
      /** Half-extent of each axis segment from origin. */
      length: number;
      opacity: number;
    };
    camera: {
      /** Frustum helper for the active orbit/preview camera. */
      enabled: boolean;
    };
    directionalLight: {
      /** Helper plane size for the targeted studio directional light. */
      enabled: boolean;
      planeSize: number;
      /** Which directional `id` gets the helper; first entry when `null`. */
      attachToDirectionalId: string | null;
    };
  };
  /** Optional distance fog (flow **`fog`** wire or inspector). */
  fog: {
    enabled: boolean;
    mode: "linear" | "exp2";
    near: number;
    far: number;
    density: number;
    colorHex: string;
  };
  /** Optional bloom post-processing (flow **`postProcessing`** wire). */
  postProcessing: {
    enabled: boolean;
    enableBloom: boolean;
    bloomIntensity: number;
    bloomThreshold: number;
  };
  /** Optional ground contact shadow disc (flow **`contactShadows`** wire). */
  contactShadows: {
    enabled: boolean;
    opacity: number;
    blur: number;
    far: number;
    scale: number;
    colorHex: string;
  };
};

export type Scene3DConfig = Scene3DConfigV1;

/** Bundled chunk URLs point at `out/webview/assets/` — those GLBs are omitted from the VSIX; use the same resolver as Bitstream rotation preview (free pack / online). */
function defaultStudioPreviewModelUrl(): string {
  return typeof window !== "undefined" ? resolveDefaultPreviewMeshGlbUrl() : "";
}

export const DEFAULT_SCENE3D_CONFIG_V1: Scene3DConfigV1 = {
  version: 1,
  model: {
    url: defaultStudioPreviewModelUrl(),
    embeddedRigPolicy: "keep",
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
  environment: {
    presetIndex: 0,
    // Match Bitstream workspace defaults.
    showBackgroundTexture: true,
    useCubemapIbl: true,
    iblStrength: 1,
    iblOffStrengthFrac: 0.45,
    yawDeg: 0,
    backgroundColorHex: "#09090b",
  },
  renderer: {
    dprMin: 1,
    /** Cap at 2 so HiDPI (devicePixelRatio ≈ 2) renders sharp; 1.5 looked visibly soft when scaled. */
    dprMax: 2,
    antialias: true,
    clearColorHex: "#09090b",
    toneMapping: "aces",
    // Match Bitstream workspace: ACES exposure tuned for the PCB.
    toneMappingExposure: 0.55,
    outputColorSpace: "srgb",
    shadowsEnabled: false,
    shadowMapSize: 2048,
    shadowOrthoExtent: 32,
    shadowBias: -0.00018,
    shadowNormalBias: 0.04,
  },
  camera: {
    fovDeg: 55,
    frameMargin: 1.06,
    frameDirection: { x: 1, y: 0.7, z: 1 },
    nearDivisor: 200,
    farMultiplier: 200,
    transform: {
      position: { x: 0, y: 15, z: 15 },
      target: { x: 0, y: 0, z: 0 },
    },
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.08,
    enablePan: true,
    enableRotate: true,
    enableZoom: true,
    screenSpacePanning: true,
    zoomToCursor: false,
    rotateSpeed: 1,
    zoomSpeed: 1,
    panSpeed: 1,
    keyRotateSpeed: 1,
    keyPanSpeed: 7,
    autoRotate: false,
    autoRotateSpeed: 2,
    minDistance: 0,
    maxDistance: null,
    minPolarAngleDeg: 0,
    maxPolarAngleDeg: 180,
    minAzimuthDeg: null,
    maxAzimuthDeg: null,
    minTargetRadius: 0,
    maxTargetRadius: null,
    mouseButtons: { left: "ROTATE", middle: "DOLLY", right: "PAN" },
    touches: { one: "ROTATE", two: "DOLLY_PAN" },
  },
  lights: {
    // Match Bitstream workspace: minimal fill; env map does most of the work.
    ambient: { colorHex: "#ffffff", intensity: 0.22 },
    directionals: [
      {
        id: "studio-main",
        colorHex: "#ffffff",
        intensity: 0,
        position: { x: 2.5, y: 3.5, z: 2.0 },
      },
    ],
  },
  helpers: {
    grid: {
      enabled: true,
      size: 24,
      divisions: 96,
      colorCenterHex: "#71717a",
      colorGridHex: "#3f3f46",
      opacity: 0.85,
      y: -0.35,
    },
    axes: {
      enabled: false,
      length: 3,
      opacity: 0.9,
    },
    camera: {
      enabled: false,
    },
    directionalLight: {
      enabled: false,
      planeSize: 1,
      attachToDirectionalId: null,
    },
  },
  fog: {
    enabled: false,
    mode: "linear",
    near: 1,
    far: 50,
    density: 0.05,
    colorHex: "#1a1a2e",
  },
  postProcessing: {
    enabled: false,
    enableBloom: true,
    bloomIntensity: 1.5,
    bloomThreshold: 1.0,
  },
  contactShadows: {
    enabled: false,
    opacity: 0.5,
    blur: 2,
    far: 10,
    scale: 10,
    colorHex: "#000000",
  },
};

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function asFiniteNumber(v: unknown, fallback: number): number {
  if (isFiniteNumber(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Snap to practical shadow-map sizes (WebGL caps vary). */
function coerceShadowMapSize(v: unknown, fallback: number): number {
  const allowed = [512, 1024, 2048, 4096] as const;
  const raw = Math.round(asFiniteNumber(v, fallback));
  let best: (typeof allowed)[number] = 2048;
  let bestDist = Infinity;
  for (const a of allowed) {
    const d = Math.abs(raw - a);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best;
}

function asHexColor(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const s = v.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) return s;
  return fallback;
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asEmbeddedRigPolicy(v: unknown, fallback: EmbeddedRigPolicy): EmbeddedRigPolicy {
  return v === "keep" || v === "strip" || v === "hybrid" ? v : fallback;
}

function asOrbitMouseButton(v: unknown, fallback: OrbitMouseButtonAction): OrbitMouseButtonAction {
  return v === "ROTATE" || v === "DOLLY" || v === "PAN" ? v : fallback;
}

function asOrbitTouchOne(v: unknown, fallback: OrbitTouchOneAction): OrbitTouchOneAction {
  return v === "ROTATE" || v === "PAN" ? v : fallback;
}

function asOrbitTouchTwo(v: unknown, fallback: OrbitTouchTwoAction): OrbitTouchTwoAction {
  return v === "DOLLY_PAN" || v === "DOLLY_ROTATE" ? v : fallback;
}

/** Positive finite number or `null` when raw is `null`. */
function asPositiveFiniteOrNull(v: unknown, fallback: number | null): number | null {
  if (v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

/** Finite azimuth in degrees or `null` for unbounded. */
function asAzimuthDegOrNull(v: unknown): number | null {
  if (v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return clamp(n, -360, 360);
}

function asVec3(
  v: unknown,
  fallback: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  if (v != null && typeof v === "object" && "x" in v && "y" in v && "z" in v) {
    const o = v as Record<string, unknown>;
    return {
      x: asFiniteNumber(o.x, fallback.x),
      y: asFiniteNumber(o.y, fallback.y),
      z: asFiniteNumber(o.z, fallback.z),
    };
  }
  return fallback;
}

function coerceStudioDirectionals(
  lightsRaw: Record<string, unknown>,
  d: Scene3DConfigV1,
): StudioDirectionalLightV1[] {
  const dirsRaw = lightsRaw.directionals;
  const legacyDir = ((lightsRaw.directional ?? {}) as Record<string, unknown>) ?? {};
  const baseDefaults = d.lights.directionals;
  const fallback0 = baseDefaults[0]!;

  const pushUniqueRow = (
    row: unknown,
    index: number,
    out: StudioDirectionalLightV1[],
    seen: Set<string>,
  ): void => {
    if (row == null || typeof row !== "object" || out.length >= MAX_STUDIO_DIRECTIONALS) {
      return;
    }
    const r = row as Record<string, unknown>;
    const fb = baseDefaults[Math.min(index, baseDefaults.length - 1)] ?? fallback0;
    const baseId = typeof r.id === "string" && r.id.trim().length > 0 ? r.id.trim() : `dir-${index}`;
    let id = baseId;
    let suf = 0;
    while (seen.has(id)) {
      id = `${baseId}-dup${suf}`;
      suf++;
    }
    seen.add(id);
    out.push({
      id,
      colorHex: asHexColor(r.colorHex, fb.colorHex),
      intensity: clamp(asFiniteNumber(r.intensity, fb.intensity), 0, 20),
      position: asVec3(r.position, fb.position),
    });
  };

  if (Array.isArray(dirsRaw) && dirsRaw.length > 0) {
    const out: StudioDirectionalLightV1[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < dirsRaw.length; i++) {
      pushUniqueRow(dirsRaw[i], i, out, seen);
    }
    return out.length > 0 ? out : structuredClone(baseDefaults);
  }

  return [
    {
      id: "studio-main",
      colorHex: asHexColor(legacyDir.colorHex, fallback0.colorHex),
      intensity: clamp(asFiniteNumber(legacyDir.intensity, fallback0.intensity), 0, 20),
      position: asVec3(legacyDir.position, fallback0.position),
    },
  ];
}

export function coerceScene3DConfigV1(raw: unknown): Scene3DConfigV1 {
  const d = DEFAULT_SCENE3D_CONFIG_V1;
  if (raw == null || typeof raw !== "object") {
    return defaultScene3DConfig();
  }
  const o = raw as Record<string, unknown>;
  const modelRaw = (o.model ?? {}) as Record<string, unknown>;
  const envRaw = (o.environment ?? {}) as Record<string, unknown>;
  const rendererRaw = (o.renderer ?? {}) as Record<string, unknown>;
  const camRaw = (o.camera ?? {}) as Record<string, unknown>;
  const controlsRaw = (o.controls ?? {}) as Record<string, unknown>;
  const lightsRaw = (o.lights ?? {}) as Record<string, unknown>;
  const helpersRaw = (o.helpers ?? {}) as Record<string, unknown>;
  const gridRaw = ((helpersRaw.grid ?? {}) as Record<string, unknown>) ?? {};
  const axesRaw = ((helpersRaw.axes ?? {}) as Record<string, unknown>) ?? {};
  const camHelpRaw = ((helpersRaw.camera ?? {}) as Record<string, unknown>) ?? {};
  const dirHelpRaw = ((helpersRaw.directionalLight ?? {}) as Record<string, unknown>) ?? {};
  const fogRaw = (o.fog ?? {}) as Record<string, unknown>;
  const postRaw = (o.postProcessing ?? {}) as Record<string, unknown>;
  const contactRaw = (o.contactShadows ?? {}) as Record<string, unknown>;

  const ambientRaw = ((lightsRaw.ambient ?? {}) as Record<string, unknown>) ?? {};

  const version = o.version === 1 ? 1 : 1;

  const directionals = coerceStudioDirectionals(lightsRaw, d);

  const modelUrl =
    typeof modelRaw.url === "string" && modelRaw.url.length > 0
      ? modelRaw.url
      : defaultStudioPreviewModelUrl() || d.model.url;

  const rawStudioAssetId = modelRaw.studioAssetId;
  let studioAssetId: string | undefined = undefined;
  if (isPlausiblePersistedStudioAssetId(rawStudioAssetId)) {
    studioAssetId = rawStudioAssetId.trim();
  }

  const environmentPresetIndex = Math.max(0, Math.round(asFiniteNumber(envRaw.presetIndex, d.environment.presetIndex)));
  const rawEnvStudioAssetId = envRaw.studioAssetId;
  let environmentStudioAssetId: string | undefined = undefined;
  if (isPlausiblePersistedStudioAssetId(rawEnvStudioAssetId)) {
    environmentStudioAssetId = rawEnvStudioAssetId.trim();
  }

  return {
    version,
    model: {
      url: modelUrl,
      ...(studioAssetId != null ? { studioAssetId } : {}),
      embeddedRigPolicy: asEmbeddedRigPolicy(modelRaw.embeddedRigPolicy, d.model.embeddedRigPolicy),
      transform: {
        position: asVec3((modelRaw.transform as Record<string, unknown> | undefined)?.position, d.model.transform.position),
        rotationDeg: asVec3(
          (modelRaw.transform as Record<string, unknown> | undefined)?.rotationDeg,
          d.model.transform.rotationDeg,
        ),
        scale: asVec3((modelRaw.transform as Record<string, unknown> | undefined)?.scale, d.model.transform.scale),
      },
    },
    environment: {
      presetIndex: environmentPresetIndex,
      ...(environmentStudioAssetId != null ? { studioAssetId: environmentStudioAssetId } : {}),
      showBackgroundTexture: asBool(envRaw.showBackgroundTexture, d.environment.showBackgroundTexture),
      useCubemapIbl: asBool(envRaw.useCubemapIbl, d.environment.useCubemapIbl),
      iblStrength: clamp(asFiniteNumber(envRaw.iblStrength, d.environment.iblStrength), 0, 5),
      iblOffStrengthFrac: clamp(
        asFiniteNumber(envRaw.iblOffStrengthFrac, d.environment.iblOffStrengthFrac),
        0,
        1,
      ),
      yawDeg: asFiniteNumber(envRaw.yawDeg, d.environment.yawDeg),
      backgroundColorHex: asHexColor(envRaw.backgroundColorHex, d.environment.backgroundColorHex),
    },
    renderer: {
      dprMin: clamp(asFiniteNumber(rendererRaw.dprMin, d.renderer.dprMin), 0.5, 3),
      dprMax: clamp(asFiniteNumber(rendererRaw.dprMax, d.renderer.dprMax), 0.5, 3),
      antialias: asBool(rendererRaw.antialias, d.renderer.antialias),
      clearColorHex: asHexColor(rendererRaw.clearColorHex, d.renderer.clearColorHex),
      toneMapping: "aces",
      toneMappingExposure: clamp(
        asFiniteNumber(rendererRaw.toneMappingExposure, d.renderer.toneMappingExposure),
        0.05,
        4,
      ),
      outputColorSpace: "srgb",
      shadowsEnabled: asBool(rendererRaw.shadowsEnabled, d.renderer.shadowsEnabled),
      shadowMapSize: coerceShadowMapSize(rendererRaw.shadowMapSize, d.renderer.shadowMapSize),
      shadowOrthoExtent: clamp(
        asFiniteNumber(rendererRaw.shadowOrthoExtent, d.renderer.shadowOrthoExtent),
        4,
        200,
      ),
      shadowBias: clamp(asFiniteNumber(rendererRaw.shadowBias, d.renderer.shadowBias), -0.002, 0.002),
      shadowNormalBias: clamp(
        asFiniteNumber(rendererRaw.shadowNormalBias, d.renderer.shadowNormalBias),
        0,
        0.15,
      ),
    },
    camera: {
      fovDeg: clamp(asFiniteNumber(camRaw.fovDeg, d.camera.fovDeg), 10, 120),
      frameMargin: clamp(asFiniteNumber(camRaw.frameMargin, d.camera.frameMargin), 0.9, 3),
      frameDirection: asVec3(camRaw.frameDirection, d.camera.frameDirection),
      nearDivisor: clamp(asFiniteNumber(camRaw.nearDivisor, d.camera.nearDivisor), 20, 2000),
      farMultiplier: clamp(asFiniteNumber(camRaw.farMultiplier, d.camera.farMultiplier), 10, 5000),
      transform: {
        position: asVec3(
          (camRaw.transform as Record<string, unknown> | undefined)?.position,
          d.camera.transform.position,
        ),
        target: asVec3(
          (camRaw.transform as Record<string, unknown> | undefined)?.target,
          d.camera.transform.target,
        ),
      },
    },
    controls: (() => {
      const dc = d.controls;
      const mbRaw = (controlsRaw.mouseButtons ?? {}) as Record<string, unknown>;
      const touchRaw = (controlsRaw.touches ?? {}) as Record<string, unknown>;
      let minPol = clamp(asFiniteNumber(controlsRaw.minPolarAngleDeg, dc.minPolarAngleDeg), 0, 180);
      let maxPol = clamp(asFiniteNumber(controlsRaw.maxPolarAngleDeg, dc.maxPolarAngleDeg), 0, 180);
      if (minPol > maxPol) {
        const t = minPol;
        minPol = maxPol;
        maxPol = t;
      }
      const maxDist =
        controlsRaw.maxDistance === null
          ? null
          : controlsRaw.maxDistance === undefined
            ? dc.maxDistance
            : asPositiveFiniteOrNull(controlsRaw.maxDistance, dc.maxDistance);

      const maxTargetR =
        controlsRaw.maxTargetRadius === null
          ? null
          : controlsRaw.maxTargetRadius === undefined
            ? dc.maxTargetRadius
            : asPositiveFiniteOrNull(controlsRaw.maxTargetRadius, dc.maxTargetRadius);

      let minAz = asAzimuthDegOrNull(controlsRaw.minAzimuthDeg);
      let maxAz = asAzimuthDegOrNull(controlsRaw.maxAzimuthDeg);
      if (minAz != null && maxAz != null && minAz > maxAz) {
        const swap = minAz;
        minAz = maxAz;
        maxAz = swap;
      }

      return {
        enableDamping: asBool(controlsRaw.enableDamping, dc.enableDamping),
        dampingFactor: clamp(asFiniteNumber(controlsRaw.dampingFactor, dc.dampingFactor), 0, 1),
        enablePan: asBool(controlsRaw.enablePan, dc.enablePan),
        enableRotate: asBool(controlsRaw.enableRotate, dc.enableRotate),
        enableZoom: asBool(controlsRaw.enableZoom, dc.enableZoom),
        screenSpacePanning: asBool(controlsRaw.screenSpacePanning, dc.screenSpacePanning),
        zoomToCursor: asBool(controlsRaw.zoomToCursor, dc.zoomToCursor),
        rotateSpeed: clamp(asFiniteNumber(controlsRaw.rotateSpeed, dc.rotateSpeed), 0.05, 10),
        zoomSpeed: clamp(asFiniteNumber(controlsRaw.zoomSpeed, dc.zoomSpeed), 0.05, 10),
        panSpeed: clamp(asFiniteNumber(controlsRaw.panSpeed, dc.panSpeed), 0.05, 10),
        keyRotateSpeed: clamp(asFiniteNumber(controlsRaw.keyRotateSpeed, dc.keyRotateSpeed), 0.05, 10),
        keyPanSpeed: clamp(asFiniteNumber(controlsRaw.keyPanSpeed, dc.keyPanSpeed), 0.5, 50),
        autoRotate: asBool(controlsRaw.autoRotate, dc.autoRotate),
        autoRotateSpeed: clamp(asFiniteNumber(controlsRaw.autoRotateSpeed, dc.autoRotateSpeed), 0, 20),
        minDistance: clamp(asFiniteNumber(controlsRaw.minDistance, dc.minDistance), 0, 1e6),
        maxDistance: maxDist,
        minPolarAngleDeg: minPol,
        maxPolarAngleDeg: maxPol,
        minAzimuthDeg:
          controlsRaw.minAzimuthDeg === undefined ? dc.minAzimuthDeg : asAzimuthDegOrNull(controlsRaw.minAzimuthDeg),
        maxAzimuthDeg:
          controlsRaw.maxAzimuthDeg === undefined ? dc.maxAzimuthDeg : asAzimuthDegOrNull(controlsRaw.maxAzimuthDeg),
        minTargetRadius: clamp(asFiniteNumber(controlsRaw.minTargetRadius, dc.minTargetRadius), 0, 1e6),
        maxTargetRadius: maxTargetR,
        mouseButtons: {
          left: asOrbitMouseButton(mbRaw.left, dc.mouseButtons.left),
          middle: asOrbitMouseButton(mbRaw.middle, dc.mouseButtons.middle),
          right: asOrbitMouseButton(mbRaw.right, dc.mouseButtons.right),
        },
        touches: {
          one: asOrbitTouchOne(touchRaw.one, dc.touches.one),
          two: asOrbitTouchTwo(touchRaw.two, dc.touches.two),
        },
      };
    })(),
    lights: {
      ambient: {
        colorHex: asHexColor(ambientRaw.colorHex, d.lights.ambient.colorHex),
        intensity: clamp(asFiniteNumber(ambientRaw.intensity, d.lights.ambient.intensity), 0, 8),
      },
      directionals,
    },
    helpers: {
      grid: {
        enabled: asBool(gridRaw.enabled, d.helpers.grid.enabled),
        size: clamp(asFiniteNumber(gridRaw.size, d.helpers.grid.size), 1, 200),
        divisions: clamp(Math.round(asFiniteNumber(gridRaw.divisions, d.helpers.grid.divisions)), 1, 512),
        colorCenterHex: asHexColor(gridRaw.colorCenterHex, d.helpers.grid.colorCenterHex),
        colorGridHex: asHexColor(gridRaw.colorGridHex, d.helpers.grid.colorGridHex),
        opacity: clamp(asFiniteNumber(gridRaw.opacity, d.helpers.grid.opacity), 0, 1),
        y: asFiniteNumber(gridRaw.y, d.helpers.grid.y),
      },
      axes: {
        enabled: asBool(axesRaw.enabled, d.helpers.axes.enabled),
        length: clamp(asFiniteNumber(axesRaw.length, d.helpers.axes.length), 0.05, 50),
        opacity: clamp(asFiniteNumber(axesRaw.opacity, d.helpers.axes.opacity), 0, 1),
      },
      camera: {
        enabled: asBool(camHelpRaw.enabled, d.helpers.camera.enabled),
      },
      directionalLight: {
        enabled: asBool(dirHelpRaw.enabled, d.helpers.directionalLight.enabled),
        planeSize: clamp(
          asFiniteNumber(dirHelpRaw.planeSize, d.helpers.directionalLight.planeSize),
          0.05,
          20,
        ),
        attachToDirectionalId: ((): string | null => {
          const raw = dirHelpRaw.attachToDirectionalId;
          let id: string | null =
            raw === null || raw === undefined
              ? null
              : typeof raw === "string" && raw.trim().length > 0
                ? raw.trim()
                : null;
          if (id != null && !directionals.some((l) => l.id === id)) {
            id = null;
          }
          return id;
        })(),
      },
    },
    fog: {
      enabled: asBool(fogRaw.enabled, d.fog.enabled),
      mode: fogRaw.mode === "exp2" ? "exp2" : "linear",
      near: clamp(asFiniteNumber(fogRaw.near, d.fog.near), 0.001, 1e6),
      far: clamp(asFiniteNumber(fogRaw.far, d.fog.far), 0.001, 1e6),
      density: clamp(asFiniteNumber(fogRaw.density, d.fog.density), 0, 1),
      colorHex: asHexColor(fogRaw.colorHex, d.fog.colorHex),
    },
    postProcessing: {
      enabled: asBool(postRaw.enabled, d.postProcessing.enabled),
      enableBloom: asBool(postRaw.enableBloom, d.postProcessing.enableBloom),
      bloomIntensity: clamp(
        asFiniteNumber(postRaw.bloomIntensity, d.postProcessing.bloomIntensity),
        0,
        8,
      ),
      bloomThreshold: clamp(
        asFiniteNumber(postRaw.bloomThreshold, d.postProcessing.bloomThreshold),
        0,
        2,
      ),
    },
    contactShadows: {
      enabled: asBool(contactRaw.enabled, d.contactShadows.enabled),
      opacity: clamp(asFiniteNumber(contactRaw.opacity, d.contactShadows.opacity), 0, 1),
      blur: clamp(asFiniteNumber(contactRaw.blur, d.contactShadows.blur), 0.1, 20),
      far: clamp(asFiniteNumber(contactRaw.far, d.contactShadows.far), 0.1, 100),
      scale: clamp(asFiniteNumber(contactRaw.scale, d.contactShadows.scale), 0.1, 100),
      colorHex: asHexColor(contactRaw.colorHex, d.contactShadows.colorHex),
    },
  };
}

/**
 * Canonical snapshot for persistence — reapplies coercion so legacy keys (for example
 * `lights.directional`) are not retained when objects were merged from older JSON.
 */
export function persistScene3DConfig(config: Scene3DConfigV1): Scene3DConfigV1 {
  return coerceScene3DConfigV1(config);
}

export function defaultScene3DConfig(): Scene3DConfigV1 {
  const c = structuredClone(DEFAULT_SCENE3D_CONFIG_V1);
  c.model.url = defaultStudioPreviewModelUrl() || c.model.url;
  return c;
}

export function parseHexToThreeColor(hex: string): THREE.Color {
  try {
    return new THREE.Color(hex);
  } catch {
    return new THREE.Color("#ffffff");
  }
}

