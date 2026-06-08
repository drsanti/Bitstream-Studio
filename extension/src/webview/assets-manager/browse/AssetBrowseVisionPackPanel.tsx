import { Download } from "lucide-react";
import { useMemo } from "react";
import { usePreviewMeshMissingUiStore } from "../../bitstream-app/state/previewMeshMissingUi.store";
import { TRNButton, TRNHintText } from "../../ui/TRN/index.js";
import {
  visionMediapipeFriendlyFileLabel,
  visionMediapipeFullOptionalPackFiles,
} from "../../sensor-studio/core/camera/vision-mediapipe-pack-availability";
import { useVisionMediapipePackAvailability } from "../../sensor-studio/core/camera/useVisionMediapipePackAvailability";

export function AssetBrowseVisionPackPanel(props: { borderColor: string }) {
  const { borderColor } = props;
  const optionalFiles = useMemo(() => [...visionMediapipeFullOptionalPackFiles()], []);
  const availability = useVisionMediapipePackAvailability(optionalFiles);
  const syncedCount = optionalFiles.length - availability.missing.length;

  return (
    <div
      className="mt-2 shrink-0 space-y-2 rounded-lg border border-zinc-800/90 bg-zinc-950/40 p-2"
      style={{ borderColor }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-zinc-200">Optional vision models</p>
        <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-400">
          {availability.checking
            ? "Checking…"
            : `${syncedCount}/${optionalFiles.length} on device`}
        </span>
      </div>
      <TRNHintText tone="muted" className="text-[10px] leading-snug">
        Lite pose + WASM ship in the VSIX. Hand, face, object, and full/heavy pose models sync via
        Free Loader (~81 MB full pack).
      </TRNHintText>
      <ul className="space-y-0.5">
        {optionalFiles.map((file) => {
          const missing = availability.missing.includes(file);
          const label = visionMediapipeFriendlyFileLabel(file);
          return (
            <li
              key={file}
              className="flex items-center gap-2 text-[10px] leading-snug text-zinc-400"
            >
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  availability.checking
                    ? "bg-zinc-600"
                    : missing
                      ? "bg-amber-400/90"
                      : "bg-emerald-400/90"
                }`}
                aria-hidden
              />
              <span className={missing && !availability.checking ? "text-amber-100/90" : undefined}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <TRNButton
        size="compact"
        className="w-full justify-center gap-1.5"
        prefixIcon={<Download className="size-3.5 shrink-0" aria-hidden />}
        onClick={() => usePreviewMeshMissingUiStore.getState().setFreeAssetsLoaderOpen(true)}
        hint="Opens Free Loader — Download vision models syncs assets/vision/mediapipe/ from the free pack."
      >
        Download vision models
      </TRNButton>
    </div>
  );
}
