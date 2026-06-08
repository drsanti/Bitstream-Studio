/** Multi-clip combiner used by the Build animation graph wizard (3+ clips). */
export type GlbAnimationSetupCombinerMode = "merge" | "mix";

export const GLB_ANIMATION_SETUP_COMBINER_OPTIONS = [
  {
    value: "merge" as const,
    label: "Merge",
    hint: "Ordered layering — later inputs override fields on the same clip name.",
  },
  {
    value: "mix" as const,
    label: "Mix",
    hint: "Weighted parallel blend — equal weights by default; tune in the inspector.",
  },
];
