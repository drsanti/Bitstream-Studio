import type { ThemeConfig } from "../core/config/config-types";

export const THEME_CONFIG_DEFAULTS: ThemeConfig = {
  configVersion: 1,
  updatedAt: new Date(0).toISOString(),
  payload: {
    color: {
      background: {
        canvas: "#0A0A0C",
        panel: "#111319",
      },
      border: {
        default: "#31343D",
      },
      text: {
        primary: "#E7E9EE",
        secondary: "#9AA1B2",
      },
      status: {
        ok: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#38BDF8",
      },
    },
  },
};
