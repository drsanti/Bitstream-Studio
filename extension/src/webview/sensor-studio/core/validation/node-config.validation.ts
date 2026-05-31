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
    case "gauge":
      return validateGauge(safeCfg);
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
    case "glb-animation-bundle":
      return validateGlbAnimationBundle(safeCfg);
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
    inMin: z.number().finite().optional(),
    inMax: z.number().finite().optional(),
    outMin: z.number().finite().optional(),
    outMax: z.number().finite().optional(),
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

function validateGauge(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    unit: z.string().optional(),
    decimals: z.number().finite().int().min(0).max(6).optional(),
  });
  const r = schema.safeParse(cfg);
  const out: string[] = [];
  if (!r.success) {
    pushIssues(out, r.error.issues);
  }
  return out;
}

function validateSparkline(cfg: Record<string, unknown>): string[] {
  const schema = z.object({
    historySize: z.number().finite().int().min(8).max(512).optional(),
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
      cardValueControl: z.enum(["input", "slider"]).optional(),
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
