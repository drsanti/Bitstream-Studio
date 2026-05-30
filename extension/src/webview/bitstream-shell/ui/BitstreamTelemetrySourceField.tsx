import { Cpu, FlaskConical } from "lucide-react";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import {
  BITSTREAM_TELEMETRY_SOURCE_LABELS,
  useBitstreamTelemetrySourceStore,
  type BitstreamTelemetryBackend,
} from "../../bitstream-app/state/bitstreamTelemetrySource.store";

const OPTIONS = [
  { value: "uart" as const, label: BITSTREAM_TELEMETRY_SOURCE_LABELS.uart },
  { value: "simulator" as const, label: BITSTREAM_TELEMETRY_SOURCE_LABELS.simulator },
];

export function BitstreamTelemetrySourceField()
{
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const loopbackAvailable = useBitstreamTelemetrySourceStore((s) => s.loopbackAvailable);
  const setBackend = useBitstreamTelemetrySourceStore((s) => s.setBackend);

  const hint =
    backend === "simulator"
      ? loopbackAvailable
        ? "External bitstream-simulator online — synthetic BS2 stream; open COM is closed automatically."
        : "External data source — start the bitstream-simulator extension + bridge (npm run start:bridge)."
      : "Data from firmware on serial (USB COM). Simulator stays idle while Bitstream is selected.";

  const Icon = backend === "simulator" ? FlaskConical : Cpu;

  const iconClassName =
    backend === "simulator" && loopbackAvailable
      ? "h-3.5 w-3.5 shrink-0 text-violet-300"
      : "h-3.5 w-3.5 shrink-0 text-zinc-500";

  return (
    <div
      className="inline-flex shrink-0 items-center gap-1.5"
      title={hint}
    >
      <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
        Source
      </span>
      <TRNSelect
        ariaLabel="Source"
        value={backend}
        size="sm"
        options={OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
        onValueChange={(value) => setBackend(value as BitstreamTelemetryBackend)}
        className="w-38 shrink-0"
        buttonClassName="h-7 w-full shrink-0 border-violet-700/40 bg-zinc-900/90 px-2 text-[11px] font-medium text-zinc-100"
        leadingIcon={<Icon className={iconClassName} strokeWidth={2.25} aria-hidden />}
      />
    </div>
  );
}
