import type {
  PresentationBmi270Frame,
  PresentationBmm350Frame,
  PresentationDps368Frame,
  PresentationSht40Frame,
} from "../../../presentation/display/selectors";
import type { DiagramBindingV1 } from "../../schemas/diagram.v1";
import {
  catalogBindingDisplayUnitKind,
  defaultDisplayUnitFieldsForPath,
  resolveBindingDisplayUnitForBinding,
} from "./courseBindingDisplayUnit";
import { DIAGRAM_BINDING_CATALOG } from "./diagramBindingCatalogEntries";
import type {
  DiagramBindingCatalogEntry,
  DiagramBindingSensorId,
  DiagramLiveSnapshot,
} from "./diagramBindingCatalog.types";

export type {
  DiagramBindingCatalogEntry,
  DiagramBindingSensorId,
  DiagramLiveSnapshot,
  CourseBindingSensorTab,
} from "./diagramBindingCatalog.types";
export { COURSE_BINDING_SENSOR_TABS } from "./diagramBindingCatalog.types";

export { DIAGRAM_BINDING_CATALOG };

export type DiagramBindingPathId = (typeof DIAGRAM_BINDING_CATALOG)[number]["id"];

const BMI270_PATHS: Record<string, keyof PresentationBmi270Frame> = {
  "bmi270.ax": "ax",
  "bmi270.ay": "ay",
  "bmi270.az": "az",
  "bmi270.gx": "gx",
  "bmi270.gy": "gy",
  "bmi270.gz": "gz",
  "bmi270.heading": "heading",
  "bmi270.pitch": "pitch",
  "bmi270.roll": "roll",
  "bmi270.qw": "qw",
  "bmi270.qx": "qx",
  "bmi270.qy": "qy",
  "bmi270.qz": "qz",
  "bmi270.temp": "temp",
  "bmi270.accValid": "accValid",
  "bmi270.gyrValid": "gyrValid",
  "bmi270.eulerValid": "eulerValid",
  "bmi270.quatValid": "quatValid",
  "bmi270.hasSample": "hasSample",
};

const BMM350_PATHS: Record<string, keyof PresentationBmm350Frame> = {
  "bmm350.bx": "bx",
  "bmm350.by": "by",
  "bmm350.bz": "bz",
  "bmm350.magnitude": "magnitude",
  "bmm350.headingDeg": "headingDeg",
  "bmm350.temp": "temp",
  "bmm350.magValid": "magValid",
  "bmm350.tempValid": "tempValid",
  "bmm350.hasSample": "hasSample",
};

const SHT40_PATHS: Record<string, keyof PresentationSht40Frame> = {
  "sht40.temp": "temp",
  "sht40.rh": "rh",
  "sht40.tempValid": "tempValid",
  "sht40.rhValid": "rhValid",
  "sht40.hasSample": "hasSample",
};

const DPS368_PATHS: Record<string, keyof PresentationDps368Frame> = {
  "dps368.pressureHpa": "pressureHpa",
  "dps368.temp": "temp",
  "dps368.altitudeM": "altitudeM",
  "dps368.pressureValid": "pressureValid",
  "dps368.tempValid": "tempValid",
  "dps368.hasSample": "hasSample",
};

function readFrameField<T extends Record<string, unknown>>(
  paths: Record<string, keyof T>,
  path: string,
  frame: T,
): number | boolean | null {
  const key = paths[path];
  if (key == null) {
    return null;
  }
  return frame[key] as number | boolean;
}

function resolveBmi270Path(path: string, frame: PresentationBmi270Frame): number | boolean | null {
  if (path === "bmi270.accMag") {
    return Math.hypot(frame.ax, frame.ay, frame.az);
  }
  if (path === "bmi270.gyrMag") {
    return Math.hypot(frame.gx, frame.gy, frame.gz);
  }
  if (path === "bmi270.axAbs") {
    return Math.abs(frame.ax);
  }
  if (path === "bmi270.ayAbs") {
    return Math.abs(frame.ay);
  }
  if (path === "bmi270.azAbs") {
    return Math.abs(frame.az);
  }
  return readFrameField(BMI270_PATHS, path, frame);
}

