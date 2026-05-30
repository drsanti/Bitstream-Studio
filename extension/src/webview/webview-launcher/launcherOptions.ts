import type { LucideIcon } from "lucide-react";
import { Activity, Box } from "lucide-react";
import type { WebviewShellEntry } from "../state/webviewEntry.store";

export type LauncherAccent = "sky" | "emerald";

export type LauncherOption = {
  entry: WebviewShellEntry;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  accent: LauncherAccent;
  icon: LucideIcon;
};

export const LAUNCHER_OPTIONS: LauncherOption[] = [
  {
    entry: "digitalTwin",
    title: "TERNION Digital Twin",
    subtitle: "Simulate · design · connect",
    description:
      "Machine and physics simulation, 3D product design, live external data to control robots and machines, and secured cloud connectivity.",
    tags: [
      "Machine simulation",
      "Physics",
      "Product design",
      "Quick scenes",
      "Model catalog",
      "T3D engine",
      "Cloud uplink",
    ],
    accent: "sky",
    icon: Box,
  },
  {
    entry: "bitstream",
    title: "TERNION Sensor Studio",
    subtitle: "Configure · diagnose · live flows",
    description:
      "Per-sensor firmware setup, live telemetry, and system diagnostics, plus a flow editor for real-time 2D and 3D sensor visualization.",
    tags: [
      "Configure",
      "Diagnostics",
      "Flow studio",
      "BMI270",
      "BMM350",
      "SHT40",
      "DPS368",
    ],
    accent: "emerald",
    icon: Activity,
  },
];
