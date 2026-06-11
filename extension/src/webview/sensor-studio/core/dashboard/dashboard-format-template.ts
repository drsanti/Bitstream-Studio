export function coerceDashboardFormatTemplate(raw: unknown): string {
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw;
  }
  return "{{value}}";
}

export function coerceDashboardFormatFallback(raw: unknown): string {
  if (typeof raw === "string") {
    return raw;
  }
  return "—";
}

/** Interpolate `{{name}}` placeholders from a value map. */
export function formatDashboardTemplate(
  template: string,
  values: Record<string, string | number | null | undefined>,
  options?: { decimals?: number; fallback?: string },
): string {
  const fallback = options?.fallback ?? "—";
  const decimals = options?.decimals ?? 2;

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const v = values[key];
    if (v == null) {
      return fallback;
    }
    if (typeof v === "number") {
      if (!Number.isFinite(v)) {
        return fallback;
      }
      return v.toFixed(decimals);
    }
    const text = String(v).trim();
    return text.length > 0 ? text : fallback;
  });
}

export function formatDashboardNumericTemplate(args: {
  template: string;
  value: number | null;
  unit?: string;
  decimals?: number;
  fallback?: string;
}): string {
  const unit = args.unit?.trim() ?? "";
  return formatDashboardTemplate(
    args.template,
    {
      value: args.value,
      unit,
    },
    { decimals: args.decimals, fallback: args.fallback },
  );
}
