import { ArrowRight } from "lucide-react";
import type { LauncherOption } from "./launcherOptions";

type WebviewLauncherOptionCardProps = {
  option: LauncherOption;
  index: number;
  actionLabel?: string;
  onSelect: () => void;
};

const ACCENT_RING: Record<LauncherOption["accent"], string> = {
  sky: "from-sky-400/50 via-cyan-300/25 to-blue-600/40",
  emerald: "from-emerald-400/50 via-teal-300/25 to-cyan-600/40",
};

const ACCENT_GLOW: Record<LauncherOption["accent"], string> = {
  sky: "group-hover:shadow-[0_0_40px_rgba(56,189,248,0.22)] group-hover:border-sky-400/45",
  emerald:
    "group-hover:shadow-[0_0_40px_rgba(52,211,153,0.22)] group-hover:border-emerald-400/45",
};

const ACCENT_ICON: Record<LauncherOption["accent"], string> = {
  sky: "border-sky-400/35 bg-sky-500/10 text-sky-200 shadow-[0_0_24px_rgba(56,189,248,0.25)]",
  emerald:
    "border-emerald-400/35 bg-emerald-500/10 text-emerald-200 shadow-[0_0_24px_rgba(52,211,153,0.25)]",
};

const ACCENT_TAG: Record<LauncherOption["accent"], string> = {
  sky: "border-sky-500/25 bg-sky-950/50 text-sky-200/90",
  emerald: "border-emerald-500/25 bg-emerald-950/50 text-emerald-200/90",
};

const ACCENT_CTA: Record<LauncherOption["accent"], string> = {
  sky: "text-sky-300/80 group-hover:text-sky-200",
  emerald: "text-emerald-300/80 group-hover:text-emerald-200",
};

export function WebviewLauncherOptionCard({
  option,
  index,
  actionLabel = "Open",
  onSelect,
}: WebviewLauncherOptionCardProps) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      className={[
        "webview-launcher-card group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/92 p-5 text-left shadow-2xl shadow-black/50 ring-1 ring-white/8 backdrop-blur-xl",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        ACCENT_GLOW[option.accent],
        option.accent === "sky" ? "border-sky-500/25" : "border-emerald-500/25",
        `webview-launcher-card--delay-${index}`,
      ].join(" ")}
      onClick={onSelect}
    >
      <span
        className={[
          "pointer-events-none absolute -inset-px z-0 rounded-2xl bg-linear-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-60",
          ACCENT_RING[option.accent],
        ].join(" ")}
        aria-hidden
      />
      <span
        className="webview-launcher-card__shine pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100"
        aria-hidden
      />

      <span className="relative z-10 flex flex-1 flex-col gap-4">
        <span className="flex items-start justify-between gap-3">
          <span
            className={[
              "webview-launcher-card__icon flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border",
              ACCENT_ICON[option.accent],
            ].join(" ")}
          >
            <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
          </span>
          <span
            className={[
              "mt-1 flex items-center gap-1 text-xs font-medium tracking-wide uppercase transition-transform duration-300 group-hover:translate-x-0.5",
              ACCENT_CTA[option.accent],
            ].join(" ")}
          >
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </span>
        </span>

        <span>
          <span className="block text-xl font-semibold tracking-tight text-zinc-50">
            {option.title}
          </span>
          <span className="mt-0.5 block text-sm font-medium text-zinc-400">{option.subtitle}</span>
        </span>

        <p className="text-sm leading-relaxed text-zinc-400/95">{option.description}</p>

        <span className="mt-auto flex flex-wrap gap-1.5">
          {option.tags.map((tag) => (
            <span
              key={tag}
              className={[
                "rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide",
                ACCENT_TAG[option.accent],
              ].join(" ")}
            >
              {tag}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
