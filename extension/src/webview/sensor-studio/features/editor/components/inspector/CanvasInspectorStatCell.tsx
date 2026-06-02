export type CanvasInspectorStatCellProps = {
  label: string;
  value: string | number;
  /** Optional accent for emphasis (e.g. selection count). */
  emphasis?: boolean;
};

export function CanvasInspectorStatCell(props: CanvasInspectorStatCellProps) {
  const { label, value, emphasis = false } = props;
  return (
    <div
      className={
        emphasis
          ? "min-w-0 rounded-md border border-sky-500/25 bg-sky-950/20 px-2 py-1.5"
          : "min-w-0 rounded-md border border-zinc-800/70 bg-zinc-950/40 px-2 py-1.5"
      }
    >
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div
        className={
          emphasis
            ? "text-[12px] text-sky-100/95"
            : "text-[12px] text-zinc-100/95"
        }
      >
        {value}
      </div>
    </div>
  );
}
