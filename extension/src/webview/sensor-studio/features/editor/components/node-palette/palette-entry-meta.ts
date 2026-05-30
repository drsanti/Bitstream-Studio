import type { NodeCatalogEntry } from "../../../../core/config/config-types";

/** Sensor grouping for INPUT palette rows only (non-input categories omit subgroup). */
export type PaletteInputSubgroup =
  | "general"
  | "bmi270"
  | "dps368"
  | "sht40"
  | "bmm350"
  | "quaternion";

/** Order of sections within INPUT when using sectioned / accordion layouts. */
export const PALETTE_INPUT_SUBGROUP_ORDER: PaletteInputSubgroup[] = [
  "general",
  "bmi270",
  "dps368",
  "sht40",
  "bmm350",
  "quaternion",
];

const SUBGROUP_LABEL: Record<PaletteInputSubgroup, string> = {
  general: "General",
  bmi270: "BMI270",
  dps368: "DPS368",
  sht40: "SHT40",
  bmm350: "BMM350",
  quaternion: "Quaternion",
};

/** Short chip text for narrow palettes. */
const SUBGROUP_CHIP: Record<PaletteInputSubgroup, string> = {
  general: "GEN",
  bmi270: "BMI",
  dps368: "DPS",
  sht40: "SHT",
  bmm350: "BMM",
  quaternion: "QUAT",
};

function inputSubgroupFromId(id: string): PaletteInputSubgroup {
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
  /** Short tag for chips (INPUT nodes); null for transform/output/utility. */
  chip: string | null;
  /** INPUT-only subgroup; null when `entry.category !== "input"`. */
  inputSubgroup: PaletteInputSubgroup | null;
  /** Human header for section / accordion. */
  subgroupLabel: string;
  /** Second line for “two-line” layout. */
  subtitle: string;
};

export function getSubgroupLabel(subgroup: PaletteInputSubgroup): string {
  return SUBGROUP_LABEL[subgroup];
}

export function getPaletteEntryMeta(entry: NodeCatalogEntry): PaletteEntryMeta {
  if (entry.category !== "input") {
    return {
      chip: null,
      inputSubgroup: null,
      subgroupLabel: "",
      subtitle: entry.description,
    };
  }

  const inputSubgroup = inputSubgroupFromId(entry.id);
  const subgroupLabel = SUBGROUP_LABEL[inputSubgroup];
  const chip = SUBGROUP_CHIP[inputSubgroup];
  const subtitle = `${subgroupLabel} · ${entry.title}`;

  return {
    chip,
    inputSubgroup,
    subgroupLabel,
    subtitle,
  };
}
