import type { ReactNode } from "react";
import { FreeAssetsLoaderConnectionChip } from "./FreeAssetsLoaderConnectionChip.js";

function HeaderStats(props: {
  onlineCount: number;
  localCount: number;
  selectedCount: number;
  listLoading: boolean;
}): ReactNode {
  const { onlineCount, localCount, selectedCount, listLoading } = props;
  const catalogLabel = listLoading ? "…" : String(onlineCount);

  return (
    <p
      className="hidden shrink-0 text-[10px] text-zinc-500 lg:block"
      aria-label={`Catalog ${catalogLabel}, on disk ${localCount}, selected ${selectedCount}`}
    >
      <span>
        Catalog{" "}
        <span className="font-medium text-zinc-300">{catalogLabel}</span>
      </span>
      <span className="mx-1.5 text-zinc-600" aria-hidden>
        ·
      </span>
      <span>
        On disk <span className="font-medium text-zinc-300">{localCount}</span>
      </span>
      <span className="mx-1.5 text-zinc-600" aria-hidden>
        ·
      </span>
      <span>
        Selected{" "}
        <span
          className={
            selectedCount > 0 ? "font-medium text-cyan-200/90" : "font-medium text-zinc-300"
          }
        >
          {selectedCount}
        </span>
      </span>
    </p>
  );
}

/** TRNWindow `headerActions`: catalog stats + bridge chip (stop drag on pointer down). */
export function FreeAssetsLoaderHeaderActions(props: {
  isExtension: boolean;
  connectionState: string;
  onlineCount: number;
  localCount: number;
  selectedCount: number;
  listLoading: boolean;
}): ReactNode {
  const {
    isExtension,
    connectionState,
    onlineCount,
    localCount,
    selectedCount,
    listLoading,
  } = props;

  return (
    <div
      className="flex shrink-0 items-center gap-2"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <HeaderStats
        onlineCount={onlineCount}
        localCount={localCount}
        selectedCount={selectedCount}
        listLoading={listLoading}
      />
      <FreeAssetsLoaderConnectionChip
        isExtension={isExtension}
        connectionState={connectionState}
      />
    </div>
  );
}
