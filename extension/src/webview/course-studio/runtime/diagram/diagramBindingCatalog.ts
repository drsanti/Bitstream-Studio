import type { PresentationBmi270Frame } from "../../../presentation/display/selectors";

export type DiagramLiveSnapshot = {
  bmi270: PresentationBmi270Frame;
  connected: boolean;
};

export type DiagramBindingCatalogEntry = {
  id: string;
  label: string;
  unit?: string;
  group: "BMI270 · Accel" | "BMI270 · Gyro" | "BMI270 · Fusion" | "BMI270 · Temperature" | "BMI270 · Status" | "Bridge";
  valueKind: "number" | "boolean";
};

/** Paths aligned with `presentationBmi270FromSample` / `PresentationBmi270Frame`. */
export const DIAGRAM_BINDING_CATALOG: readonly DiagramBindingCatalogEntry[] = [
  { id: "bmi270.ax", label: "Accelerometer X", unit: "g", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.axAbs", label: "Accelerometer |X|", unit: "g", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.ay", label: "Accelerometer Y", unit: "g", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.az", label: "Accelerometer Z", unit: "g", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.gx", label: "Gyro X", unit: "°/s", group: "BMI270 · Gyro", valueKind: "number" },
  { id: "bmi270.gy", label: "Gyro Y", unit: "°/s", group: "BMI270 · Gyro", valueKind: "number" },
  { id: "bmi270.gz", label: "Gyro Z", unit: "°/s", group: "BMI270 · Gyro", valueKind: "number" },
  { id: "bmi270.heading", label: "Heading", unit: "°", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.pitch", label: "Pitch", unit: "°", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.roll", label: "Roll", unit: "°", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.qw", label: "Quaternion W", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.qx", label: "Quaternion X", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.qy", label: "Quaternion Y", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.qz", label: "Quaternion Z", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.temp", label: "Temperature", unit: "°C", group: "BMI270 · Temperature", valueKind: "number" },
  { id: "bmi270.accValid", label: "Accel valid", group: "BMI270 · Status", valueKind: "boolean" },
  { id: "bmi270.gyrValid", label: "Gyro valid", group: "BMI270 · Status", valueKind: "boolean" },
  { id: "bmi270.eulerValid", label: "Euler valid", group: "BMI270 · Status", valueKind: "boolean" },
  { id: "bmi270.quatValid", label: "Quaternion valid", group: "BMI270 · Status", valueKind: "boolean" },
  { id: "bmi270.hasSample", label: "Has sample", group: "BMI270 · Status", valueKind: "boolean" },
  { id: "bridge.connected", label: "Bridge connected", group: "Bridge", valueKind: "boolean" },
] as const;

export type DiagramBindingPathId = (typeof DIAGRAM_BINDING_CATALOG)[number]["id"];

const BMI270_PATHS: Record<
  Exclude<DiagramBindingPathId, "bridge.connected">,
  keyof PresentationBmi270Frame
> = {
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

export function resolveDiagramBindingPath(
  path: string,
  snapshot: DiagramLiveSnapshot,
): number | boolean | null {
  if (path === "bridge.connected") {
    return snapshot.connected;
  }
  if (path === "bmi270.axAbs") {
    return Math.abs(snapshot.bmi270.ax);
  }
  const frameKey = BMI270_PATHS[path as keyof typeof BMI270_PATHS];
  if (frameKey == null) {
    return null;
  }
  return snapshot.bmi270[frameKey] as number | boolean;
}

export function catalogLabelForPath(path: string): string {
  return DIAGRAM_BINDING_CATALOG.find((entry) => entry.id === path)?.label ?? path;
}

export function catalogEntryForPath(path: string): DiagramBindingCatalogEntry | undefined {
  return DIAGRAM_BINDING_CATALOG.find((entry) => entry.id === path);
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
