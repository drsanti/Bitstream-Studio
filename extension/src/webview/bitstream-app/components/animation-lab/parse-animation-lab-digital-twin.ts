import { catalogDedupeKeyToResolveRelativePath } from "../../../model-catalog/modelCatalogMerge.js";
import type {
  AnimationLabDigitalTwinDef,
  AnimationLabTwinComponentDef,
  AnimationLabTwinLocaleLabels,
  AnimationLabTwinSignalDef,
} from "./digital-twin.types.js";

function parseLabelLocales(rec: Record<string, unknown>): AnimationLabTwinLocaleLabels | undefined {
  const labelTh = rec.labelTh ?? rec.label_th;
  if (typeof labelTh === "string" && labelTh.trim().length > 0) {
    return { th: labelTh.trim() };
  }
  const labels = rec.labels ?? rec.labelLocales ?? rec.label_locales;
  if (labels == null || typeof labels !== "object" || Array.isArray(labels)) {
    return undefined;
  }
  const row = labels as Record<string, unknown>;
  const th = row.th ?? row["th-TH"];
  const out: AnimationLabTwinLocaleLabels = {};
  if (typeof th === "string" && th.trim().length > 0) {
    out.th = th.trim();
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
import { buildDefaultDroneDigitalTwinFromClips } from "./build-default-drone-digital-twin.js";

const metadataModules = {
  ...(import.meta.glob("../../../assets/free/models/**/*.json", {
    eager: true,
  }) as Record<string, unknown>),
  ...(import.meta.glob("../../../assets/tesaiot/models/**/*.json", {
    eager: true,
  }) as Record<string, unknown>),
  ...(import.meta.glob("../../../assets/models/**/*.json", {
    eager: true,
  }) as Record<string, unknown>),
};

function jsonModuleToObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) {
    return null;
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "object" && "default" in (raw as object)) {
    const d = (raw as { default?: unknown }).default;
    if (d != null && typeof d === "object" && !Array.isArray(d)) {
      return d as Record<string, unknown>;
    }
  }
  return null;
}

function globPathToModelDirectory(globPath: string): string {
  const normalized = globPath.replace(/\\/g, "/");
  const assetsIdx = normalized.indexOf("/assets/");
  const tail =
    assetsIdx >= 0 ? normalized.slice(assetsIdx + "/assets/".length) : normalized.replace(/^\.\.\/+/, "");
  const segments = tail.split("/").filter(Boolean);
  if (segments.length < 2) {
    return "";
  }
  return segments.slice(0, -1).join("/");
}

function parseSignal(row: unknown): AnimationLabTwinSignalDef | null {
  if (row == null || typeof row !== "object" || Array.isArray(row)) {
    return null;
  }
  const rec = row as Record<string, unknown>;
  const key = rec.key;
  const label = rec.label;
  if (typeof key !== "string" || key.trim().length === 0) {
    return null;
  }
  if (typeof label !== "string" || label.trim().length === 0) {
    return null;
  }
  const unit = typeof rec.unit === "string" ? rec.unit : "";
  const signal: AnimationLabTwinSignalDef = {
    key: key.trim(),
    label: label.trim(),
    unit,
  };
  const labelLocales = parseLabelLocales(rec);
  if (labelLocales != null) {
    signal.labelLocales = labelLocales;
  }
  const warn = rec.warn ?? rec.warnThreshold;
  const alarm = rec.alarm ?? rec.alarmThreshold;
  if (typeof warn === "number" && Number.isFinite(warn)) {
    signal.warn = warn;
  }
  if (typeof alarm === "number" && Number.isFinite(alarm)) {
    signal.alarm = alarm;
  }
  const dir = rec.direction;
  if (dir === "above" || dir === "below") {
    signal.direction = dir;
  }
  const liveSourceKey = rec.liveSourceKey ?? rec.live_source_key;
  if (typeof liveSourceKey === "string" && liveSourceKey.trim().length > 0) {
    signal.liveSourceKey = liveSourceKey.trim();
  }
  return signal;
}

function parseAnchorOffset(raw: unknown): [number, number, number] | undefined {
  if (!Array.isArray(raw) || raw.length < 3) {
    return undefined;
  }
  const x = raw[0];
  const y = raw[1];
  const z = raw[2];
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof z !== "number" ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(z)
  ) {
    return undefined;
  }
  return [x, y, z];
}

