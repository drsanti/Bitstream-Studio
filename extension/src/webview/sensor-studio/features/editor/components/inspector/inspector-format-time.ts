/** Short clock time for inspector context bar (from ISO timestamp). */
export function formatInspectorUpdatedAt(iso: string | undefined): string {
  if (iso == null || iso.trim().length === 0) {
    return "—";
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso.length > 19 ? iso.slice(0, 19) : iso;
  }
  return parsed.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
