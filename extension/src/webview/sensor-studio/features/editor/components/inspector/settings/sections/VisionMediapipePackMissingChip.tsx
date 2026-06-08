import { Download } from "lucide-react";
import { useMemo } from "react";
import { usePreviewMeshMissingUiStore } from "../../../../../../../bitstream-app/state/previewMeshMissingUi.store";
import { TRNButton } from "../../../../../../../ui/TRN";
import { FlowNodeHeaderBadge } from "../../../../nodes/flow-node/FlowNodeHeaderBadge";
import {
  visionMediapipeFriendlyFileLabel,
  visionMediapipeRequiredOptionalFiles,
} from "../../../../../../core/camera/vision-mediapipe-pack-availability";
import { useVisionMediapipePackAvailability } from "../../../../../../core/camera/useVisionMediapipePackAvailability";

export type VisionMediapipePackMissingChipProps = {
  catalogNodeId: string;
  config: Record<string, unknown>;
};

export function VisionMediapipePackMissingChip(props: VisionMediapipePackMissingChipProps) {
  const { catalogNodeId, config } = props;
  const requiredFiles = useMemo(
    () => visionMediapipeRequiredOptionalFiles({ catalogNodeId, config }),
    [catalogNodeId, config],
  );
  const availability = useVisionMediapipePackAvailability(requiredFiles);

  if (!availability.showMissingChip) {
    return null;
  }

  const labels = availability.missing.map(visionMediapipeFriendlyFileLabel);
  const detail =
    labels.length === 1
      ? `${labels[0]} is not on this device.`
      : `${labels.join(", ")} are not on this device.`;

  return (
    <div className="mb-2 rounded border border-amber-500/35 bg-amber-950/20 px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <FlowNodeHeaderBadge tone="stale">Model missing</FlowNodeHeaderBadge>
        <TRNButton
          size="compact"
          prefixIcon={<Download className="h-3 w-3 shrink-0" aria-hidden />}
          onClick={() => usePreviewMeshMissingUiStore.getState().setFreeAssetsLoaderOpen(true)}
          hint="Opens Free Loader — use Download vision models to sync the MediaPipe pack."
        >
          Free Loader
        </TRNButton>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-amber-100/85">{detail}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
        Prefer bundled models is on — sync optional models from the free pack, or switch to CDN
        under Model CDN (advanced).
      </p>
    </div>
  );
}
