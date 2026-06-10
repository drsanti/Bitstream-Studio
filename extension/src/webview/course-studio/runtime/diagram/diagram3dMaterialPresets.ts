import type { Diagram3dMaterialV1 } from "../../schemas/diagram.v1";

export type Diagram3dMaterialPresetId =
  | "brushed-aluminum"
  | "matte-plastic-blue"
  | "polished-chrome"
  | "clear-glass"
  | "rubber"
  | "gold"
  | "copper"
  | "neon-cyan"
  | "white-ceramic"
  | "car-paint-red"
  | "frosted-glass"
  | "pcb-green";

export type Diagram3dMaterialPreset = {
  id: Diagram3dMaterialPresetId;
  label: string;
  hint: string;
  material: Diagram3dMaterialV1;
};

export const DIAGRAM_3D_MATERIAL_PRESETS: readonly Diagram3dMaterialPreset[] = [
  {
    id: "brushed-aluminum",
    label: "Brushed aluminum",
    hint: "Physical PBR metal with soft clearcoat.",
    material: {
      presetId: "brushed-aluminum",
      kind: "physical",
      color: "#b8bcc4",
      emissive: "#64748b",
      emissiveIntensity: 0.02,
      metalness: 1,
      roughness: 0.35,
      clearcoat: 0.12,
      clearcoatRoughness: 0.4,
    },
  },
  {
    id: "matte-plastic-blue",
    label: "Matte plastic (blue)",
    hint: "Standard dielectric with high roughness.",
    material: {
      presetId: "matte-plastic-blue",
      kind: "standard",
      color: "#3b82f6",
      emissive: "#1e3a8a",
      emissiveIntensity: 0.03,
      metalness: 0,
      roughness: 0.85,
    },
  },
  {
    id: "polished-chrome",
    label: "Polished chrome",
    hint: "Mirror-like physical metal.",
    material: {
      presetId: "polished-chrome",
      kind: "physical",
      color: "#e2e8f0",
      emissive: "#94a3b8",
      emissiveIntensity: 0.04,
      metalness: 1,
      roughness: 0.05,
    },
  },
  {
    id: "clear-glass",
    label: "Clear glass",
    hint: "Physical transmission with low roughness.",
    material: {
      presetId: "clear-glass",
      kind: "physical",
      color: "#ffffff",
      emissive: "#64748b",
      emissiveIntensity: 0,
      metalness: 0,
      roughness: 0.04,
      transmission: 0.92,
      ior: 1.5,
      thickness: 0.4,
    },
  },
  {
    id: "rubber",
    label: "Rubber",
    hint: "Dark matte standard material.",
    material: {
      presetId: "rubber",
      kind: "standard",
      color: "#27272a",
      emissive: "#18181b",
      emissiveIntensity: 0,
      metalness: 0,
      roughness: 0.95,
    },
  },
  {
    id: "gold",
    label: "Gold",
    hint: "Warm physical metal.",
    material: {
      presetId: "gold",
      kind: "physical",
      color: "#d4af37",
      emissive: "#854d0e",
      emissiveIntensity: 0.03,
      metalness: 1,
      roughness: 0.25,
    },
  },
  {
    id: "copper",
    label: "Copper",
    hint: "Physical metal with orange tint.",
    material: {
      presetId: "copper",
      kind: "physical",
      color: "#b87333",
      emissive: "#7c2d12",
      emissiveIntensity: 0.03,
      metalness: 1,
      roughness: 0.32,
    },
  },
  {
    id: "neon-cyan",
    label: "Neon emissive (cyan)",
    hint: "Bright emissive standard material.",
    material: {
      presetId: "neon-cyan",
      kind: "standard",
      color: "#0e7490",
      emissive: "#22d3ee",
      emissiveIntensity: 1.2,
      metalness: 0.15,
      roughness: 0.35,
    },
  },
  {
    id: "white-ceramic",
    label: "White ceramic",
    hint: "Low roughness dielectric.",
    material: {
      presetId: "white-ceramic",
      kind: "standard",
      color: "#f8fafc",
      emissive: "#e2e8f0",
      emissiveIntensity: 0.02,
      metalness: 0,
      roughness: 0.18,
    },
  },
  {
    id: "car-paint-red",
    label: "Car paint (red)",
    hint: "Physical clearcoat over saturated base.",
    material: {
      presetId: "car-paint-red",
      kind: "physical",
      color: "#dc2626",
      emissive: "#450a0a",
      emissiveIntensity: 0.02,
      metalness: 0.15,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
    },
  },
  {
    id: "frosted-glass",
    label: "Frosted glass",
    hint: "Physical transmission with higher roughness.",
    material: {
      presetId: "frosted-glass",
      kind: "physical",
      color: "#f1f5f9",
      emissive: "#cbd5e1",
      emissiveIntensity: 0,
      metalness: 0,
      roughness: 0.42,
      transmission: 0.65,
      ior: 1.45,
      thickness: 0.25,
    },
  },
  {
    id: "pcb-green",
    label: "PCB green",
    hint: "Course default board tint.",
    material: {
      presetId: "pcb-green",
      kind: "standard",
      color: "#1a4a2a",
      emissive: "#34D399",
      emissiveIntensity: 0.08,
      metalness: 0.2,
      roughness: 0.7,
    },
  },
] as const;

export const DIAGRAM_3D_MATERIAL_KIND_OPTIONS = [
  { value: "standard", label: "Standard (PBR)" },
  { value: "physical", label: "Physical (PBR+)" },
  { value: "basic", label: "Basic (unlit)" },
  { value: "lambert", label: "Lambert" },
  { value: "phong", label: "Phong" },
  { value: "toon", label: "Toon" },
] as const;

export function findDiagram3dMaterialPreset(
  presetId: string,
): Diagram3dMaterialPreset | undefined {
  return DIAGRAM_3D_MATERIAL_PRESETS.find((entry) => entry.id === presetId);
}

export function buildDiagram3dMaterialPresetSelectOptions(): {
  value: string;
  label: string;
}[] {
  return [
    { value: "", label: "Custom / node default" },
    ...DIAGRAM_3D_MATERIAL_PRESETS.map((entry) => ({
      value: entry.id,
      label: entry.label,
    })),
  ];
}
