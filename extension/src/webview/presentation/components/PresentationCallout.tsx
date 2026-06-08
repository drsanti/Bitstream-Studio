import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  CALLOUT_VARIANT_STYLES,
  type PresentationCalloutVariant,
} from "./callout-tokens";

function resolveIcon(name: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!name) {
    return fallback;
  }
  const icon = (LucideIcons as Record<string, LucideIcon | undefined>)[name];
  return icon ?? fallback;
}

export function PresentationCallout({
  variant,
  title,
  body,
  icon,
}: {
  variant: PresentationCalloutVariant;
  title?: string;
  body: string;
  icon?: string;
}) {
  const style = CALLOUT_VARIANT_STYLES[variant];
  const Icon = resolveIcon(icon, style.icon);

  return (
    <div
      className="flex min-h-0 flex-col gap-2 rounded-xl border px-4 py-3"
      style={{ borderColor: style.border, background: style.bg }}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={18} strokeWidth={2} style={{ color: style.title }} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          {title ? (
            <div className="text-sm font-semibold" style={{ color: style.title }}>
              {title}
            </div>
          ) : null}
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>
        </div>
      </div>
    </div>
  );
}
