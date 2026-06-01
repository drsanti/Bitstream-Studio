import { createWorkbenchLayoutValidator } from "../../ui/workbench/create-workbench-layout-validator";
import { DEFAULT_TELEMETRY_WORKBENCH_LAYOUT } from "./default-telemetry-workbench-layout";

export const validateTelemetryWorkbenchLayout = createWorkbenchLayoutValidator(
  DEFAULT_TELEMETRY_WORKBENCH_LAYOUT,
  ["config", "main", "telemetry", "activity"],
  "main",
);
