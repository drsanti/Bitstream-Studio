import type { NodeCatalogEntry } from "../../../../core/config/config-types";

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
