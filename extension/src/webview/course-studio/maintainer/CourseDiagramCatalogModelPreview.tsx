import { Box, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { getThumbnailFromCache } from "../../model-catalog/thumbnail-cache";
import { scanModelCatalogAssets } from "../../model-catalog/modelCatalog-asset-scan";
import type { Diagram3dModelIdV1 } from "../schemas/diagram.v1";
import {
  catalogKeyFromDiagram3dModelId,
  diagram3dModelIdLabel,
  isCatalogDiagram3dModelId,
  isProceduralDiagram3dModelId,
} from "../runtime/diagram/diagram3dModelId";

export function CourseDiagramCatalogModelPreview({
  modelId,
}: {
  modelId: Diagram3dModelIdV1;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadThumbnail(): Promise<void> {
      if (!isCatalogDiagram3dModelId(modelId)) {
        setThumbnailUrl(null);
        return;
      }

      const catalogKey = catalogKeyFromDiagram3dModelId(modelId);
      const scanned = scanModelCatalogAssets().find((entry) => entry.dedupeKey === catalogKey);
      const cacheKey = scanned?.url ?? catalogKey;
      const cached = await getThumbnailFromCache(cacheKey);
      if (!cancelled) {
        setThumbnailUrl(cached);
      }
    }

    void loadThumbnail();
    return () => {
      cancelled = true;
    };
  }, [modelId]);

  const label = diagram3dModelIdLabel(modelId);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-700/70 bg-zinc-950/35 p-2.5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-700/60 bg-zinc-900/80">
        {thumbnailUrl != null ? (
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : isProceduralDiagram3dModelId(modelId) ? (
          <Cpu size={22} strokeWidth={1.75} className="text-amber-400/85" />
        ) : (
          <Box size={22} strokeWidth={1.75} className="text-zinc-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-2xs font-semibold uppercase tracking-wide text-zinc-400">Model preview</div>
        <div className="truncate text-sm font-medium text-zinc-200">{label}</div>
        {isCatalogDiagram3dModelId(modelId) && thumbnailUrl == null ? (
          <div className="text-2xs text-zinc-500">
            Open Asset Manager to generate catalog thumbnails.
          </div>
        ) : null}
      </div>
    </div>
  );
}
