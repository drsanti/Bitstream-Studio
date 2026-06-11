import { ClipboardPaste, Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import { TRNColorRingPicker } from "../../../ui/TRN/TRNColorRingPicker";
import { TRNIconButton } from "../../../ui/TRN/TRNIconButton";
import {
  courseBlockColorHexEquivalent,
  formatCourseBlockColorDisplay,
} from "../../schemas/blockColorHex";

export const COURSE_BLOCK_COLOR_ROW_LABEL_CLASS =
  "w-[5.75rem] shrink-0 text-[11px] leading-tight text-zinc-300";
export const COURSE_BLOCK_COLOR_ROW_VALUE_CLASS =
  "min-w-0 flex-1 truncate text-[10px] leading-tight text-zinc-500";

export type CourseBlockColorRowProps = {
  label: string;
  value: string | undefined;
  /** Shown in the picker when `value` is unset (theme default). */
  defaultHex?: string;
  onChange: (next: string | undefined) => void;
  onCopy?: () => void;
  onPaste?: () => void | Promise<void>;
};

/** Shared hex color row for Course Studio block inspectors (markdown, card, …). */
export function CourseBlockColorRow({
  label,
  value,
  defaultHex,
  onChange,
  onCopy,
  onPaste,
}: CourseBlockColorRowProps) {
  const [pasteBusy, setPasteBusy] = useState(false);
  const effectiveDefault = defaultHex ?? "#808080";
  const pickerValue = value ?? effectiveDefault;
  const overridden =
    value != null && !courseBlockColorHexEquivalent(value, effectiveDefault);
  const showClipboard = onCopy != null || onPaste != null;

  const handlePaste = () => {
    if (onPaste == null || pasteBusy) {
      return;
    }
    setPasteBusy(true);
    void Promise.resolve(onPaste()).finally(() => setPasteBusy(false));
  };

  return (
    <div className="flex min-w-0 items-center gap-2 py-0.5">
      <span className={COURSE_BLOCK_COLOR_ROW_LABEL_CLASS}>{label}</span>
      <TRNColorRingPicker
        ariaLabel={`${label} color`}
        valueHex={pickerValue}
        enableAlpha
        triggerVariant="swatch"
        size="sm"
        onValueHexChange={(hex) =>
          onChange(courseBlockColorHexEquivalent(hex, effectiveDefault) ? undefined : hex)
        }
      />
      <span
        className={`${COURSE_BLOCK_COLOR_ROW_VALUE_CLASS}${overridden ? " text-zinc-400" : " italic text-zinc-600"}`}
      >
        {formatCourseBlockColorDisplay(value)}
      </span>
      <span className="flex shrink-0 items-center gap-0">
        {overridden ? (
          <TRNIconButton
            variant="ghost"
            className="h-6 w-6 shrink-0"
            icon={<RotateCcw size={12} strokeWidth={2.25} aria-hidden />}
            label={`Reset ${label} color`}
            nativeTitle={false}
            hint="Use theme default"
            onClick={() => onChange(undefined)}
          />
        ) : null}
        {showClipboard && onCopy != null ? (
          <TRNIconButton
            variant="ghost"
            className="h-6 w-6 shrink-0"
            icon={<Copy size={12} strokeWidth={2.25} aria-hidden />}
            label={`Copy ${label} color`}
            nativeTitle={false}
            hint={`Copy ${label.toLowerCase()} hex (${pickerValue.toLowerCase()})`}
            onClick={onCopy}
          />
        ) : null}
        {showClipboard && onPaste != null ? (
          <TRNIconButton
            variant="ghost"
            className="h-6 w-6 shrink-0"
            icon={<ClipboardPaste size={12} strokeWidth={2.25} aria-hidden />}
            label={`Paste ${label} color`}
            nativeTitle={false}
            hint={`Paste hex into ${label.toLowerCase()}`}
            disabled={pasteBusy}
            onClick={handlePaste}
          />
        ) : null}
      </span>
    </div>
  );
}
