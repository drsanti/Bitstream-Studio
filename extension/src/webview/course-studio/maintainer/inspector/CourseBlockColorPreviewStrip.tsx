import { Palette } from "lucide-react";
import { formatCourseBlockColorDisplay } from "../../schemas/blockColorHex";
import type { BlockColorPreviewSwatch } from "./blockColorApplyDialogUtils";

export function CourseBlockColorMiniSwatches({
  swatches,
  max = 6,
}: {
  swatches: BlockColorPreviewSwatch[];
  max?: number;
}) {
  const visible = swatches.filter((swatch) => swatch.kind === "hex").slice(0, max);
  if (visible.length === 0) {
    return (
      <span className="text-[10px] text-zinc-500">No color fields</span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-1" aria-hidden>
      {visible.map((swatch) => (
        <span
          key={`${swatch.label}-${swatch.value}`}
          className="h-3 w-3 shrink-0 rounded-sm border border-white/15"
          style={{ backgroundColor: swatch.value }}
        />
      ))}
    </span>
  );
}

export function CourseBlockColorPreviewStrip({
  swatches,
  heading = "Preview",
}: {
  swatches: BlockColorPreviewSwatch[];
  heading?: string;
}) {
  return (
    <div className="rounded-md border border-zinc-700/80 bg-zinc-950/50 px-2.5 py-2">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {heading}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {swatches.map((swatch) => (
          <div key={`${swatch.label}-${swatch.value}`} className="flex min-w-0 items-center gap-1.5">
            {swatch.kind === "hex" ? (
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/15"
                style={{ backgroundColor: swatch.value }}
                aria-hidden
              />
            ) : (
              <Palette className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
            )}
            <span className="text-[10px] text-zinc-400">
              {swatch.label}{" "}
              <span className="text-zinc-300">
                {swatch.kind === "hex"
                  ? formatCourseBlockColorDisplay(swatch.value)
                  : swatch.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
