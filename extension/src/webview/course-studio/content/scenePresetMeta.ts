import type { LucideIcon } from "lucide-react";
import { Box, Compass, Cuboid, Orbit, CircuitBoard } from "lucide-react";

import type { CourseSceneTemplate } from "./sceneTemplates";

export type CourseScenePresetMeta = {
  template: CourseSceneTemplate;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClassName: string;
  /** Shows a Live chip when the template ships telemetry bindings. */
  liveBinding: boolean;
};

export const COURSE_SCENE_PRESETS: readonly CourseScenePresetMeta[] = [
  {
    template: "blank",
    title: "Blank scene",
    description: "Empty stage with grid, IBL, and contact shadows.",
    icon: Box,
    accentClassName: "border-violet-500/35 bg-violet-500/10 hover:bg-violet-500/16",
    liveBinding: false,
  },
  {
    template: "bmi-pcb",
    title: "BMI270 PCB",
    description: "Procedural PCB with live quaternion orientation.",
    icon: CircuitBoard,
    accentClassName: "border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/16",
    liveBinding: true,
  },
  {
    template: "gyro-gimbal",
    title: "Gyro gimbal",
    description: "Three-axis ring rig mapped to live ωX/ωY/ωZ.",
    icon: Orbit,
    accentClassName: "border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/16",
    liveBinding: true,
  },
  {
    template: "axis-triad",
    title: "Axis triad",
    description: "Static XYZ reference frame for board coordinates.",
    icon: Compass,
    accentClassName: "border-sky-500/35 bg-sky-500/10 hover:bg-sky-500/16",
    liveBinding: false,
  },
  {
    template: "simple-box",
    title: "Simple box",
    description: "Neutral placeholder mesh for layout experiments.",
    icon: Cuboid,
    accentClassName: "border-zinc-600/50 bg-zinc-800/35 hover:bg-zinc-800/55",
    liveBinding: false,
  },
] as const;

export function courseScenePresetMetaForTemplate(
  template: CourseSceneTemplate,
): CourseScenePresetMeta | undefined {
  return COURSE_SCENE_PRESETS.find((entry) => entry.template === template);
}
