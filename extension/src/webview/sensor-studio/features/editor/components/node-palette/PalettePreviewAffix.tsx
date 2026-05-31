import type { PalettePreview } from "./palette-live-preview";
import type { NodePaletteDensity } from "./node-palette-ui-persistence";
import { PaletteReadingPreview } from "./PaletteReadingPreview";

type PalettePreviewAffixProps = {
  preview: PalettePreview;
  density?: NodePaletteDensity;
  /** @deprecated Hero emphasis is unused; readings use canvas typography. */
  emphasis?: "default" | "hero";
};

/** Right-side preview for alternate palette layouts (classic, accordion, two-line). */
export function PalettePreviewAffix(props: PalettePreviewAffixProps) {
  const { preview, density = "dense" } = props;
  return (
    <span className="inline-flex max-w-[9.5rem] shrink-0 overflow-hidden">
      <PaletteReadingPreview preview={preview} align="end" density={density} />
    </span>
  );
}
