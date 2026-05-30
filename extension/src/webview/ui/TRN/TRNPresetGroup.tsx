import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "./TRNButton";

/**
 * Match `TRNParameter` / telemetry toolbox rhythm. **`divider`** uses the same label scale as
 * `TRNParameter` `appearance="divider"` (`text-[11px]`, `text-zinc-400`).
 */
export type TRNPresetGroupAppearance = "default" | "divider";

export type TRNPresetGroupProps = {
  title: ReactNode;
  presets: number[];
  value: number;
  onSelect: (value: number) => void;
  icon?: ReactNode;
  className?: string;
  titleClassName?: string;
  listClassName?: string;
  buttonClassName?: string;
  /**
   * When true, all presets stay on one row with equal-width columns (`repeat(n, minmax(0, 1fr))`)
   * so chips span the full row. Default uses responsive auto-fit wrapping.
   */
  presetGridSingleRow?: boolean;
  /**
   * Fixed column count for the preset grid (items wrap to additional rows). Ignored when
   * `presetGridSingleRow` is true. Example: 6 presets with `presetGridColumns={3}` → 2 rows.
   */
  presetGridColumns?: number;
  /** Default `default`. Use `divider` with `TRNParameter` divider / 3D telemetry styling. */
  appearance?: TRNPresetGroupAppearance;
  /** When set, formats preset button labels (wire values unchanged). */
  presetLabelFormatter?: (presetValue: number) => ReactNode;
};

export function TRNPresetGroup({
  title,
  presets,
  value,
  onSelect,
  icon,
  className = "",
  titleClassName = "",
  listClassName = "",
  buttonClassName = "",
  presetGridSingleRow = false,
  presetGridColumns,
  appearance = "default",
  presetLabelFormatter,
}: TRNPresetGroupProps) {
  const roundedValue = Number.isFinite(value) ? Math.round(value) : value;
  const fixedColumnCount =
    !presetGridSingleRow &&
    presetGridColumns != null &&
    Number.isFinite(presetGridColumns) &&
    presetGridColumns > 0
      ? Math.floor(presetGridColumns)
      : null;
  return (
    <div className={`mt-2 pt-1 ${className}`}>
      <div className="flex flex-col gap-2">
        <span
          className={twMerge(
            "inline-flex items-center gap-1.5 px-2 text-xs font-semibold normal-case tracking-normal text-zinc-100",
            appearance === "divider" &&
              "px-0 text-[11px] font-normal text-zinc-400 [&_svg]:text-zinc-500",
            titleClassName,
          )}
        >
          {icon != null ? icon : null}
          <span>{title}</span>
        </span>
        <div
          className={twMerge(
            "grid min-w-0 gap-1.5 px-2 pb-2",
            appearance === "divider" && "px-0",
            listClassName,
          )}
          style={{
            gridTemplateColumns: presetGridSingleRow
              ? `repeat(${Math.max(1, presets.length)}, minmax(0, 1fr))`
              : fixedColumnCount != null
                ? `repeat(${fixedColumnCount}, minmax(0, 1fr))`
                : "repeat(auto-fit, minmax(3rem, 1fr))",
          }}
        >
          {presets.map((preset) => (
            <TRNButton
              key={preset}
              className={twMerge(
                "min-w-0 w-full max-w-full",
                buttonClassName,
              )}
              size="compact"
              selected={roundedValue === preset}
              onClick={() => onSelect(preset)}
            >
              {presetLabelFormatter != null ? presetLabelFormatter(preset) : preset}
            </TRNButton>
          ))}
        </div>
      </div>
    </div>
  );
}
