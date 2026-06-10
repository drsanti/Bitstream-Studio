import type { DiagramBindingV1 } from "../../schemas/diagram.v1";
import {
  applyBindingAngularDisplay,
  catalogAngularKind,
  resolveAngularDisplayUnit,
  resolveBindingAngularUnit,
  type CatalogAngularKind,
} from "./courseBindingAngularUnit";

export const diagramBindingTemperatureUnitSchema = ["celsius", "fahrenheit"] as const;
export type DiagramBindingTemperatureUnit = (typeof diagramBindingTemperatureUnitSchema)[number];

export const diagramBindingAltitudeUnitSchema = ["m", "ft"] as const;
export type DiagramBindingAltitudeUnit = (typeof diagramBindingAltitudeUnitSchema)[number];

export type CatalogBindingDisplayUnitKind = CatalogAngularKind | "temperature" | "altitude";

const TEMPERATURE_PATHS = new Set<string>([
  "bmi270.temp",
  "bmm350.temp",
  "sht40.temp",
  "dps368.temp",
]);

const ALTITUDE_PATHS = new Set<string>(["dps368.altitudeM"]);

const M_TO_FT = 3.280839895;

export function catalogTemperaturePath(path: string): boolean {
  return TEMPERATURE_PATHS.has(path);
}

export function catalogAltitudePath(path: string): boolean {
  return ALTITUDE_PATHS.has(path);
}

/** Paths with a selectable display unit (wire values stay in catalog base units). */
export function catalogBindingDisplayUnitKind(path: string): CatalogBindingDisplayUnitKind | null {
  const angularKind = catalogAngularKind(path);
  if (angularKind != null) {
    return angularKind;
  }
  if (catalogTemperaturePath(path)) {
    return "temperature";
  }
  if (catalogAltitudePath(path)) {
    return "altitude";
  }
  return null;
}

export function resolveBindingTemperatureUnit(
  binding: DiagramBindingV1,
): DiagramBindingTemperatureUnit {
  return binding.temperatureUnit === "fahrenheit" ? "fahrenheit" : "celsius";
}

export function resolveBindingAltitudeUnit(binding: DiagramBindingV1): DiagramBindingAltitudeUnit {
  return binding.altitudeUnit === "ft" ? "ft" : "m";
}

export function celsiusToFahrenheit(celsius: number): number {
  return celsius * (9 / 5) + 32;
}

export function metersToFeet(meters: number): number {
  return meters * M_TO_FT;
}

/** Wire temperature paths are Celsius. */
export function applyBindingTemperatureDisplay(
  valueCelsius: number,
  binding: DiagramBindingV1,
): number {
  if (!catalogTemperaturePath(binding.path)) {
    return valueCelsius;
  }
  if (resolveBindingTemperatureUnit(binding) === "fahrenheit") {
    return celsiusToFahrenheit(valueCelsius);
  }
  return valueCelsius;
}

/** Wire altitude paths are meters. */
export function applyBindingAltitudeDisplay(valueMeters: number, binding: DiagramBindingV1): number {
  if (!catalogAltitudePath(binding.path)) {
    return valueMeters;
  }
  if (resolveBindingAltitudeUnit(binding) === "ft") {
    return metersToFeet(valueMeters);
  }
  return valueMeters;
}

/** Map/clamp first, then catalog display transforms (angular, temperature, altitude). */
export function applyBindingDisplayTransform(value: number, binding: DiagramBindingV1): number {
  const afterAngular = applyBindingAngularDisplay(value, binding);
  const afterTemp = applyBindingTemperatureDisplay(afterAngular, binding);
  return applyBindingAltitudeDisplay(afterTemp, binding);
}

export function resolveTemperatureDisplayUnit(binding: DiagramBindingV1): string {
  return resolveBindingTemperatureUnit(binding) === "fahrenheit" ? "°F" : "°C";
}

export function resolveAltitudeDisplayUnit(binding: DiagramBindingV1): string {
  return resolveBindingAltitudeUnit(binding) === "ft" ? "ft" : "m";
}

/** Resolved suffix for widgets and LIVE preview. */
export function resolveBindingDisplayUnitForBinding(binding: DiagramBindingV1): string {
  const unitOverride = binding.unit?.trim();
  if (unitOverride != null && unitOverride.length > 0) {
    return unitOverride;
  }
  const kind = catalogBindingDisplayUnitKind(binding.path);
  if (kind === "rate" || kind === "angle") {
    return resolveAngularDisplayUnit(binding, kind);
  }
  if (kind === "temperature") {
    return resolveTemperatureDisplayUnit(binding);
  }
  if (kind === "altitude") {
    return resolveAltitudeDisplayUnit(binding);
  }
  return binding.unit ?? "";
}

export function defaultDisplayUnitFieldsForPath(
  path: string,
  prev?: DiagramBindingV1 | null,
): Partial<DiagramBindingV1> {
  const kind = catalogBindingDisplayUnitKind(path);
  if (kind === "rate" || kind === "angle") {
    return { angularUnit: prev?.angularUnit ?? "deg" };
  }
  if (kind === "temperature") {
    return { temperatureUnit: prev?.temperatureUnit ?? "celsius" };
  }
  if (kind === "altitude") {
    return { altitudeUnit: prev?.altitudeUnit ?? "m" };
  }
  return {};
}
