import { twMerge } from "tailwind-merge";
import {
  courseBindingHealthClass,
  courseBindingHealthLabel,
  type CourseBindingHealthStatus,
} from "../../runtime/courseBindingHealth";

export function CourseBindingHealthBadge(props: { status: CourseBindingHealthStatus }) {
  return (
    <span
      className={twMerge(
        "shrink-0 text-[9px] font-bold uppercase tracking-wide",
        courseBindingHealthClass(props.status),
      )}
    >
      {courseBindingHealthLabel(props.status)}
    </span>
  );
}

export function CourseBindingPreviewStrip({
  pathLabel,
  displayText,
  unit,
  health,
  compact = false,
}: {
  pathLabel: string;
  displayText: string;
  unit: string;
  health: CourseBindingHealthStatus;
  compact?: boolean;
}) {
  const valueWithUnit =
    unit.length > 0 && displayText !== "—" ? `${displayText} ${unit}` : displayText;

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <CourseBindingHealthBadge status={health} />
        <span className="truncate text-[10px] text-zinc-400">
          <span className="text-zinc-500">{pathLabel}</span>
          <span className="mx-1 text-zinc-600">·</span>
          <span className="text-zinc-200">{valueWithUnit}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-700/80 bg-zinc-950/60 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium text-zinc-200">{pathLabel}</div>
        <div className="mt-0.5 truncate text-sm font-semibold text-zinc-100">{valueWithUnit}</div>
      </div>
      <CourseBindingHealthBadge status={health} />
    </div>
  );
}
