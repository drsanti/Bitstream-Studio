import type { PageBlockV1 } from "../schemas/page.v1";
import { PAGE_BLOCK_PALETTE } from "./blockFactory";

const CALLOUT_VARIANT_LABELS: Record<string, string> = {
  "callout-info": "Info",
  "callout-warning": "Warning",
  "callout-danger": "Danger",
  "callout-tip": "Tip",
};

export function courseBlockPaletteLabel(kind: string): string {
  return PAGE_BLOCK_PALETTE.find((entry) => entry.kind === kind)?.label ?? kind;
}

export function courseBlockHeaderTitle(block: PageBlockV1): string {
  const variant = CALLOUT_VARIANT_LABELS[block.kind];
  if (variant != null) {
    return `Callout · ${variant}`;
  }
  return courseBlockPaletteLabel(block.kind);
}

export function isCalloutBlockKind(kind: PageBlockV1["kind"]): boolean {
  return kind.startsWith("callout-");
}
