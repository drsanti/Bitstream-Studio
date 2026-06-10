import { TRNInteractiveCard } from "@/ui/TRN";
import { twMerge } from "tailwind-merge";
import type { ReactNode } from "react";
import { Bmi270AnimatedParameter } from "./Bmi270AnimatedParameter";
import type { Bmi270RawSectionItem } from "./bmi270RawTypes";
import { getBmi270AxisColorClass } from "./bmi270AxisTelemetryStyles";
import type { SensorDeckCardFrameProps } from "../../types/sensorDeckCardFrame.js";
import {
  resolveSensorDeckHeaderTitleClassName,
  resolveSensorDeckShell,
} from "../../types/sensorDeckCardFrame.js";

export function Bmi270RawSection(
  props: {
    title: string;
    titleLeadingSlot?: ReactNode;
    titleTrailingSlot?: ReactNode;
    items: Bmi270RawSectionItem[];
    prefaceSlot?: ReactNode;
  } & SensorDeckCardFrameProps,
) {
  const {
    title,
    titleLeadingSlot,
    titleTrailingSlot,
    items,
    collapsed = false,
    onToggleCollapsed,
    dragHandleSlot,
    samplingIntervalMs = 0,
    prefaceSlot,
    shell,
    headerTitleClassName,
    headerClassName,
    cardClassName,
  } = props;

  return (
    <TRNInteractiveCard
      title={title}
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          {dragHandleSlot != null ? dragHandleSlot : null}
          {titleLeadingSlot != null ? titleLeadingSlot : null}
        </div>
      }
      titleTrailingSlot={titleTrailingSlot}
      headerTitleClassName={resolveSensorDeckHeaderTitleClassName({ headerTitleClassName })}
      headerClassName={twMerge("course-sensor-telemetry-card__header", headerClassName)}
      shell={resolveSensorDeckShell({ shell })}
      className={twMerge("h-auto course-sensor-telemetry-card__shell", cardClassName)}
      collapsible={onToggleCollapsed != null}
      collapsed={collapsed}
      onCollapsedChange={(nextCollapsed) => {
        if (onToggleCollapsed == null) {
          return;
        }
        if (nextCollapsed !== collapsed) {
          onToggleCollapsed();
        }
      }}
      contentClassName="min-h-0"
    >
      <div className="flex flex-col gap-2">
        {prefaceSlot}
        {items.map((item) => (
          <Bmi270AnimatedParameter
            key={item.name}
            item={item}
            colorClassName={getBmi270AxisColorClass(item.name)}
            samplingIntervalMs={samplingIntervalMs}
          />
        ))}
      </div>
    </TRNInteractiveCard>
  );
}
