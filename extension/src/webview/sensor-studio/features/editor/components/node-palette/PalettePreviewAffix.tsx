import type { PalettePreview } from "./palette-live-preview";
import type { NodePaletteDensity } from "./node-palette-ui-persistence";

type PalettePreviewAffixProps = {
  preview: PalettePreview;
  /** Comfortable = slightly larger tabular preview; dense = tighter library rows. */
  density?: NodePaletteDensity;
};

/** Right-side preview column: scalar/vector/quaternion text, em dash, or reserved space for pulse (icon animates). */
export function PalettePreviewAffix(props: PalettePreviewAffixProps) {
  const { preview, density = "dense" } = props;
  const isDense = density === "dense";
  const minW = isDense ? "min-w-[3rem]" : "min-w-[3.5rem]";
  const maxW = isDense ? "max-w-[4.5rem]" : "max-w-[5.5rem]";
  const textSize = isDense
    ? "text-[11px] leading-none tracking-tight"
    : "text-[12px] leading-tight tracking-tight";

  if (preview.kind === "pulse") {
    return <span className={`inline-block ${minW} shrink-0`} aria-hidden />;
  }
  if (preview.kind === "dash") {
    return (
      <span
        className={`inline-flex ${minW} shrink-0 justify-end font-mono tabular-nums ${textSize} text-zinc-600`}
      >
        —
      </span>
    );
  }
  const tone =
    preview.streamMode === "live" ? "text-emerald-400/95" : "text-zinc-500";
  return (
    <span
      className={`inline-flex ${maxW} ${minW} shrink-0 justify-end truncate font-mono tabular-nums ${textSize} ${tone}`}
      title={preview.text}
    >
      {preview.text}
    </span>
  );
}
