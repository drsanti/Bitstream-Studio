import type { ReactNode } from "react";
import {
  pickWidgetBoardReadoutStackProps,
  type WidgetBoardReadoutLayoutConfig,
} from "../widget-board/widgetBoardReadoutLayout";
import { WidgetBoardReadoutStack } from "../widget-board/WidgetBoardReadoutStack";

export function InfographicReadoutPanel({
  config,
  showLabel,
  showValue,
  label,
  value,
  stackClassName = "w-full",
}: {
  config: WidgetBoardReadoutLayoutConfig;
  showLabel: boolean;
  showValue: boolean;
  label: string;
  value: ReactNode;
  stackClassName?: string;
}) {
  return (
    <WidgetBoardReadoutStack
      {...pickWidgetBoardReadoutStackProps(config)}
      showLabel={showLabel}
      showValue={showValue}
      label={label}
      value={value}
      labelClassName="text-[10px] font-medium uppercase tracking-widest text-[var(--course-wb-label)]"
      valueClassName="font-bold leading-tight text-[var(--course-wb-value)]"
      stackClassName={stackClassName}
    />
  );
}

export type InfographicReadoutConfig = WidgetBoardReadoutLayoutConfig;
