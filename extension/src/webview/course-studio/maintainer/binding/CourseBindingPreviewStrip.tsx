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
  const showUnit = unit.length > 0 && displayText !== "—";

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <CourseBindingHealthBadge status={health} />
        <span className="flex min-w-0 items-baseline gap-1 truncate text-[13px] font-normal leading-tight">
          <span className="shrink-0 text-zinc-500">{pathLabel}</span>
          <span className="shrink-0 text-zinc-600">·</span>
          <span className="min-w-0 truncate text-zinc-100">{displayText}</span>
          {showUnit ? <span className="shrink-0 text-zinc-500">{unit}</span> : null}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-700/80 bg-zinc-950/60 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium text-zinc-200">{pathLabel}</div>
        <div className="mt-0.5 truncate text-sm font-semibold leading-tight">
          <span className="text-zinc-100">{displayText}</span>
          {showUnit ? <span className="ml-1 font-normal text-zinc-500">{unit}</span> : null}
        </div>
      </div>
      <CourseBindingHealthBadge status={health} />
    </div>
  );
}
