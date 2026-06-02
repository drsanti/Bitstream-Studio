import { Play } from "lucide-react";
import { ensureBitstreamSimulatorReady } from "../bitstream-app/bridge/requestBitstreamSimulatorHost.js";
import { TRNButton } from "../ui/TRN/TRNButton.js";
import { TRNHintText } from "../ui/TRN/TRNHintText.js";

export function StartupChecklistSimulatorStepBody() {
  return (
    <div className="space-y-2">
      <TRNHintText className="text-[10px] text-zinc-500">
        Install and start the bitstream-simulator VSIX, then connect the bridge in Simulator
        toolbar mode. UART stays closed.
      </TRNHintText>
      <TRNButton
        size="compact"
        selected
        prefixIcon={<Play className="h-3 w-3" aria-hidden />}
        onClick={() => void ensureBitstreamSimulatorReady()}
      >
        Start simulator
      </TRNButton>
    </div>
  );
}
