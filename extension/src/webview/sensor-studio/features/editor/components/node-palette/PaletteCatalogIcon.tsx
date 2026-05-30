import { twMerge } from "tailwind-merge";
import { getCatalogLucideIcon } from "./catalog-lucide-icons";

export type PaletteCatalogIconProps = {
  icon: string;
  className?: string;
  /** Multi-output sensor rows: pulse the icon; tint hardware vs idle palette previews. */
  livePulse?: "live" | "idle" | null;
};

export function PaletteCatalogIcon(props: PaletteCatalogIconProps) {
  const { icon, className, livePulse = null } = props;
  const Icon = getCatalogLucideIcon(icon);
  const pulseTone =
    livePulse === "live"
      ? "text-emerald-400/90 drop-shadow-[0_0_5px_rgba(52,211,153,0.35)]"
      : livePulse === "idle"
        ? "text-zinc-500"
        : "";
  const iconEl = (
    <Icon
      className={twMerge(
        "h-3.5 w-3.5 shrink-0 text-zinc-400",
        livePulse != null && "animate-pulse",
        pulseTone,
        className,
      )}
      aria-hidden
    />
  );
  return livePulse != null ? (
    <span className="inline-flex shrink-0">{iconEl}</span>
  ) : (
    iconEl
  );
}
