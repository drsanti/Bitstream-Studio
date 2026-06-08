/*******************************************************************************
 * File Name : landingOptions.ts
 *
 * Description : Workspace cards shown on the Bitstream Studio dev landing page.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { LucideIcon } from "lucide-react";
import { Activity, GraduationCap, Workflow } from "lucide-react";
import type { BitstreamWorkspaceId } from "../bitstream-app/state/bitstreamWorkspaceMode.store.js";

export type LandingAccent = "sky" | "emerald" | "amber";

export type LandingOption = {
  workspace: BitstreamWorkspaceId;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  accent: LandingAccent;
  icon: LucideIcon;
};

export const BITSTREAM_LANDING_OPTIONS: LandingOption[] = [
  {
    workspace: "sensor-telemetry",
    title: "Sensor Telemetry",
    subtitle: "Configure · diagnose · live streams",
    description:
      "Per-sensor firmware setup, BS2 telemetry deck, handshake and link diagnostics, and system logs for bring-up on real hardware or the external simulator.",
    tags: ["BS2", "UART", "Simulator", "BMI270", "Sensor cfg", "Diagnostics"],
    accent: "sky",
    icon: Activity,
  },
  {
    workspace: "sensor-studio",
    title: "Sensor Studio",
    subtitle: "Flows · 2D/3D · asset preview",
    description:
      "Visual flow editor for sensor pipelines, chart and 3D preview, plus asset manager hooks for models and textures used in studio scenes.",
    tags: ["Flow editor", "Charts", "3D preview", "Assets", "LVGL port"],
    accent: "emerald",
    icon: Workflow,
  },
  {
    workspace: "course-studio",
    title: "Course Studio",
    subtitle: "Alive documents · theory · live diagrams",
    description:
      "Grid-based course pages with KaTeX theory markdown, callouts, 2D diagrams bound to live BMI270 data, and maintainer authoring in dev mode.",
    tags: ["page.v1", "Theory", "Diagrams", "Live metrics", "Maintainer"],
    accent: "amber",
    icon: GraduationCap,
  },
];
