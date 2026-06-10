import type { CSSProperties } from "react";
import type { WidgetBoardWidgetTypographyV1 } from "../../../schemas/widgetBoard.v1";

export function widgetBoardLabelTypographyStyle(
  typography: WidgetBoardWidgetTypographyV1 | undefined,
): CSSProperties {
  if (typography == null) {
    return {};
  }
  return {
    ...(typography.labelFontSizePx != null ? { fontSize: typography.labelFontSizePx } : {}),
    ...(typography.labelColor != null ? { color: typography.labelColor } : {}),
  };
}

export function widgetBoardValueTypographyStyle(
  typography: WidgetBoardWidgetTypographyV1 | undefined,
): CSSProperties {
  if (typography == null) {
    return {};
  }
  return {
    ...(typography.valueFontSizePx != null ? { fontSize: typography.valueFontSizePx } : {}),
    ...(typography.valueColor != null ? { color: typography.valueColor } : {}),
  };
}

export function widgetBoardUnitTypographyStyle(
  typography: WidgetBoardWidgetTypographyV1 | undefined,
): CSSProperties {
  if (typography == null) {
    return {};
  }
  return {
    ...(typography.unitFontSizePx != null ? { fontSize: typography.unitFontSizePx } : {}),
    ...(typography.unitColor != null ? { color: typography.unitColor } : {}),
  };
}

export function hasWidgetBoardLabelTypography(
  typography: WidgetBoardWidgetTypographyV1 | undefined,
): boolean {
  return typography?.labelFontSizePx != null || typography?.labelColor != null;
}

export function hasWidgetBoardValueTypography(
  typography: WidgetBoardWidgetTypographyV1 | undefined,
): boolean {
  return typography?.valueFontSizePx != null || typography?.valueColor != null;
}

export function hasWidgetBoardUnitTypography(
  typography: WidgetBoardWidgetTypographyV1 | undefined,
): boolean {
  return typography?.unitFontSizePx != null || typography?.unitColor != null;
}
