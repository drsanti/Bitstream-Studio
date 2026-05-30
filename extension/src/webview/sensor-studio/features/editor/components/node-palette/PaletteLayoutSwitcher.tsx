import type { NodePaletteLayoutMode } from "../../../../core/config/config-types";

type PaletteLayoutSwitcherProps = {
  value: NodePaletteLayoutMode;
  onChange: (next: NodePaletteLayoutMode) => void;
  borderColor: string;
  secondaryTextColor: string;
};

const OPTIONS: { value: NodePaletteLayoutMode; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "sectioned", label: "Sections + tags" },
  { value: "two-line", label: "Two-line" },
  { value: "accordion", label: "Accordion" },
];

export function PaletteLayoutSwitcher(props: PaletteLayoutSwitcherProps) {
  const { value, onChange, borderColor, secondaryTextColor } = props;
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: secondaryTextColor }}>
        Palette layout
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as NodePaletteLayoutMode)}
        className="w-full rounded border bg-zinc-900/70 px-1.5 py-1 text-[11px] outline-none focus:border-cyan-400/60"
        style={{ borderColor }}
        aria-label="Node palette layout mode"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
