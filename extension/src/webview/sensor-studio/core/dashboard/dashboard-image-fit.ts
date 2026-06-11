export type DashboardImageFitV1 = "contain" | "cover";

export function coerceDashboardImageFit(raw: unknown): DashboardImageFitV1 {
  return raw === "cover" ? "cover" : "contain";
}

export function readDashboardImageUrl(
  dc: Record<string, unknown>,
  wired: unknown,
): string {
  if (typeof wired === "string" && wired.trim().length > 0) {
    return wired.trim();
  }
  const raw = dc.imageUrl;
  return typeof raw === "string" ? raw.trim() : "";
}
