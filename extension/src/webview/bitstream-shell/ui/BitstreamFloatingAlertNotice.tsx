/*******************************************************************************
 * File Name : BitstreamFloatingAlertNotice.tsx
 *
 * Description : Configurable TRNFloatingNotice for Bitstream telemetry alerts
 *               (icon, animation preset, copy). Presets live in
 *               bitstreamFloatingAlertNotice.presets.ts.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { twMerge } from "tailwind-merge";
import { TRNFloatingNotice } from "../../ui/TRN";
import type {
  BitstreamFloatingAlertIconAnimation,
  BitstreamFloatingAlertNoticeConfig,
} from "./BitstreamFloatingAlertNotice.types.js";
import "./BitstreamFloatingAlertNotice.css";

function iconAnimationClassName(animation: BitstreamFloatingAlertIconAnimation): string | undefined {
  switch (animation)
  {
    case "bob-glow":
      return "bitstream-floating-alert-icon--bob-glow";
    case "pulse-glow":
      return "bitstream-floating-alert-icon--pulse-glow";
    case "none":
    default:
      return undefined;
  }
}

export type BitstreamFloatingAlertNoticeProps = {
  open: boolean;
  message: string;
  onOpenChange: (open: boolean) => void;
  /** Preset from bitstreamFloatingAlertNotice.presets.ts — override fields below as needed. */
  config: BitstreamFloatingAlertNoticeConfig;
  title?: string;
  variant?: BitstreamFloatingAlertNoticeConfig["variant"];
  iconAnimation?: BitstreamFloatingAlertIconAnimation;
  Icon?: BitstreamFloatingAlertNoticeConfig["Icon"];
  iconColorClass?: string;
  autoDismissMs?: number;
  className?: string;
  zIndex?: number;
};

/**
 * Generic Bitstream floating alert — swap icon/animation via config or props.
 */
export function BitstreamFloatingAlertNotice(props: BitstreamFloatingAlertNoticeProps)
{
  const { open, message, onOpenChange, config } = props;

  const title = props.title ?? config.title;
  const variant = props.variant ?? config.variant ?? "warning";
  const Icon = props.Icon ?? config.Icon;
  const iconAnimation = props.iconAnimation ?? config.iconAnimation ?? "bob-glow";
  const iconColorClass = props.iconColorClass ?? config.iconColorClass ?? "text-amber-400";
  const autoDismissMs = props.autoDismissMs ?? config.autoDismissMs ?? 10_000;
  const pauseDismissOnHover = props.pauseDismissOnHover ?? config.pauseDismissOnHover ?? true;
  const animClass = iconAnimationClassName(iconAnimation);

  return (
    <TRNFloatingNotice
      open={open}
      variant={variant}
      title={title}
      message={message}
      prefixIcon={
        <Icon
          className={twMerge("h-9 w-9", iconColorClass, animClass)}
          strokeWidth={config.iconStrokeWidth ?? 2.15}
          aria-hidden
        />
      }
      autoDismissMs={autoDismissMs}
      showProgress={config.showProgress ?? true}
      pauseDismissOnHover={pauseDismissOnHover}
      showBackdrop={config.showBackdrop ?? false}
      className={twMerge("max-w-[340px]", config.className, props.className)}
      zIndex={props.zIndex ?? config.zIndex ?? 125}
      onOpenChange={onOpenChange}
    />
  );
}
