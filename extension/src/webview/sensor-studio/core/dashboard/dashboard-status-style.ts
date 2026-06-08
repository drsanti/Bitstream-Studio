export type DashboardStatusToneV1 = "success" | "warn" | "danger" | "neutral";

export type DashboardStatusStyleV1 = {
  onLabel: string;
  offLabel: string;
  onTone: DashboardStatusToneV1;
  offTone: DashboardStatusToneV1;
};

const TONE_CLASS: Record<DashboardStatusToneV1, string> = {
  success: "border-emerald-500/40 bg-emerald-950/50 text-emerald-200",
  warn: "border-amber-500/40 bg-amber-950/50 text-amber-100",
  danger: "border-red-500/40 bg-red-950/50 text-red-100",
  neutral: "border-zinc-600/60 bg-zinc-900/70 text-zinc-200",
};

export function coerceDashboardStatusToneV1(raw: unknown): DashboardStatusToneV1 {
  if (raw === "success" || raw === "warn" || raw === "danger" || raw === "neutral") {
    return raw;
  }
  return "neutral";
}

export function coerceDashboardStatusStyleV1(
  raw: Record<string, unknown>,
): DashboardStatusStyleV1 {
  return {
    onLabel:
      typeof raw.onLabel === "string" && raw.onLabel.trim().length > 0
        ? raw.onLabel.trim()
        : "OK",
    offLabel:
      typeof raw.offLabel === "string" && raw.offLabel.trim().length > 0
        ? raw.offLabel.trim()
        : "Fault",
    onTone: coerceDashboardStatusToneV1(raw.onTone ?? "success"),
    offTone: coerceDashboardStatusToneV1(raw.offTone ?? "danger"),
  };
}

export function dashboardStatusToneClass(tone: DashboardStatusToneV1): string {
  return TONE_CLASS[tone];
}
