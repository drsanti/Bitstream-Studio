import { Gauge } from "lucide-react";
import { TRNButton, TRNCard } from "@/ui/TRN";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";

type Mode = "auto" | "reliable" | "fast";

function ModeChoiceGroup(props: {
  value: Mode;
  onChange: (next: Mode) => void;
}) {
  const { value, onChange } = props;
  const options: Array<{ value: Mode; label: string; helper: string }> = [
    {
      value: "auto",
      label: "Auto",
      helper: "Default. Fast UI with selective ACK-confirmed paths.",
    },
    {
      value: "reliable",
      label: "Reliable",
      helper: "Prefer ACK-confirmed operations (more waiting, fewer silent failures).",
    },
    {
      value: "fast",
      label: "Fast",
      helper: "Always fire-and-forget (best responsiveness).",
    },
  ];

  return (
    <div role="radiogroup" aria-label="Command confirmation mode" className="flex flex-col gap-2">
      <div className="flex flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <TRNButton
              key={opt.value}
              type="button"
              size="compact"
              role="radio"
              aria-checked={selected}
              aria-pressed={selected}
              selected={selected}
              className="min-w-20 flex-1"
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </TRNButton>
          );
        })}
      </div>
      <div className="rounded border border-zinc-700/70 bg-black/25 px-2 py-1 text-[11px] text-zinc-200">
        {options.find((opt) => opt.value === value)?.helper ?? ""}
      </div>
    </div>
  );
}

export function CommandConfirmationModePanel() {
  const mode = useBitstreamConfigStore((s) => s.commandConfirmationMode);
  const setMode = useBitstreamConfigStore((s) => s.setCommandConfirmationMode);

  return (
    <TRNCard
      title="Command confirmation"
      icon={<Gauge className="h-4 w-4" />}
      mode="simple"
      collapsible={false}
      glass
      glassPreset="medium"
      contentClassName="flex flex-col gap-2 p-2"
    >
      <div className="text-[11px] leading-snug text-zinc-300">
        Controls how the Bitstream dashboard chooses between ACK-confirmed requests and fire-and-forget sends.
      </div>
      <ModeChoiceGroup value={mode} onChange={setMode} />
    </TRNCard>
  );
}

