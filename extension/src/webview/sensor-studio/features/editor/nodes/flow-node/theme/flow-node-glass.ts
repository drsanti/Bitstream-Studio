/**
 * Dark glass styling aligned with TRN (`TRNCard` / `TRNSectionContainer`) presets.
 * Kept local to flow nodes — no import from TRN components.
 */
export type FlowNodeGlassPreset = "soft" | "medium" | "strong";

export function flowNodeShellGlassClass(preset: FlowNodeGlassPreset): string {
  switch (preset) {
    case "soft":
      return "border-zinc-700/85 bg-zinc-900/70 backdrop-blur-sm";
    case "strong":
      return "border-zinc-700/70 bg-zinc-900/32 backdrop-blur-lg";
    default:
      return "border-zinc-700/80 bg-zinc-900/55 backdrop-blur-md";
  }
}

export function flowNodeHeaderGlassClass(preset: FlowNodeGlassPreset): string {
  switch (preset) {
    case "soft":
      return "from-zinc-900/70 to-zinc-800/55";
    case "strong":
      return "from-zinc-900/40 to-zinc-800/28";
    default:
      return "from-zinc-900/60 to-zinc-800/45";
  }
}
