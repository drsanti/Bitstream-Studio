/*******************************************************************************
 * File Name : SimulationLandingOptionCard.tsx
 *
 * Description : Landing card for Digital Twin simulation picker.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { ArrowRight } from "lucide-react";
import type { SimulationMeta } from "../simulations/catalog/types.js";
import { LandingCardIcon } from "./LandingCardIcon.js";

type SimulationLandingOptionCardProps = {
  option: SimulationMeta;
  index: number;
  onSelect: () => void;
};

const ACCENT_RING: Record<SimulationMeta["accent"], string> = {
  sky: "from-sky-400/50 via-cyan-300/25 to-blue-600/40",
  emerald: "from-emerald-400/50 via-teal-300/25 to-cyan-600/40",
  violet: "from-violet-400/50 via-purple-300/25 to-fuchsia-600/40",
  amber: "from-amber-400/50 via-orange-300/25 to-yellow-600/40",
};

const ACCENT_GLOW: Record<SimulationMeta["accent"], string> = {
  sky: "group-hover:shadow-[0_0_40px_rgba(56,189,248,0.22)] group-hover:border-sky-400/45",
  emerald:
    "group-hover:shadow-[0_0_40px_rgba(52,211,153,0.22)] group-hover:border-emerald-400/45",
  violet:
    "group-hover:shadow-[0_0_40px_rgba(167,139,250,0.22)] group-hover:border-violet-400/45",
  amber:
    "group-hover:shadow-[0_0_40px_rgba(251,191,36,0.22)] group-hover:border-amber-400/45",
};

const ACCENT_TAG: Record<SimulationMeta["accent"], string> = {
  sky: "border-sky-500/25 bg-sky-950/50 text-sky-200/90",
  emerald: "border-emerald-500/25 bg-emerald-950/50 text-emerald-200/90",
  violet: "border-violet-500/25 bg-violet-950/50 text-violet-200/90",
  amber: "border-amber-500/25 bg-amber-950/50 text-amber-200/90",
};

const ACCENT_CTA: Record<SimulationMeta["accent"], string> = {
  sky: "text-sky-300/80 group-hover:text-sky-200",
  emerald: "text-emerald-300/80 group-hover:text-emerald-200",
  violet: "text-violet-300/80 group-hover:text-violet-200",
  amber: "text-amber-300/80 group-hover:text-amber-200",
};

export function SimulationLandingOptionCard({
  option,
  index,
  onSelect,
}: SimulationLandingOptionCardProps)
{
  const Icon = option.icon;

  return (
    <button
      type="button"
      className={[
        "webview-launcher-card group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/75 text-left shadow-lg backdrop-blur-sm transition duration-300",
        ACCENT_GLOW[option.accent],
      ].join(" ")}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={onSelect}
    >
      <div
        className={[
          "pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br opacity-0 transition duration-300 group-hover:opacity-100",
          ACCENT_RING[option.accent],
        ].join(" ")}
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <LandingCardIcon
          icon={Icon}
          accent={option.accent}
          shellClassName="mb-4 h-12 w-12"
          iconClassName="h-6 w-6"
        />
        <h2 className="text-lg font-semibold tracking-tight text-zinc-50">{option.title}</h2>
        <p className="mt-1 text-sm font-medium text-zinc-400">{option.subtitle}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-500">{option.description}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {option.tags.map((tag) => (
            <li
              key={tag}
              className={[
                "rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                ACCENT_TAG[option.accent],
              ].join(" ")}
            >
              {tag}
            </li>
          ))}
        </ul>
        <div
          className={[
            "mt-4 flex items-center gap-1 text-xs font-medium tracking-wide uppercase transition",
            ACCENT_CTA[option.accent],
          ].join(" ")}
        >
          Open
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        </div>
      </div>
    </button>
  );
}
