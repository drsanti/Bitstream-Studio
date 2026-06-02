import { TRNButton } from "../ui/TRN/TRNButton.js";
import { useBitstreamTelemetrySourceStore } from "../bitstream-app/state/bitstreamTelemetrySource.store.js";

export function StartupChecklistModeStepBody() {
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const setBackend = useBitstreamTelemetrySourceStore((s) => s.setBackend);

  return (
    <div className="flex flex-wrap gap-2">
      <TRNButton
        selected={backend === "uart"}
        size="compact"
        onClick={() => setBackend("uart")}
      >
        Bitstream (UART)
      </TRNButton>
      <TRNButton
        selected={backend === "simulator"}
        size="compact"
        onClick={() => setBackend("simulator")}
      >
        Simulator
      </TRNButton>
    </div>
  );
}
