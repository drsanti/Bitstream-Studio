/*******************************************************************************
 * File Name : BitstreamFloatingAlertNotice.types.ts
 *
 * Description : Shared config for Bitstream telemetry floating alert notices.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { LucideIcon } from "lucide-react";
import type { TRNFloatingNoticeVariant } from "../../ui/TRN/TRNFloatingNotice.js";

/** Icon motion preset — swap without changing notice logic. */
export type BitstreamFloatingAlertIconAnimation = "bob-glow" | "pulse-glow" | "none";

export type BitstreamFloatingAlertNoticeConfig = {
  id: string;
  title: string;
  variant?: TRNFloatingNoticeVariant;
  Icon: LucideIcon;
  iconAnimation?: BitstreamFloatingAlertIconAnimation;
  /** Tailwind color class on the Lucide icon (e.g. text-amber-400). */
  iconColorClass?: string;
  iconStrokeWidth?: number;
  autoDismissMs?: number;
  showProgress?: boolean;
  showBackdrop?: boolean;
  pauseDismissOnHover?: boolean;
  className?: string;
  zIndex?: number;
};