export function resolveDiagramBindingPath(
  path: string,
  snapshot: DiagramLiveSnapshot,
): number | boolean | null {
  if (path === "bridge.connected") {
    return snapshot.connected;
  }
  if (path.startsWith("bmi270.")) {
    return resolveBmi270Path(path, snapshot.bmi270);
  }
  if (path.startsWith("bmm350.")) {
    return readFrameField(BMM350_PATHS, path, snapshot.bmm350);
  }
  if (path.startsWith("sht40.")) {
    return readFrameField(SHT40_PATHS, path, snapshot.sht40);
  }
  if (path.startsWith("dps368.")) {
    return readFrameField(DPS368_PATHS, path, snapshot.dps368);
  }
  return null;
}

export function catalogLabelForPath(path: string): string {
  return DIAGRAM_BINDING_CATALOG.find((entry) => entry.id === path)?.label ?? path;
}

export function catalogEntryForPath(path: string): DiagramBindingCatalogEntry | undefined {
  return DIAGRAM_BINDING_CATALOG.find((entry) => entry.id === path);
}

export function catalogSensorForPath(path: string | null | undefined): DiagramBindingSensorId {
  if (path == null || path.length === 0) {
    return "bmi270";
  }
  if (path.startsWith("bmm350.")) {
    return "bmm350";
  }
  if (path.startsWith("sht40.")) {
    return "sht40";
  }
  if (path.startsWith("dps368.")) {
    return "dps368";
  }
  if (path.startsWith("bridge.")) {
    return "bridge";
  }
  return "bmi270";
}

export function catalogCategoriesForSensor(
  sensor: DiagramBindingSensorId,
  valueKind?: "number" | "boolean",
): string[] {
  const categories = new Set<string>();
  for (const entry of DIAGRAM_BINDING_CATALOG) {
    if (entry.sensor !== sensor) {
      continue;
    }
    if (valueKind != null && entry.valueKind !== valueKind) {
      continue;
    }
    categories.add(entry.category);
  }
  return Array.from(categories);
}

/** Display unit: catalog display kinds honor binding preferences; else catalog default or override. */
export function resolveBindingDisplayUnit(binding: DiagramBindingV1): string {
  const displayKind = catalogBindingDisplayUnitKind(binding.path);
  if (displayKind != null) {
    return resolveBindingDisplayUnitForBinding(binding);
  }
  const catalogUnit = catalogEntryForPath(binding.path)?.unit;
  if (catalogUnit != null) {
    return catalogUnit;
  }
  return binding.unit ?? "";
}

export function bindingForCatalogPath(
  path: string,
  prev?: DiagramBindingV1 | null,
): DiagramBindingV1 {
  const entry = catalogEntryForPath(path);
  const next: DiagramBindingV1 = {
    path,
    fallback: typeof prev?.fallback === "number" ? prev.fallback : 0,
    map: prev?.map,
    format: prev?.format,
    ...defaultDisplayUnitFieldsForPath(path, prev),
  };
  if (catalogBindingDisplayUnitKind(path) == null && entry?.unit != null) {
    next.unit = entry.unit;
  }
  return next;
}

export function diagramBindingSelectOptions(includeStatic = false): Array<{ value: string; label: string }> {
  const catalog = DIAGRAM_BINDING_CATALOG.map((entry) => ({
    value: entry.id,
    label: entry.unit != null ? `${entry.label} (${entry.unit})` : entry.label,
  }));
  if (!includeStatic) {
    return catalog;
  }
  return [{ value: "__static__", label: "Static value" }, ...catalog];
}

export function snapshotHasSampleForBindingPath(
  path: string,
  snapshot: DiagramLiveSnapshot,
): boolean {
  if (path === "bridge.connected") {
    return snapshot.connected;
  }
  if (path.startsWith("bmm350.")) {
    return snapshot.bmm350.hasSample;
  }
  if (path.startsWith("sht40.")) {
    return snapshot.sht40.hasSample;
  }
  if (path.startsWith("dps368.")) {
    return snapshot.dps368.hasSample;
  }
  return snapshot.bmi270.hasSample;
}

export function snapshotHasAnySensorSample(snapshot: DiagramLiveSnapshot): boolean {
  return (
    snapshot.bmi270.hasSample ||
    snapshot.bmm350.hasSample ||
    snapshot.sht40.hasSample ||
    snapshot.dps368.hasSample
  );
}
