import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import {
  GLASS_MODAL_BODY_PADDING_PX,
  GLASS_MODAL_MAIN_SLOT_PADDING_TOP_PX,
} from "./glass-modal-constants";
import type { GlassModalBodyDensity } from "./types";
import { GlassModalDescription } from "./GlassModalDescription";

export type GlassModalBodyProps = {
  description?: string;
  children: ReactNode;
  density?: GlassModalBodyDensity;
};

/** Scrollable body: optional description + `children`. Not a drag handle. */
export function GlassModalBody({
  description,
  children,
  density = "default",
}: GlassModalBodyProps) {
  const bodyPaddingPx = GLASS_MODAL_BODY_PADDING_PX[density];
  const mainPaddingTopPx = description
    ? GLASS_MODAL_MAIN_SLOT_PADDING_TOP_PX[density].withDescription
    : GLASS_MODAL_MAIN_SLOT_PADDING_TOP_PX[density].withoutDescription;

  return (
    /* Body (not draggable) */
    <div
      className="relative z-1 flex min-h-0 flex-1 cursor-auto flex-col overflow-hidden bg-transparent"
      data-drag-handle="false"
    >
      {/* Padded column: description + main */}
      <div
        className="flex h-full min-h-0 flex-col"
        style={{ padding: bodyPaddingPx }}
      >
        {description ? (
          <GlassModalDescription>{description}</GlassModalDescription>
        ) : null}
        {/* Main slot */}
        <div
          className={twMerge(
            "flex min-h-0 flex-1 flex-col overflow-hidden text-sm antialiased",
            "[&_button]:font-medium [&_select]:text-white",
          )}
          style={{ paddingTop: mainPaddingTopPx }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
