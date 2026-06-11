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

export const WIDGET_BOARD_STATUS_TONE_HEX_DEFAULTS: Record<
  WidgetBoardStatusToneId,
  { background: string; text: string; border: string }
> = {
  success: { background: "#14532d", text: "#4ade80", border: "#22c55e" },
  warning: { background: "#422006", text: "#fbbf24", border: "#f59e0b" },
  danger: { background: "#450a0a", text: "#f87171", border: "#ef4444" },
  neutral: { background: "#27272a", text: "#d4d4d8", border: "#8c8c8e" },
  info: { background: "#0c4a6e", text: "#38bdf8", border: "#0ea5e9" },
  custom: { background: "#27272a", text: "#fafafa", border: "#a1a1aa" },
};

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
