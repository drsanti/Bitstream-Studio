import type { DataTypeColorsConfig } from "../core/config/config-types";

export const DATA_TYPE_COLORS_DEFAULTS: DataTypeColorsConfig = {
  configVersion: 1,
  updatedAt: new Date(0).toISOString(),
  payload: {
    number: "#60A5FA",
    boolean: "#A78BFA",
    string: "#34D399",
    event: "#F59E0B",
    vector3: "#F472B6",
    quaternion: "#22D3EE",
    environment: "#86EFAC",
    camera: "#93C5FD",
    glbAnimation: "#FBBF24",
  },
};