function parseComponent(row: unknown): AnimationLabTwinComponentDef | null {
  if (row == null || typeof row !== "object" || Array.isArray(row)) {
    return null;
  }
  const rec = row as Record<string, unknown>;
  const id = rec.id;
  const label = rec.label;
  if (typeof id !== "string" || id.trim().length === 0) {
    return null;
  }
  if (typeof label !== "string" || label.trim().length === 0) {
    return null;
  }
  const signalsRaw = rec.signals;
  if (!Array.isArray(signalsRaw) || signalsRaw.length === 0) {
    return null;
  }
  const signals: AnimationLabTwinSignalDef[] = [];
  for (const s of signalsRaw) {
    const parsed = parseSignal(s);
    if (parsed != null) {
      signals.push(parsed);
    }
  }
  if (signals.length === 0) {
    return null;
  }
  const component: AnimationLabTwinComponentDef = {
    id: id.trim(),
    label: label.trim(),
    signals,
  };
  const componentLabelLocales = parseLabelLocales(rec);
  if (componentLabelLocales != null) {
    component.labelLocales = componentLabelLocales;
  }
  const group = rec.group;
  if (typeof group === "string" && group.trim().length > 0) {
    component.group = group.trim();
  }
  const anchor = rec.glbAnchor ?? rec.glb_anchor;
  if (typeof anchor === "string" && anchor.trim().length > 0) {
    component.glbAnchor = anchor.trim();
  }
  const anchorOffset = parseAnchorOffset(rec.anchorOffset ?? rec.anchor_offset);
  if (anchorOffset != null) {
    component.anchorOffset = anchorOffset;
  }
  const cardIcon = rec.cardIcon ?? rec.card_icon;
  if (typeof cardIcon === "string" && cardIcon.trim().length > 0) {
    component.cardIcon = cardIcon.trim();
  }
  return component;
}

function parseDigitalTwinBlock(data: Record<string, unknown>): AnimationLabDigitalTwinDef | null {
  const block = data.digitalTwin ?? data.digital_twin;
  if (block == null || typeof block !== "object" || Array.isArray(block)) {
    return null;
  }
  const rec = block as Record<string, unknown>;
  const assetId = rec.assetId ?? rec.asset_id;
  if (typeof assetId !== "string" || assetId.trim().length === 0) {
    return null;
  }
  const componentsRaw = rec.components;
  if (!Array.isArray(componentsRaw) || componentsRaw.length === 0) {
    return null;
  }
  const components: AnimationLabTwinComponentDef[] = [];
  for (const c of componentsRaw) {
    const parsed = parseComponent(c);
    if (parsed != null) {
      components.push(parsed);
    }
  }
  if (components.length === 0) {
    return null;
  }
  const twin: AnimationLabDigitalTwinDef = {
    assetId: assetId.trim(),
    components,
  };
  const label = rec.label;
  if (typeof label === "string" && label.trim().length > 0) {
    twin.label = label.trim();
  }
  return twin;
}

const twinByModelDirectory = new Map<string, AnimationLabDigitalTwinDef>();

for (const [jsonPath, raw] of Object.entries(metadataModules)) {
  const data = jsonModuleToObject(raw);
  if (data == null) {
    continue;
  }
  const twin = parseDigitalTwinBlock(data);
  if (twin == null) {
    continue;
  }
  const dir = globPathToModelDirectory(jsonPath);
  if (dir.length > 0) {
    twinByModelDirectory.set(dir.toLowerCase(), twin);
  }
}

function modelDirectoryFromDedupeKey(dedupeKey: string): string | null {
  const rel = catalogDedupeKeyToResolveRelativePath(dedupeKey);
  if (rel == null || rel.length === 0) {
    return null;
  }
  const dir = rel.replace(/\/[^/]+$/, "");
  return dir.length > 0 ? dir.toLowerCase() : null;
}

export function resolveAnimationLabDigitalTwin(args: {
  dedupeKey: string;
  clipNames: readonly string[];
}): AnimationLabDigitalTwinDef | null {
  const dir = modelDirectoryFromDedupeKey(args.dedupeKey);
  if (dir != null) {
    const fromMeta = twinByModelDirectory.get(dir);
    if (fromMeta != null) {
      return fromMeta;
    }
  }
  return buildDefaultDroneDigitalTwinFromClips(args.clipNames);
}
