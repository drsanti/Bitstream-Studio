/*******************************************************************************
 * File Name : telemetry-workbench-registry.tsx
 *
 * Description : WorkbenchRegistry entries for Sensor Telemetry panes.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 2.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Activity, Box, ScrollText, Settings2 } from "lucide-react";
import type { WorkbenchRegistry } from "../../ui/workbench";
import { TelemetryActivityPanel } from "../components/panels/TelemetryActivityPanel";
import { TelemetryConfigPanel } from "../components/panels/TelemetryConfigPanel";
import { TelemetryLivePanel } from "../components/panels/TelemetryLivePanel";
import { TelemetryMainPanel } from "../components/panels/TelemetryMainPanel";

export const TELEMETRY_WORKBENCH_REGISTRY: WorkbenchRegistry = {
  config: {
    icon: <Settings2 className="size-3.5" aria-hidden />,
    label: "Sensor Config",
    component: TelemetryConfigPanel,
  },
  main: {
    icon: <Box className="size-3.5" aria-hidden />,
    label: "Digital Twin",
    component: TelemetryMainPanel,
  },
  telemetry: {
    icon: <Activity className="size-3.5" aria-hidden />,
    label: "Telemetry Deck",
    component: TelemetryLivePanel,
  },
  activity: {
    icon: <ScrollText className="size-3.5" aria-hidden />,
    label: "Activity Log",
    component: TelemetryActivityPanel,
  },
};
