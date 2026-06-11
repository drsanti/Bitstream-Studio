import {
  coerceDashboardImageFit,
  readDashboardImageUrl,
} from "../../core/dashboard/dashboard-image-fit";

type Props = {
  wiredUrl: string | number | boolean | null;
  defaultConfig: Record<string, unknown>;
};

export function DashboardImageTilePanel({ wiredUrl, defaultConfig }: Props) {
  const url = readDashboardImageUrl(defaultConfig, wiredUrl);
  const fit = coerceDashboardImageFit(defaultConfig.objectFit);
  const caption = typeof defaultConfig.caption === "string" ? defaultConfig.caption.trim() : "";

  if (url.length === 0) {
    return (
      <div className="flex h-full min-h-[var(--dashboard-row-height,96px)] flex-col items-center justify-center gap-1 px-3 py-2 text-center">
        <span className="text-[11px] text-zinc-500">No image URL</span>
        <span className="text-[10px] text-zinc-600">Wire a string URL or set Image URL on the node.</span>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-zinc-950/40">
        <img
          src={url}
          alt={caption.length > 0 ? caption : "Dashboard image"}
          className="size-full"
          style={{ objectFit: fit }}
          draggable={false}
        />
      </div>
      {caption.length > 0 ? (
        <div className="shrink-0 border-t border-zinc-800/70 px-2 py-1 text-[10px] text-zinc-400">
          {caption}
        </div>
      ) : null}
    </div>
  );
}
