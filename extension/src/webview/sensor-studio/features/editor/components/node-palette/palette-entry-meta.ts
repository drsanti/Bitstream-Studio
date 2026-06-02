import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { STUDIO_FLOW_SENSOR_HEADER_TAG_BY_NODE_ID } from "../../store/flow-editor.store";

/** Sensor grouping for SENSOR palette rows only (non-sensor categories omit subgroup). */
export type PaletteSensorSubgroup =
  | "general"
  | "bmi270"
  | "dps368"
  | "sht40"
  | "bmm350"
  | "quaternion";

/** Order of sections within Sensors when using sectioned / accordion layouts. */
export const PALETTE_SENSOR_SUBGROUP_ORDER: PaletteSensorSubgroup[] = [
  "general",
  "bmi270",
  "dps368",
  "sht40",
  "bmm350",
  "quaternion",
];

const SUBGROUP_LABEL: Record<PaletteSensorSubgroup, string> = {
  general: "General",
  bmi270: "BMI270",
  dps368: "DPS368",
  sht40: "SHT40",
  bmm350: "BMM350",
  quaternion: "Quaternion",
};

/** Short chip text for narrow palettes. */
const SUBGROUP_CHIP: Record<PaletteSensorSubgroup, string> = {
  general: "GEN",
  bmi270: "BMI",
  dps368: "DPS",
  sht40: "SHT",
  bmm350: "BMM",
  quaternion: "QUAT",
};

function sensorSubgroupFromId(id: string): PaletteSensorSubgroup {
  if (id === "sensor-input") {
    return "general";
  }
  if (id === "quat-input") {
    return "quaternion";
  }
  if (id.startsWith("bmi270-")) {
    return "bmi270";
  }
  if (id.startsWith("dps368-")) {
    return "dps368";
  }
  if (id.startsWith("sht40-")) {
    return "sht40";
  }
  if (id.startsWith("bmm350-")) {
    return "bmm350";
  }
  return "general";
}

export type PaletteEntryMeta = {
  /** Short tag for chips (sensor nodes); null for transform/output/utility. */
  chip: string | null;
  /** SENSOR-only subgroup; null when `entry.category !== "sensor"`. */
  sensorSubgroup: PaletteSensorSubgroup | null;
  /** Human header for section / accordion. */
  subgroupLabel: string;
  /** Second line for “two-line” layout. */
  subtitle: string;
};

export function getSubgroupLabel(subgroup: PaletteSensorSubgroup): string {
  return SUBGROUP_LABEL[subgroup];
}

export function getSubgroupChip(subgroup: PaletteSensorSubgroup): string {
  return SUBGROUP_CHIP[subgroup];
}

export const PALETTE_CATEGORY_LABEL: Record<NodeCatalogEntry["category"], string> = {
  sensor: "Sensors",
  input: "Input",
  transform: "Transform",
  logic: "Logic",
  output: "Output",
  utility: "Utility",
  generator: "Generator",
};

/** @deprecated Use {@link PaletteSensorSubgroup} */
export type PaletteInputSubgroup = PaletteSensorSubgroup;

/** @deprecated Use {@link PALETTE_SENSOR_SUBGROUP_ORDER} */
export const PALETTE_INPUT_SUBGROUP_ORDER = PALETTE_SENSOR_SUBGROUP_ORDER;

/** Hardware sensor families shown in Library sub-filter chips (F). */
export const PALETTE_SENSOR_FAMILY_SUBGROUPS = [
  "bmi270",
  "dps368",
  "sht40",
  "bmm350",
] as const satisfies readonly PaletteSensorSubgroup[];

export type PaletteSensorFamilySubgroup = (typeof PALETTE_SENSOR_FAMILY_SUBGROUPS)[number];

export function isPaletteSensorFamilySubgroup(
  sg: PaletteSensorSubgroup,
): sg is PaletteSensorFamilySubgroup {
  return (PALETTE_SENSOR_FAMILY_SUBGROUPS as readonly string[]).includes(sg);
}

