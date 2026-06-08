export type DashboardThemePresetV1 = "studio-dark" | "high-contrast" | "slate";

export type DashboardThemeV1 = {
  version: 1;
  preset: DashboardThemePresetV1;
  canvasBackground: string;
  panelBackground: string;
  accentColor: string;
  textPrimary: string;
  textSecondary: string;
};

const PRESETS: Record<DashboardThemePresetV1, Omit<DashboardThemeV1, "version">> = {
  "studio-dark": {
    preset: "studio-dark",
    canvasBackground: "#09090b",
    panelBackground: "#18181b",
    accentColor: "#22d3ee",
    textPrimary: "#e4e4e7",
    textSecondary: "#a1a1aa",
  },
  "high-contrast": {
    preset: "high-contrast",
    canvasBackground: "#000000",
    panelBackground: "#111111",
    accentColor: "#facc15",
    textPrimary: "#ffffff",
    textSecondary: "#d4d4d8",
  },
  slate: {
    preset: "slate",
    canvasBackground: "#0f172a",
    panelBackground: "#1e293b",
    accentColor: "#38bdf8",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
  },
};

export function dashboardThemeDefault(): DashboardThemeV1 {
  return { version: 1, ...PRESETS["studio-dark"] };
}

function readPreset(value: unknown): DashboardThemePresetV1 {
  if (value === "high-contrast" || value === "slate") {
    return value;
  }
  return "studio-dark";
}

function readHex(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())) {
    return value.trim();
  }
  return fallback;
}

export function coerceDashboardThemeV1(raw: unknown): DashboardThemeV1 {
  const defaults = dashboardThemeDefault();
  if (raw == null || typeof raw !== "object") {
    return defaults;
  }
  const o = raw as Record<string, unknown>;
  const preset = readPreset(o.preset);
  const base = PRESETS[preset];
  return {
    version: 1,
    preset,
    canvasBackground: readHex(o.canvasBackground, base.canvasBackground),
    panelBackground: readHex(o.panelBackground, base.panelBackground),
    accentColor: readHex(o.accentColor, base.accentColor),
    textPrimary: readHex(o.textPrimary, base.textPrimary),
    textSecondary: readHex(o.textSecondary, base.textSecondary),
  };
}

export function dashboardThemeCssVars(theme: DashboardThemeV1): Record<string, string> {
  return {
    "--dashboard-canvas-bg": theme.canvasBackground,
    "--dashboard-panel-bg": theme.panelBackground,
    "--dashboard-accent": theme.accentColor,
    "--dashboard-text-primary": theme.textPrimary,
    "--dashboard-text-secondary": theme.textSecondary,
  };
}
