/** Elapsed time while waiting for the first streamed token (live-updating display). */
export function formatAssistantElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return "0.0s";
  }
  if (ms < 60_000) {
    const s = ms / 1000;
    return s < 10 ? `${s.toFixed(1)}s` : `${Math.floor(ms / 1000)}s`;
  }
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m\u202f${s.toString().padStart(2, "0")}s`;
}
