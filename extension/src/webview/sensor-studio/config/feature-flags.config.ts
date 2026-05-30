import type { FeatureFlagsConfig } from "../core/config/config-types";

export const FEATURE_FLAGS_DEFAULTS: FeatureFlagsConfig = {
  configVersion: 1,
  updatedAt: new Date(0).toISOString(),
  payload: {
    enableSparklineNode: true,
    enableDebugValueNode: true,
    enableInspectorAdvancedPanel: false,
    enableRuntimeTraceOverlay: false,
  },
};