/** Multi-pin catalog node for a hardware sensor (`bmi270-input`, …). */
export function isPaletteSensorPrimaryEntry(entry: NodeCatalogEntry): boolean {
  return (
    entry.category === "sensor" &&
    entry.id.endsWith("-input") &&
    entry.id !== "sensor-input" &&
    entry.id !== "quat-input"
  );
}

/** Single-output tap from a hardware sensor stream. */
export function isPaletteSensorTapEntry(entry: NodeCatalogEntry): boolean {
  return entry.category === "sensor" && entry.id.includes("-tap-");
}

/**
 * Node library line-2 previews that mirror UART / simulator telemetry.
 * Utility, generator, transform, and logic rows stay title + description only.
 */
export function paletteShowsHardwareLivePreview(entry: NodeCatalogEntry): boolean {
  if (isPaletteSensorPrimaryEntry(entry) || isPaletteSensorTapEntry(entry)) {
    return true;
  }
  return entry.id === "sensor-input" || entry.id === "quat-input";
}

export function resolvePaletteRowVariant(
  entry: NodeCatalogEntry,
  grouped: boolean,
): "default" | "primary" | "tap" {
  if (!grouped) {
    return "default";
  }
  if (isPaletteSensorPrimaryEntry(entry)) {
    return "primary";
  }
  if (isPaletteSensorTapEntry(entry)) {
    return "tap";
  }
  return "default";
}

export function splitSensorFamilyPanelEntries(entries: NodeCatalogEntry[]): {
  primary: NodeCatalogEntry | null;
  children: NodeCatalogEntry[];
} {
  const primary = entries.find(isPaletteSensorPrimaryEntry) ?? null;
  const taps: NodeCatalogEntry[] = [];
  const rest: NodeCatalogEntry[] = [];
  for (const entry of entries) {
    if (isPaletteSensorPrimaryEntry(entry)) {
      continue;
    }
    if (isPaletteSensorTapEntry(entry)) {
      taps.push(entry);
    } else {
      rest.push(entry);
    }
  }
  return { primary, children: [...taps, ...rest] };
}

/** Short port / stream label for library row subtitle (one item per row). */
export function getPaletteEntryPortLabel(entry: NodeCatalogEntry): string | null {
  if (isPaletteSensorPrimaryEntry(entry)) {
    const count = entry.outputPorts?.length ?? 0;
    return count > 0 ? `${count} outputs` : "stream";
  }
  const port = entry.outputPorts?.[0];
  if (port == null) {
    return null;
  }
  if (port.portType === "vector3") {
    return "vector3";
  }
  if (port.portType === "quaternion") {
    return "quaternion";
  }
  if (port.portType === "number") {
    return "number";
  }
  return port.portType;
}

/** Header badge on library row line 1 — family tag for taps, output count for primaries. */
export function getPaletteHeaderBadgeLabel(entry: NodeCatalogEntry): string | null {
  if (isPaletteSensorPrimaryEntry(entry)) {
    const count = entry.outputPorts?.length ?? 0;
    return count > 0 ? `${count} OUT` : null;
  }
  return STUDIO_FLOW_SENSOR_HEADER_TAG_BY_NODE_ID[entry.id] ?? null;
}

/** Primary stream nodes vs single-output tap subtitle prefix. */
export function getPaletteEntryKindLabel(entry: NodeCatalogEntry): string | null {
  if (isPaletteSensorPrimaryEntry(entry)) {
    return "Full stream";
  }
  if (isPaletteSensorTapEntry(entry)) {
    return getSubgroupLabel(sensorSubgroupFromId(entry.id));
  }
  return null;
}

export function getPaletteEntryMeta(entry: NodeCatalogEntry): PaletteEntryMeta {
  if (entry.category !== "sensor") {
    return {
      chip: null,
      sensorSubgroup: null,
      subgroupLabel: "",
      subtitle: entry.description,
    };
  }

  const sensorSubgroup = sensorSubgroupFromId(entry.id);
  const subgroupLabel = SUBGROUP_LABEL[sensorSubgroup];
  const chip = SUBGROUP_CHIP[sensorSubgroup];
  const subtitle = `${subgroupLabel} · ${entry.title}`;

  return {
    chip,
    sensorSubgroup,
    subgroupLabel,
    subtitle,
  };
}
