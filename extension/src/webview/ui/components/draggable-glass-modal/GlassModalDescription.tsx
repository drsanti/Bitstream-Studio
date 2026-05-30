import type { ReactNode } from "react";

export type GlassModalDescriptionProps = {
  children: ReactNode;
};

/** Subtitle under the header (optional). */
export function GlassModalDescription({
  children,
}: GlassModalDescriptionProps) {
  return (
    <p className="shrink-0 border-b border-zinc-700/25 pb-4 text-sm text-zinc-400">
      {children}
    </p>
  );
}
