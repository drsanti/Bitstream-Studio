import { Moon, Sun, Radio } from "lucide-react";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store";
import { useWsClientStore } from "../../ws-client-store";
import { usePresentationThemeStore } from "../store/usePresentationThemeStore";
import { flatSlides } from "../chapters/registry";
import { useChapterStore } from "../app/useChapterStore";
import { PresenterToolbar } from "./PresenterToolbar";

export function PresentationTopBar() {
  const slideIndex = useChapterStore((s) => s.slideIndex);
  const theme = usePresentationThemeStore((s) => s.theme);
  const toggleTheme = usePresentationThemeStore((s) => s.toggle);
  const connected = useBitstreamConnectionStore((s) => s.connected);
  const wsConnected = useWsClientStore((s) => s.connected);

  const slide = flatSlides[slideIndex];
  const live = connected && wsConnected;

  return (
    <header className="presentation-topbar flex h-11 shrink-0 items-center justify-between border-b px-4">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {slide?.chapterTitle ?? "Presentation"}
        </div>
        <div className="truncate text-2xs text-[var(--text-muted)]">
          {slide?.title ?? ""} · {slide?.mode ?? "theory"}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <PresenterToolbar />
        <div
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold"
          style={{
            color: live ? "var(--status-live)" : "var(--text-muted)",
            borderColor: live
              ? "color-mix(in srgb, var(--status-live) 35%, transparent)"
              : "var(--surface-border)",
            background: live ? "var(--accent-green-bg)" : "var(--surface-card)",
          }}
        >
          <Radio size={12} strokeWidth={2} />
          {live ? "Live store" : "No link"}
        </div>

        <TRNTooltip
          content={theme === "dark" ? "Light theme" : "Dark theme"}
          openDelayMs={TRN_HINT_HOVER_DELAY_MS}
          disableHoverFx
          triggerWrapper="span"
          triggerClassName="inline-flex"
          trigger={
            <button
              type="button"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
            </button>
          }
        />
      </div>
    </header>
  );
}
