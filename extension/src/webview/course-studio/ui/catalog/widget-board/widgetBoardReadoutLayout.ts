import type {
  WidgetBoardReadoutCrossAlign,
  WidgetBoardReadoutInlineAlign,
  WidgetBoardReadoutJustify,
  WidgetBoardReadoutLayout,
  WidgetBoardReadoutOrder,
  WidgetBoardTileContentAlign,
  WidgetBoardValueAlign,
} from "../../../schemas/widgetBoard.v1";

export type WidgetBoardReadoutLayoutConfig = {
  readoutLayout?: WidgetBoardReadoutLayout;
  readoutInlineAlign?: WidgetBoardReadoutInlineAlign;
  readoutJustify?: WidgetBoardReadoutJustify;
  readoutCrossAlign?: WidgetBoardReadoutCrossAlign;
  readoutOrder?: WidgetBoardReadoutOrder;
  readoutGapPx?: 4 | 8 | 12 | 16;
  readoutValueGrow?: boolean;
};

export type WidgetBoardTileLayoutConfig = {
  tileContentH?: WidgetBoardTileContentAlign;
  tileContentV?: WidgetBoardTileContentAlign;
};

const JUSTIFY_CLASS: Record<WidgetBoardReadoutJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  evenly: "justify-evenly",
};

const CROSS_ALIGN_CLASS: Record<WidgetBoardReadoutCrossAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
};

const STACKED_TEXT_ALIGN: Record<Exclude<WidgetBoardReadoutCrossAlign, "baseline">, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
};

export function resolveReadoutJustify(
  config: WidgetBoardReadoutLayoutConfig,
): WidgetBoardReadoutJustify {
  if (config.readoutJustify != null) {
    return config.readoutJustify;
  }
  const inlineAlign = config.readoutInlineAlign ?? "start";
  if (inlineAlign === "between") {
    return "between";
  }
  return inlineAlign;
}

export function resolveReadoutCrossAlign(
  config: WidgetBoardReadoutLayoutConfig,
  valueAlign?: WidgetBoardValueAlign,
): WidgetBoardReadoutCrossAlign {
  if (config.readoutCrossAlign != null) {
    return config.readoutCrossAlign;
  }
  if (config.readoutLayout === "inline") {
    return "baseline";
  }
  if (valueAlign === "center") {
    return "center";
  }
  if (valueAlign === "right") {
    return "end";
  }
  return "start";
}

export function valueAlignFromReadoutCrossAlign(
  crossAlign: WidgetBoardReadoutCrossAlign,
): WidgetBoardValueAlign {
  if (crossAlign === "center") {
    return "center";
  }
  if (crossAlign === "end") {
    return "right";
  }
  return "left";
}

export function widgetBoardReadoutStackClassName(
  config: WidgetBoardReadoutLayoutConfig,
  valueAlign?: WidgetBoardValueAlign,
): string {
  const layout = config.readoutLayout ?? "stacked";
  const justify = resolveReadoutJustify(config);
  const crossAlign = resolveReadoutCrossAlign(config, valueAlign);
  const gapPx = config.readoutGapPx ?? 8;
  const isInline = layout === "inline";

  if (isInline) {
    return [
      "course-wb-readout-stack",
      "course-wb-readout-stack--inline",
      "flex min-w-0 w-full",
      JUSTIFY_CLASS[justify],
      CROSS_ALIGN_CLASS[crossAlign],
    ].join(" ");
  }

  const textAlign =
    crossAlign === "baseline"
      ? STACKED_TEXT_ALIGN.start
      : STACKED_TEXT_ALIGN[crossAlign];

  return [
    "course-wb-readout-stack",
    "course-wb-readout-stack--stacked",
    "flex min-w-0 flex-col",
    JUSTIFY_CLASS[justify],
    CROSS_ALIGN_CLASS[crossAlign === "baseline" ? "start" : crossAlign],
    textAlign,
  ].join(" ");
}

export function widgetBoardReadoutStackStyle(
  config: WidgetBoardReadoutLayoutConfig,
): { gap: string } {
  return { gap: `${config.readoutGapPx ?? 8}px` };
}

export function widgetBoardTileShellClassName(
  config: WidgetBoardTileLayoutConfig,
): string {
  const h = config.tileContentH ?? "center";
  const v = config.tileContentV ?? "center";

  const justifyV: Record<WidgetBoardTileContentAlign, string> = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
  };
  const itemsH: Record<WidgetBoardTileContentAlign, string> = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  };

  return `course-wb-tile-shell flex h-full min-h-0 min-w-0 w-full flex-col ${justifyV[v]} ${itemsH[h]}`;
}

export function widgetBoardReadoutLabelClassName(
  config: WidgetBoardReadoutLayoutConfig,
): string {
  const isInline = (config.readoutLayout ?? "stacked") === "inline";
  return isInline ? "course-wb-readout-stack__label shrink-0" : "course-wb-readout-stack__label";
}

export function widgetBoardReadoutValueClassName(
  config: WidgetBoardReadoutLayoutConfig,
): string {
  const isInline = (config.readoutLayout ?? "stacked") === "inline";
  const grow = config.readoutValueGrow === true && isInline;
  return [
    "course-wb-readout-stack__value min-w-0",
    grow ? "flex-1" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function widgetBoardReadoutChildOrder(
  config: WidgetBoardReadoutLayoutConfig,
): WidgetBoardReadoutOrder {
  return config.readoutOrder ?? "label-first";
}

export function pickWidgetBoardReadoutStackProps(
  config: WidgetBoardReadoutLayoutConfig & { valueAlign?: WidgetBoardValueAlign },
) {
  return {
    layout: config.readoutLayout,
    inlineAlign: config.readoutInlineAlign,
    readoutJustify: config.readoutJustify,
    readoutCrossAlign: config.readoutCrossAlign,
    readoutOrder: config.readoutOrder,
    readoutGapPx: config.readoutGapPx,
    readoutValueGrow: config.readoutValueGrow,
    valueAlign: config.valueAlign,
  };
}

export function pickWidgetBoardTileShellProps(config: WidgetBoardTileLayoutConfig) {
  return {
    tileContentH: config.tileContentH,
    tileContentV: config.tileContentV,
  };
}

export function spreadWidgetBoardLayoutProps(
  config: WidgetBoardReadoutLayoutConfig & WidgetBoardTileLayoutConfig,
) {
  return {
    readoutLayout: config.readoutLayout,
    readoutInlineAlign: config.readoutInlineAlign,
    readoutJustify: config.readoutJustify,
    readoutCrossAlign: config.readoutCrossAlign,
    readoutOrder: config.readoutOrder,
    readoutGapPx: config.readoutGapPx,
    readoutValueGrow: config.readoutValueGrow,
    tileContentH: config.tileContentH,
    tileContentV: config.tileContentV,
  };
}
