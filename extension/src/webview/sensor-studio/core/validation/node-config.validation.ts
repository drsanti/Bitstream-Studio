import { z } from "zod";

const looseRecord = z.record(z.string(), z.unknown());

/** Messages suitable for inspector `configErrors`. */
export function validateStudioNodeConfig(nodeId: string, cfg: Record<string, unknown>): string[] {
  const parsed = looseRecord.safeParse(cfg);
  if (!parsed.success) {
    return ["Invalid config shape"];
  }
  const safeCfg = parsed.data;

  switch (nodeId) {
    case "sensor-input":
      return validateSensorInput(safeCfg);
    case "threshold":
      return validateThreshold(safeCfg);
    case "low-pass":
      return validateLowPass(safeCfg);
    case "map-range":
      return validateMapRange(safeCfg);
    case "clamp":
      return validateClamp(safeCfg);
    case "sparkline":
      return validateSparkline(safeCfg);
    case "plotter":
    case "oscilloscope":
      return validatePlotter(safeCfg);
    case "boolean-constant":
      return validateBooleanConstant(safeCfg);
    case "number-constant":
      return validateNumberConstant(safeCfg);
    case "glb-material-param":
      return validateNumberConstant(safeCfg);
    case "glb-material-texture":
      return validateGlbMaterialTexture(safeCfg);
    case "glb-material-color":
      return validateGlbMaterialColor(safeCfg);
    case "mesh-material-basic":
    case "mesh-material-standard":
    case "mesh-material-physical":
    case "mesh-material-toon":
    case "mesh-material-normal":
      return validateMeshMaterial(safeCfg);
    case "mesh-box":
    case "mesh-sphere":
    case "mesh-plane":
    case "mesh-cylinder":
    case "mesh-cone":
    case "mesh-torus":
    case "mesh-capsule":
      return validateMeshPrimitive(safeCfg);
    case "mesh-group":
      return validateMeshGroup(safeCfg);
    case "material-mix":
      return validateMaterialMix(safeCfg);
    case "glb-animation-bundle":
      return validateGlbAnimationBundle(safeCfg);
    case "animation-clip":
      return validateAnimationClip(safeCfg);
    case "animation-merge":
      return validateAnimationMerge(safeCfg);
    case "animation-mix":
      return validateAnimationMix(cfg);
    case "animation-blend":
      return validateAnimationBlend(safeCfg);
    case "part-spin":
      return validatePartSpin(safeCfg);
    case "glb-part-transform":
      return validateGlbPartTransform(safeCfg);
    case "model-select":
      return validateModelSelect(safeCfg);
    default:
      return [];
  }
}

function pushIssues(out: string[], issues: z.ZodIssue[]): void {
  for (const issue of issues) {
    out.push(`${issue.path.join(".") || "config"}: ${issue.message}`);
  }
}

