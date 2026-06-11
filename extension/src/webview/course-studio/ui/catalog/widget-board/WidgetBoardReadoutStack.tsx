import type { CSSProperties, ReactNode } from "react";
import type { WidgetBoardValueAlign } from "../../../schemas/widgetBoard.v1";
import type { WidgetBoardReadoutLayoutConfig } from "./widgetBoardReadoutLayout";
import {
  widgetBoardReadoutChildOrder,
  widgetBoardReadoutLabelClassName,
  widgetBoardReadoutStackClassName,
  widgetBoardReadoutStackStyle,
  widgetBoardReadoutValueClassName,
} from "./widgetBoardReadoutLayout";

export function WidgetBoardReadoutStack({
  layout = "stacked",
  inlineAlign = "start",
  readoutJustify,
  readoutCrossAlign,
  readoutOrder,
  readoutGapPx,
  readoutValueGrow,
  valueAlign,
  showLabel = true,
  showValue = true,
  label,
  value,
  labelClassName = "",
  valueClassName = "",
  labelStyle,
  valueStyle,
  stackClassName = "",
}: WidgetBoardReadoutLayoutConfig & {
  inlineAlign?: WidgetBoardReadoutLayoutConfig["readoutInlineAlign"];
  valueAlign?: WidgetBoardValueAlign;
  showLabel?: boolean;
  showValue?: boolean;
  label?: ReactNode;
  value?: ReactNode;
  labelClassName?: string;
  valueClassName?: string;
  labelStyle?: CSSProperties;
  valueStyle?: CSSProperties;
  stackClassName?: string;
}) {
  if (!showLabel && !showValue) {
    return null;
  }

  const config: WidgetBoardReadoutLayoutConfig = {
    readoutLayout: layout,
    readoutInlineAlign: inlineAlign,
    readoutJustify,
    readoutCrossAlign,
    readoutOrder,
    readoutGapPx,
    readoutValueGrow,
  };

  const isStacked = (layout ?? "stacked") === "stacked";
  const order = widgetBoardReadoutChildOrder(config);
  const labelClass = `${widgetBoardReadoutLabelClassName(config)} ${labelClassName}`.trim();
  const valueClass = `${widgetBoardReadoutValueClassName(config)} ${valueClassName}`.trim();

  const labelEl =
    showLabel && isStacked ? (
      <p key="readout-label" className={labelClass} style={labelStyle}>
        {label}
      </p>
    ) : showLabel ? (
      <span key="readout-label" className={labelClass} style={labelStyle}>
        {label}
      </span>
    ) : null;

  const valueEl =
    showValue && isStacked ? (
      <div key="readout-value" className={valueClass} style={valueStyle}>
        {value}
      </div>
    ) : showValue ? (
      <span key="readout-value" className={valueClass} style={valueStyle}>
        {value}
      </span>
    ) : null;

  const ordered =
    order === "value-first" ? [valueEl, labelEl].filter(Boolean) : [labelEl, valueEl].filter(Boolean);

  return (
    <div
      className={`${widgetBoardReadoutStackClassName(config, valueAlign)} ${stackClassName}`.trim()}
      style={widgetBoardReadoutStackStyle(config)}
    >
      {ordered}
    </div>
  );
}
