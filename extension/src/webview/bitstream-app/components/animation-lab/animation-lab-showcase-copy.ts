import type { GlbAnimationLabPlaybackMode } from "./glb-animation-lab.types.js";

export const ANIMATION_LAB_INSPECTOR_FONT_CLASS = "font-sans";

export const ANIMATION_LAB_SCRUB_INPUT_CLASS =
  "font-sans text-[11px] tabular-nums text-zinc-100";

export type AnimationLabShowcasePlaybackModeOption = {
  value: GlbAnimationLabPlaybackMode;
  label: string;
  hint: string;
};

export const ANIMATION_LAB_SHOWCASE_PLAYBACK_MODES: AnimationLabShowcasePlaybackModeOption[] =
  [
    {
      value: "per-clip",
      label: "One animation",
      hint: "Play a single move; switch anytime",
    },
    {
      value: "parallel-all",
      label: "All at once",
      hint: "Layer every animation on the model",
    },
    {
      value: "sequence",
      label: "One after another",
      hint: "Plays each move in order, like a short show",
    },
  ];

export type AnimationLabShowcaseLoopOption = {
  value: "loop" | "once" | "pingpong";
  label: string;
  hint: string;
};

export const ANIMATION_LAB_SHOWCASE_LOOP_OPTIONS: AnimationLabShowcaseLoopOption[] = [
  { value: "loop", label: "Loop", hint: "Repeat from start when the clip ends" },
  { value: "once", label: "Once", hint: "Play one time and stop" },
  {
    value: "pingpong",
    label: "Back and forth",
    hint: "Play forward, then reverse, and repeat",
  },
];