function validateSensorInput(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    sourceKey: z.string().min(1),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateThreshold(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    operator: z.enum(["<", ">"]).optional(),
    value: z.number().finite().optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateLowPass(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    alpha: z.number().finite().min(0).max(1).optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateMapRange(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    value: z.number().finite().optional(),
    inMin: z.number().finite().optional(),
    inMax: z.number().finite().optional(),
    outMin: z.number().finite().optional(),
    outMax: z.number().finite().optional(),
    clamp: z.boolean().optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
    return out;
  }
  const v = r.data;
  if (
    v.inMin !== undefined &&
    v.inMax !== undefined &&
    Math.abs(v.inMax - v.inMin) < 1e-12
  ) {
    out.push("inMin and inMax must differ");
  }
  return out;
}

function validateClamp(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    value: z.number().finite().optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
    return out;
  }
  const v = r.data;
  if (typeof v.min === "number" && typeof v.max === "number" && v.min > v.max) {
    out.push("min must be ≤ max");
  }
  return out;
}

function validateSparkline(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    historySize: z.number().finite().int().min(4).max(512).optional(),
    strokeColor: z.string().optional(),
    strokeWidth: z.number().finite().min(1).max(8).optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

const plotterLineStyle = z.enum(["solid", "dashed", "dotted"]);
const plotterMarkerStyle = z.enum(["none", "dots", "cross"]);

function validatePlotter(cfg: Record<string, unknown>): string[] {
  const channelSchema = z.object({
    label: z.string().min(1).optional(),
    visible: z.boolean().optional(),
    colorHex: z.string().min(4).optional(),
    lineStyle: plotterLineStyle.optional(),
    lineWidthPx: z.number().finite().min(0.5).max(8).optional(),
    marker: plotterMarkerStyle.optional(),
    markerEvery: z.number().finite().int().min(1).max(64).optional(),
  });

  const schema = z.object({
    historyLength: z.number().finite().int().min(16).max(2048).optional(),
    sampleCount: z.number().finite().int().min(16).max(2048).optional(),
    verticalGain: z.number().finite().min(0.001).max(1e6).optional(),
    verticalOffset: z.number().finite().optional(),
    autoScale: z.boolean().optional(),
    yMin: z.number().finite().optional(),
    yMax: z.number().finite().optional(),
    showGrid: z.boolean().optional(),
    timeDivisions: z.number().finite().int().min(2).max(32).optional(),
    ampDivisions: z.number().finite().int().min(2).max(24).optional(),
    showLegend: z.boolean().optional(),
    channels: z.record(z.string(), channelSchema).optional(),
  });

  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
    return out;
  }
  const yMin = r.data.yMin;
  const yMax = r.data.yMax;
  if (
    typeof yMin === "number" &&
    typeof yMax === "number" &&
    Number.isFinite(yMin) &&
    Number.isFinite(yMax) &&
    yMin > yMax
  ) {
    out.push("yMin must be ≤ yMax");
  }
  return out;
}

function validateModelSelect(cfg: Record<string, unknown>): string[] {
  const schema = z
    .object({
      selectedStudioAssetId: z.string().optional(),
      selectedModelUrl: z.string().optional(),
      generatedChildNodeIds: z.array(z.string()).optional(),
    })
    .passthrough();
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateBooleanConstant(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    value: z.boolean().optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateGlbMaterialTexture(cfg: Record<string, unknown>): string[] {
  const schema = z
    .object({
      glbMaterialTextureSlot: z
        .enum(["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap"])
        .optional(),
      textureUrl: z.string().optional(),
      selectedStudioTextureAssetId: z.string().optional(),
    })
    .passthrough();
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateMeshPrimitive(cfg: Record<string, unknown>): string[] {
  const schema = z
    .object({
      meshBoxWidth: z.number().finite().positive().optional(),
      meshBoxHeight: z.number().finite().positive().optional(),
      meshBoxDepth: z.number().finite().positive().optional(),
      meshSphereRadius: z.number().finite().positive().optional(),
      meshSphereWidthSegments: z.number().int().min(3).optional(),
      meshSphereHeightSegments: z.number().int().min(3).optional(),
      meshPlaneWidth: z.number().finite().positive().optional(),
      meshPlaneHeight: z.number().finite().positive().optional(),
      meshCylinderRadiusTop: z.number().finite().min(0).optional(),
      meshCylinderRadiusBottom: z.number().finite().min(0).optional(),
      meshCylinderHeight: z.number().finite().positive().optional(),
      meshCylinderRadialSegments: z.number().int().min(3).optional(),
      meshConeRadius: z.number().finite().positive().optional(),
      meshConeHeight: z.number().finite().positive().optional(),
      meshConeRadialSegments: z.number().int().min(3).optional(),
      meshTorusRadius: z.number().finite().positive().optional(),
      meshTorusTube: z.number().finite().positive().optional(),
      meshTorusRadialSegments: z.number().int().min(3).optional(),
      meshTorusTubularSegments: z.number().int().min(3).optional(),
      meshCapsuleRadius: z.number().finite().positive().optional(),
      meshCapsuleLength: z.number().finite().positive().optional(),
      meshCapsuleCapSegments: z.number().int().min(1).optional(),
      meshCapsuleRadialSegments: z.number().int().min(3).optional(),
    })
    .passthrough();
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateMeshGroup(cfg: Record<string, unknown>): string[] {
  const schema = z
    .object({
      meshInputCount: z.number().int().min(2).max(8).optional(),
    })
    .passthrough();
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateMeshMaterial(cfg: Record<string, unknown>): string[] {
  const schema = z
    .object({
      meshMaterialColorHex: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "must be #RRGGBB hex")
        .optional(),
      meshMaterialOpacity: z.number().finite().min(0).max(1).optional(),
      meshMaterialRoughness: z.number().finite().min(0).max(1).optional(),
      meshMaterialMetalness: z.number().finite().min(0).max(1).optional(),
      meshMaterialWireframe: z.boolean().optional(),
      meshMaterialClearcoat: z.number().finite().min(0).max(1).optional(),
      meshMaterialClearcoatRoughness: z.number().finite().min(0).max(1).optional(),
      meshMaterialTransmission: z.number().finite().min(0).max(1).optional(),
    })
    .passthrough();
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateGlbMaterialColor(cfg: Record<string, unknown>): string[] {
  const schema = z
    .object({
      glbMaterialColorTarget: z.enum(["baseColor", "emissiveColor"]).optional(),
      glbMaterialColorHex: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "must be #RRGGBB hex")
        .optional(),
    })
    .passthrough();
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateMaterialMix(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    factor: z.number().finite().min(0).max(1).optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateGlbAnimationBundle(cfg: Record<string, unknown>): string[] {
  const markerRow = z.object({
    timeS: z.number().finite(),
    label: z.string().min(1),
  });
  const clipState = z
    .object({
      timeS: z.number().finite().nonnegative().optional(),
      speed: z.number().finite().optional(),
      enabled: z.boolean().optional(),
      loopMode: z.enum(["once", "loop", "pingpong"]).optional(),
      trimStartS: z.number().finite().nonnegative().optional(),
      trimEndS: z.number().finite().nonnegative().optional(),
      fadeInMs: z.number().finite().nonnegative().optional(),
      fadeOutMs: z.number().finite().nonnegative().optional(),
      weight: z.number().finite().min(0).max(1).optional(),
      markers: z.array(markerRow).optional(),
      maskPreset: z.string().optional(),
      followInspectorPlayhead: z.boolean().optional(),
      restartOnSolo: z.boolean().optional(),
    })
    .passthrough();
  const schema = z.object({
    clips: z.record(z.string(), clipState).optional(),
    sourceModelNodeId: z.string().optional(),
    animationClipCardOrder: z.array(z.string()).optional(),
    animationSoloClipRef: z.string().optional(),
    animationPlaybackMode: z.enum(["per-clip", "parallel-all", "sequence"]).optional(),
    animationBlendCompactView: z.boolean().optional(),
    animationCrossfadeS: z.number().finite().nonnegative().optional(),
    animationInspectorBlendPlaying: z.boolean().optional(),
    animationInspectorPlayingRefs: z.array(z.string()).optional(),
    animationInspectorSequenceActiveRef: z.string().nullable().optional(),
    animationInspectorExpandedClipIndex: z.number().int().optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateAnimationClip(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    clipName: z.string().optional(),
    timeS: z.number().finite().nonnegative().optional(),
    speed: z.number().finite().optional(),
    weight: z.number().finite().min(0).max(1).optional(),
    loopMode: z.enum(["once", "loop", "pingpong"]).optional(),
    enabled: z.boolean().optional(),
    sourceModelNodeId: z.string().optional(),
    glbExtractKind: z.string().optional(),
    glbExtractRef: z.string().optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateAnimationMerge(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    animationInputCount: z.number().int().min(2).max(8).optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateAnimationMix(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    animationInputCount: z.number().int().min(2).max(8).optional(),
    mixWeights: z.array(z.number().finite().nonnegative()).max(8).optional(),
    normalizeWeights: z.boolean().optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateAnimationBlend(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    factor: z.number().finite().min(0).max(1).optional(),
    crossfadeS: z.number().finite().nonnegative().optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateGlbPartTransform(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    version: z.literal(1).optional(),
    position: z
      .object({
        x: z.number().finite(),
        y: z.number().finite(),
        z: z.number().finite(),
      })
      .optional(),
    rotationDeg: z
      .object({
        x: z.number().finite(),
        y: z.number().finite(),
        z: z.number().finite(),
      })
      .optional(),
    scale: z
      .object({
        x: z.number().finite(),
        y: z.number().finite(),
        z: z.number().finite(),
      })
      .optional(),
    sourceModelNodeId: z.string().optional(),
    glbExtractKind: z.string().optional(),
    glbExtractRef: z.string().optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validatePartSpin(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    spinAxis: z.enum(["x", "y", "z"]).optional(),
    speedRadS: z.number().finite().optional(),
    reverse: z.boolean().optional(),
    enabled: z.boolean().optional(),
    sourceModelNodeId: z.string().optional(),
    glbExtractKind: z.string().optional(),
    glbExtractRef: z.string().optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateNumberConstant(cfg: Record<string, unknown>): string[] {
  const schema = z
    .object({
      value: z.number().finite().optional(),
      numberMode: z.enum(["float", "integer"]).optional(),
      min: z.number().finite().nullable().optional(),
      max: z.number().finite().nullable().optional(),
      step: z.number().finite().positive().nullable().optional(),
      glbExtractKind: z.string().optional(),
      glbExtractRef: z.string().optional(),
    })
    .superRefine((o, ctx) => {
      if (o.min != null && o.max != null && o.min > o.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "min must be ≤ max when both are set",
          path: ["min"],
        });
      }
    });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}
