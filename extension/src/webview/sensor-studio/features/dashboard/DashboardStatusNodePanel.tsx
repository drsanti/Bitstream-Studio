import {
  coerceDashboardStatusStyleV1,
  dashboardStatusToneClass,
} from "../../core/dashboard/dashboard-status-style";

type DashboardStatusNodePanelProps = {
  className?: string;
  label: string;
  active: boolean;
  defaultConfig: Record<string, unknown>;
};

export function DashboardStatusNodePanel(props: DashboardStatusNodePanelProps) {
  const { className, label, active, defaultConfig } = props;
  const style = coerceDashboardStatusStyleV1(defaultConfig);
  const pillLabel = active ? style.onLabel : style.offLabel;
  const toneClass = dashboardStatusToneClass(active ? style.onTone : style.offTone);

  return (
    <div
      className={`flex min-h-[var(--dashboard-row-height,48px)] w-full items-center justify-between gap-3 px-3 py-2 ${className ?? "border border-zinc-700/50 bg-zinc-900/50"}`}
    >
      <span className="truncate text-[12px] font-medium text-zinc-200">{label}</span>
      <span
        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${toneClass}`}
      >
        {pillLabel}
      </span>
    </div>
  );
}
