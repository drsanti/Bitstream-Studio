import type { CardBlockColors } from "../../schemas/cardBlockColors";
import { stripEmptyCardBlockColors } from "../../schemas/cardBlockColors";
import type { MarkdownBlockColors } from "../../schemas/markdownBlockColors";
import { stripEmptyMarkdownBlockColors } from "../../schemas/markdownBlockColors";
import type { PageBlockV1, PageV1 } from "../../schemas/page.v1";

export type BlockColorPreviewSwatch = {
  label: string;
  value: string;
  kind: "hex" | "theme";
};

export function countPageBlocksOfKind(page: PageV1 | null, kind: PageBlockV1["kind"]): number {
  if (page == null) {
    return 0;
  }
  return page.blocks.filter((block) => block.kind === kind).length;
}

export function countSetColorFields(
  colors: CardBlockColors | MarkdownBlockColors | undefined,
): number {
  if (colors == null) {
    return 0;
  }
  let count = 0;
  for (const [key, value] of Object.entries(colors)) {
    if (value != null && String(value).length > 0) {
      count += 1;
    }
  }
  return count;
}

export function pageHasSiblingColorOverrides(
  page: PageV1 | null,
  kind: "card" | "markdown",
  excludeBlockId?: string,
): boolean {
  if (page == null) {
    return false;
  }
  return page.blocks.some((block) => {
    if (block.kind !== kind) {
      return false;
    }
    if (excludeBlockId != null && block.id === excludeBlockId) {
      return false;
    }
    if (kind === "card") {
      return stripEmptyCardBlockColors(block.colors) != null;
    }
    return stripEmptyMarkdownBlockColors(block.colors) != null;
  });
}

export function buildCardColorPreviewSwatches(
  colors: CardBlockColors | undefined,
  defaults: Record<keyof CardBlockColors, string>,
): BlockColorPreviewSwatch[] {
  const rows: Array<{ key: keyof CardBlockColors; label: string }> = [
    { key: "background", label: "BG" },
    { key: "border", label: "Border" },
    { key: "title", label: "Title" },
    { key: "icon", label: "Icon" },
    { key: "body", label: "Body" },
  ];
  return rows.map((row) => ({
    label: row.label,
    value: colors?.[row.key] ?? defaults[row.key],
    kind: "hex" as const,
  }));
}

export function buildMarkdownColorPreviewSwatches(
  colors: MarkdownBlockColors | undefined,
  defaults: Record<string, string>,
): BlockColorPreviewSwatch[] {
  const hexRows: Array<{ key: keyof MarkdownBlockColors; label: string }> = [
    { key: "background", label: "BG" },
    { key: "body", label: "Body" },
    { key: "h1", label: "H1" },
    { key: "link", label: "Link" },
    { key: "blockCode", label: "Code" },
    { key: "blockCodeBackground", label: "Code bg" },
  ];
  const swatches: BlockColorPreviewSwatch[] = hexRows.map((row) => ({
    label: row.label,
    value: (colors?.[row.key] as string | undefined) ?? defaults[row.key] ?? "#18181b",
    kind: "hex",
  }));
  if (colors?.codeSyntaxTheme != null) {
    swatches.push({
      label: "Syntax",
      value: colors.codeSyntaxTheme,
      kind: "theme",
    });
  }
  return swatches;
}
