import type { LucideIcon } from "lucide-react";
import { CircleHelp } from "lucide-react";
import {
  TRNDragHandle,
  TRNHintTooltip,
  TRNInteractiveCard,
} from "@/ui/TRN";
import {
  SensorCfgCardHeaderTrailing,
  type SensorCfgCardApplyProps,
} from "../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";
import { SensorHzRateField, type SensorHzRateFieldProps } from "./SensorHzRateField";
import type { HzPreset } from "../../../../bitstream2/domains/config/sensor-rate-presets";

export type SensorHzIntervalCardAck = {
  state: "idle" | "pending" | "ok" | "error";
  message?: string;
};

function SensorHzIntervalCardTitle(props: { title: string; titleHint?: string }) {
  const { title, titleHint } = props;
  if (titleHint == null || titleHint.trim().length === 0) {
    return title;
  }
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1">
      <span className="truncate">{title}</span>
      <TRNHintTooltip
        trigger={
          <CircleHelp
            className="h-3.5 w-3.5 shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
            aria-hidden
          />
        }
        content={titleHint}
        triggerAriaLabel={`About ${title}`}
        placement="top-start"
      />
    </span>
  );
}

export function SensorHzIntervalCard(props: {
  title: string;
  /** Shown on a title-bar help icon — not under the rate controls. */
  titleHint?: string;
  icon: LucideIcon;
  collapsed: boolean;
  controlsDisabled: boolean;
  ack: SensorHzIntervalCardAck;
  intervalMs: number;
  presets: HzPreset[];
  onToggleCollapsed: () => void;
  onIntervalMsChange: (nextMs: number) => void;
  cardApply?: SensorCfgCardApplyProps;
  rateField?: Partial<
    Pick<SensorHzRateFieldProps, "minMs" | "maxMs" | "allowZero" | "sliderStepHz">
  >;
}) {
  const {
    title,
    titleHint,
    icon: Icon,
    collapsed,
    controlsDisabled,
    ack,
    intervalMs,
    presets,
    onToggleCollapsed,
    onIntervalMsChange,
    cardApply,
    rateField,
  } = props;

  return (
    <TRNInteractiveCard
      title={<SensorHzIntervalCardTitle title={title} titleHint={titleHint} />}
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
          <Icon className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
        </div>
      }
      titleTrailingSlot={
        <SensorCfgCardHeaderTrailing
          dirty={cardApply?.dirty ?? false}
          applyDisabled={cardApply?.disabled}
          applyTitle={cardApply?.title}
          onApply={cardApply?.onApply}
          ack={ack}
        />
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className="h-auto rounded-md border-zinc-700/80 bg-black/30 p-2"
      collapsible
      collapsed={collapsed}
      onCollapsedChange={(next) => {
        if (next !== collapsed) {
          onToggleCollapsed();
        }
      }}
      contentClassName="min-h-0"
    >
      <div
        className={`flex flex-col gap-2 ${controlsDisabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <SensorHzRateField
          presets={presets}
          intervalMs={intervalMs}
          disabled={controlsDisabled}
          onIntervalMsChange={onIntervalMsChange}
          minMs={rateField?.minMs}
          maxMs={rateField?.maxMs}
          allowZero={rateField?.allowZero}
          sliderStepHz={rateField?.sliderStepHz}
        />
      </div>
    </TRNInteractiveCard>
  );
}
