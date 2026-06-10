import { Activity } from "lucide-react";
import type { DiagramBindingV1 } from "../../schemas/diagram.v1";
import { resolveLiveMetricAxisBinding } from "../../schemas/courseLiveBindingDefaults";
import { formatBindingNumber } from "../../runtime/diagram/evaluateDiagramScene";
import { useCourseLiveBinding } from "../../runtime/useCourseLiveBinding";
import { useCourseDisplayTween } from "../../motion/useCourseDisplayTween";
import type { CourseTitleIconAnimation } from "../../schemas/courseTitleIconAnimation";
import { CourseTitleWithIcon } from "./CourseTitleWithIcon";

function MetricAxis({
  label,
  binding,
  color,
  staleMs,
}: {
  label: string;
  binding: DiagramBindingV1;
  color: string;
  staleMs?: number;
}) {
  const live = useCourseLiveBinding(binding, staleMs);
  const tweened = useCourseDisplayTween(live.displayValue ?? 0);
  const display =
    live.displayValue != null && Number.isFinite(live.displayValue)
      ? formatBindingNumber(tweened, binding.format ?? "0.0000f")
      : "—";
  const unit = binding.unit ?? live.unit;

  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-bg)] px-2 py-2 text-center">
      <div className="text-2xs uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm font-semibold" style={{ color }}>
        {display}
      </div>
      {unit.length > 0 ? (
        <div className="text-2xs text-[var(--text-muted)]">{unit}</div>
      ) : null}
    </div>
  );
}

export function CourseLiveMetricCard({
  title,
  icon,
  iconColor,
  iconAnimation,
  axes,
  staleMs,
}: {
  title: string;
  icon?: string;
  iconColor?: string;
  iconAnimation?: CourseTitleIconAnimation;
  axes?: {
    ax?: DiagramBindingV1;
    ay?: DiagramBindingV1;
    az?: DiagramBindingV1;
  };
  staleMs?: number;
}) {
  const axBinding = resolveLiveMetricAxisBinding("ax", axes?.ax);
  const ayBinding = resolveLiveMetricAxisBinding("ay", axes?.ay);
  const azBinding = resolveLiveMetricAxisBinding("az", axes?.az);

  const axLive = useCourseLiveBinding(axBinding, staleMs);
  const ayLive = useCourseLiveBinding(ayBinding, staleMs);
  const azLive = useCourseLiveBinding(azBinding, staleMs);

  const magnitude = useCourseDisplayTween(
    Math.sqrt(
      (axLive.displayValue ?? 0) ** 2 +
        (ayLive.displayValue ?? 0) ** 2 +
        (azLive.displayValue ?? 0) ** 2,
    ),
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3">
      <CourseTitleWithIcon
        title={title}
        icon={icon}
        fallbackIcon={Activity}
        iconSize={16}
        iconColor={iconColor}
        iconAnimation={iconAnimation}
        iconClassName={iconColor == null ? "text-[var(--axis-x)]" : undefined}
        titleClassName="text-sm font-semibold text-[var(--text-primary)]"
        titleAs="span"
        className="items-center"
      />
      <div className="grid grid-cols-3 gap-2">
        <MetricAxis label="aX" binding={axBinding} color="var(--axis-x)" staleMs={staleMs} />
        <MetricAxis label="aY" binding={ayBinding} color="var(--axis-y)" staleMs={staleMs} />
        <MetricAxis label="aZ" binding={azBinding} color="var(--axis-z)" staleMs={staleMs} />
      </div>
      <div className="text-2xs text-[var(--text-muted)]">|a| ≈ {magnitude.toFixed(4)} g</div>
    </div>
  );
}
