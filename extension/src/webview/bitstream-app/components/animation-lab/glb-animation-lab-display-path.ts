/** Short path for inspector (last URL segments). */
export function glbAnimationLabDisplayPath(fetchUrl: string): string {
  const t = fetchUrl.trim();
  if (t.length === 0) {
    return "—";
  }
  try {
    if (/^(https?:|blob:|data:)/i.test(t)) {
      const u = new URL(t);
      const parts = u.pathname.split("/").filter((p) => p.length > 0);
      if (parts.length > 0) {
        return parts.slice(-4).join("/");
      }
      return u.hostname;
    }
  } catch {
    // fall through
  }
  const normalized = t.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(idx + 1) : normalized;
}
