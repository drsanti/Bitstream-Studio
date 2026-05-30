import { Activity, ArrowLeft, Sparkles, X } from "lucide-react";
import type { BitstreamWorkspaceId } from "../bitstream-app/state/bitstreamWorkspaceMode.store";

type BitstreamPickerChoice = {
  workspace: BitstreamWorkspaceId;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Activity;
};

const CHOICES: BitstreamPickerChoice[] = [
  {
    workspace: "sensor-telemetry",
    title: "Sensor Telemetry",
    subtitle: "Live telemetry deck",
    description:
      "Stream live data, edit per-sensor firmware settings (BMI270, BMM350, SHT40, DPS368), and open system diagnostics.",
    icon: Activity,
  },
  {
    workspace: "sensor-studio",
    title: "Flow-based Sensor Studio",
    subtitle: "Live data · flow editor",
    description:
      "Flow editor with 2D and 3D views driven by live sensor streams and interactive studio tooling.",
    icon: Sparkles,
  },
];

type WebviewLauncherBitstreamPickerProps = {
  onBack: () => void;
  onChoose: (workspace: BitstreamWorkspaceId) => void;
};

export function WebviewLauncherBitstreamPicker({
  onBack,
  onChoose,
}: WebviewLauncherBitstreamPickerProps) {
  return (
    <div
      className="fixed inset-0 z-600 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bitstream-picker-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-emerald-500/25 bg-zinc-950/92 p-5 shadow-2xl shadow-black/50 ring-1 ring-white/8 backdrop-blur-xl sm:p-6">
        <button
          type="button"
          className="absolute top-3 right-3 rounded-md border border-zinc-700/80 p-1.5 text-zinc-400 transition-colors hover:border-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
          aria-label="Close"
          onClick={onBack}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300/90 transition-colors hover:text-emerald-200"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back
        </button>

        <h2
          id="bitstream-picker-title"
          className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl"
        >
          TERNION Sensor Studio
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
          Configure sensors and run diagnostics, or build live-data flows in 2D
          and 3D. Pick a workspace to start. You can switch anytime from the toolbar or
          header menu.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {CHOICES.map((choice) => {
            const Icon = choice.icon;
            return (
              <button
                key={choice.workspace}
                type="button"
                className="group flex w-full items-start gap-3 rounded-xl border border-white/10 bg-black/35 p-4 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:shadow-[0_0_32px_rgba(52,211,153,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                onClick={() => {
                  onChoose(choice.workspace);
                }}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                  <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold text-zinc-50">
                      {choice.title}
                    </span>
                    <span className="text-[10px] font-medium tracking-wide text-emerald-300/80 uppercase">
                      Open
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-zinc-400">
                    {choice.subtitle}
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-zinc-500">
                    {choice.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
