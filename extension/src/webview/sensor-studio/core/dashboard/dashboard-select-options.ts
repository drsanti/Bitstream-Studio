export type DashboardSelectOptionV1 = {
  value: string;
  label: string;
};

const DEFAULT_DASHBOARD_SELECT_OPTIONS: readonly DashboardSelectOptionV1[] = [
  { value: "off", label: "Off" },
  { value: "auto", label: "Auto" },
  { value: "on", label: "On" },
];

export function dashboardSelectDefaultOptions(): DashboardSelectOptionV1[] {
  return DEFAULT_DASHBOARD_SELECT_OPTIONS.map((opt) => ({ ...opt }));
}

export function coerceDashboardSelectOptions(raw: unknown): DashboardSelectOptionV1[] {
  if (!Array.isArray(raw)) {
    return dashboardSelectDefaultOptions();
  }
  const options: DashboardSelectOptionV1[] = [];
  for (const entry of raw) {
    if (entry == null || typeof entry !== "object") {
      continue;
    }
    const rec = entry as Record<string, unknown>;
    const value = typeof rec.value === "string" ? rec.value.trim() : "";
    const label = typeof rec.label === "string" ? rec.label.trim() : value;
    if (value.length === 0) {
      continue;
    }
    options.push({ value, label: label.length > 0 ? label : value });
  }
  return options.length > 0 ? options : dashboardSelectDefaultOptions();
}

export function readDashboardSelectValue(
  dc: Record<string, unknown>,
  options: readonly DashboardSelectOptionV1[],
): string {
  const raw = dc.value;
  if (typeof raw === "string" && raw.length > 0) {
    if (options.some((opt) => opt.value === raw)) {
      return raw;
    }
  }
  return options[0]?.value ?? "";
}
