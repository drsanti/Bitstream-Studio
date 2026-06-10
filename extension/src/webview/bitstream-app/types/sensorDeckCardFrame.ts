import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { TRNInteractiveCardShell } from "../../ui/TRN/trnInteractiveCardShell.js";
import type {
  Bmi270LiveSample,
  Bmm350LiveSample,
  Dps368LiveSample,
  Sht40LiveSample,
} from "./bitstreamWorkspaceTypes.js";

/** Shared telemetry deck card shell props (drag handle, collapse, course chrome). */
export type SensorDeckCardFrameProps = {
  samplingIntervalMs?: number;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  dragHandleSlot?: ReactNode;
  shell?: TRNInteractiveCardShell;
  /** Default true — hide Δms badge when false. */
  showUpdateBadge?: boolean;
  /** Default true — hide header settings gear when false. */
  showDisplaySettings?: boolean;
  headerTitleClassName?: string;
  headerClassName?: string;
  cardClassName?: string;
};

export const SENSOR_DECK_DEFAULT_HEADER_TITLE_CLASS =
  "normal-case tracking-normal text-zinc-100";

export function resolveSensorDeckShell(
  frame: Pick<SensorDeckCardFrameProps, "shell"> | undefined,
): TRNInteractiveCardShell {
  return frame?.shell ?? "solid";
}

export function resolveSensorDeckHeaderTitleClassName(
  frame: Pick<SensorDeckCardFrameProps, "headerTitleClassName"> | undefined,
): string {
  const base = SENSOR_DECK_DEFAULT_HEADER_TITLE_CLASS;
  const extra = frame?.headerTitleClassName?.trim();
  if (extra != null && extra.length > 0) {
    return `${base} ${extra}`.trim();
  }
  return `${base} course-sensor-telemetry-card__title`.trim();
}

export function sensorDeckShowsUpdateBadge(
  frame: Pick<SensorDeckCardFrameProps, "showUpdateBadge"> | undefined,
): boolean {
  return frame?.showUpdateBadge !== false;
}

export function sensorDeckShowsDisplaySettings(
  frame: Pick<SensorDeckCardFrameProps, "showDisplaySettings"> | undefined,
): boolean {
  return frame?.showDisplaySettings !== false;
}

export function sensorDeckCardChromeProps(
  frame: Pick<
    SensorDeckCardFrameProps,
    "shell" | "headerTitleClassName" | "headerClassName" | "cardClassName"
  >,
) {
  return {
    shell: resolveSensorDeckShell(frame),
    headerTitleClassName: resolveSensorDeckHeaderTitleClassName(frame),
    headerClassName: twMerge("course-sensor-telemetry-card__header", frame.headerClassName),
    className: twMerge("h-auto course-sensor-telemetry-card__shell", frame.cardClassName),
  };
}

export type DPS368DataViewerProps = SensorDeckCardFrameProps & {
  sample: Dps368LiveSample;
};

export type SHT40DataViewerProps = SensorDeckCardFrameProps & {
  sample: Sht40LiveSample;
  variant: "humidity" | "temperature";
};

export type BMM350DataViewerProps = SensorDeckCardFrameProps & {
  sample: Bmm350LiveSample;
};

export type Bmi270DeckCardFrameProps = SensorDeckCardFrameProps & {
  sample: Bmi270LiveSample;
};
