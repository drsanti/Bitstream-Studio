import { X } from "lucide-react";
import { TRNScrubNumberField } from "../../../../../ui/TRN";

export type InspectorOptionalScrubNumberFieldProps = {
  ariaLabel: string;
  value: number | undefined;
  onCommit: (next: number | null) => void;
  step?: number;
  seedValue?: number;
  disabled?: boolean;
};

export function InspectorOptionalScrubNumberField(props: InspectorOptionalScrubNumberFieldProps) {
  const {
    ariaLabel,
    value,
    onCommit,
    step = 0.01,
    seedValue = 0,
    disabled = false,
  } = props;

  if (value == null) {
    return (
      <button
        type="button"
        disabled={disabled}
        className="group/trnScrubField inline-flex w-full min-w-0 items-center justify-center gap-1 rounded border border-zinc-700/80 bg-zinc-950/45 px-1 py-1 text-xs font-medium text-zinc-500 outline-none transition-colors hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-cyan-400/45 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`${ariaLabel}: not set. Activate to enter a value.`}
        onClick={() => onCommit(seedValue)}
      >
        (none)
      </button>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <TRNScrubNumberField
        ariaLabel={ariaLabel}
        className="w-full"
        value={value}
        step={step}
        pointerScrubEnabled={false}
        disabled={disabled}
        appearance={{ variant: "minimal" }}
        interaction={{ pointerScrubEnabled: false, wheelEnabled: false }}
        onChange={(n) => onCommit(n)}
      />
      <button
        type="button"
        aria-label={`Clear ${ariaLabel}`}
        disabled={disabled}
        className="nodrag inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-zinc-700/80 bg-zinc-900/75 p-0 text-zinc-200 outline-none transition-colors hover:bg-zinc-800/75 focus-visible:ring-1 focus-visible:ring-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={(e) => {
          e.preventDefault();
          onCommit(null);
        }}
      >
        <X className="h-4 w-4" aria-hidden strokeWidth={2.25} />
      </button>
    </div>
  );
}

