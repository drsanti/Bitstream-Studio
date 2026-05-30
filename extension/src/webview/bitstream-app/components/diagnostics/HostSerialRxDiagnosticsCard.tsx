import { Antenna } from "lucide-react";
import { TRNInteractiveCard } from "@/ui/TRN";
import { BitstreamBridgeSerialRxBadge } from "../../../bitstream-shell/ui/BitstreamTelemetryRxBadges";

export function HostSerialRxDiagnosticsCard()
{
  return (
    <TRNInteractiveCard
      collapsible={false}
      title="Host serial RX"
      titleLeadingSlot={<Antenna className="size-3.5 text-zinc-500" aria-hidden />}
      contentClassName="space-y-2 pt-0"
    >
      <BitstreamBridgeSerialRxBadge variant="panel" panelEmbed />
    </TRNInteractiveCard>
  );
}

