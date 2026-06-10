import type { DiagramBindingV1 } from "../../schemas/diagram.v1";

export const diagramBindingAngularUnitSchema = ["deg", "rad"] as const;
export type DiagramBindingAngularUnit = (typeof diagramBindingAngularUnitSchema)[number];

export type CatalogAngularKind = "rate" | "angle";

const ANGULAR_RATE_PATHS = new Set<string>([
  "bmi270.gx",
  "bmi270.gy",
  "bmi270.gz",
  "bmi270.gyrMag",
]);

const ANGULAR_ANGLE_PATHS = new Set<string>([
  "bmi270.heading",
  "bmi270.pitch",
  "bmi270.roll",
  "bmm350.headingDeg",
]);

const DEG_TO_RAD = Math.PI / 180;

export function catalogAngularKind(path: string): CatalogAngularKind | null {
  if (ANGULAR_RATE_PATHS.has(path)) {
    return "rate";
  }
  if (ANGULAR_ANGLE_PATHS.has(path)) {
    return "angle";
  }
  return null;
}

export function resolveBindingAngularUnit(
  binding: DiagramBindingV1,
): DiagramBindingAngularUnit {
  return binding.angularUnit === "rad" ? "rad" : "deg";
}

/** Catalog paths store gyro rates and Euler angles in degrees; optional rad display. */
export function applyBindingAngularDisplay(
  valueDeg: number,
  binding: DiagramBindingV1,
): number {
  if (resolveBindingAngularUnit(binding) === "deg") {
    return valueDeg;
  }
  if (catalogAngularKind(binding.path) == null) {
    return valueDeg;
  }
  return valueDeg * DEG_TO_RAD;
}

export function resolveAngularDisplayUnit(
  binding: DiagramBindingV1,
  kind: CatalogAngularKind,
): string {
  const angularUnit = resolveBindingAngularUnit(binding);
  if (kind === "rate") {
    return angularUnit === "rad" ? "rad/s" : "°/s";
  }
  return angularUnit === "rad" ? "rad" : "°";
}
