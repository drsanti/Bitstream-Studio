import type { WidgetBoardStatusToneId } from "../../../schemas/widgetBoard.v1";

export type WidgetBoardStatusToneColors = {
  background: string;
  text: string;
  border: string;
};

const STATUS_TONE_PRESETS: Record<
  Exclude<WidgetBoardStatusToneId, "custom">,
  WidgetBoardStatusToneColors
> = {
  success: {
    background: "rgba(34, 197, 94, 0.22)",
    text: "#4ade80",
    border: "rgba(34, 197, 94, 0.45)",
  },
  warning: {
    background: "rgba(251, 191, 36, 0.2)",
    text: "#fbbf24",
    border: "rgba(251, 191, 36, 0.45)",
  },
  danger: {
    background: "rgba(248, 113, 113, 0.2)",
    text: "#f87171",
    border: "rgba(248, 113, 113, 0.45)",
  },
  neutral: {
    background: "rgba(161, 161, 170, 0.18)",
    text: "#d4d4d8",
    border: "rgba(161, 161, 170, 0.4)",
  },
  info: {
    background: "rgba(56, 189, 248, 0.18)",
    text: "#38bdf8",
    border: "rgba(56, 189, 248, 0.42)",
  },
};

export const WIDGET_BOARD_STATUS_TONE_OPTIONS = [
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "danger", label: "Danger" },
  { value: "neutral", label: "Neutral" },
  { value: "info", label: "Info" },
  { value: "custom", label: "Custom" },
] as const;

export function resolveWidgetBoardStatusToneColors(args: {
  tone: WidgetBoardStatusToneId;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}): WidgetBoardStatusToneColors {
  if (args.tone === "custom") {
    return {
      background: args.backgroundColor ?? "rgba(63, 63, 70, 0.35)",
      text: args.textColor ?? "#fafafa",
      border: args.borderColor ?? "rgba(161, 161, 170, 0.45)",
    };
  }
  const preset = STATUS_TONE_PRESETS[args.tone];
  return {
    background: args.backgroundColor ?? preset.background,
    text: args.textColor ?? preset.text,
    border: args.borderColor ?? preset.border,
  };
}
