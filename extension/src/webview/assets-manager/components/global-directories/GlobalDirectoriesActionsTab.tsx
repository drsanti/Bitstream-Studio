import { TRNHintText, TRNInteractiveCard } from "../../../ui/TRN";
import type { LoaderLaunchButtonsProps } from "./LoaderLaunchButtons.js";
import { LoaderLaunchButtons } from "./LoaderLaunchButtons.js";

export type GlobalDirectoriesActionsTabProps = Pick<
  LoaderLaunchButtonsProps,
  | "onOpenModelLoader"
  | "onOpenFreeAssetsLoader"
  | "onOpenModelCatalog"
  | "modelLoaderDisabledReason"
  | "freeLoaderDisabledReason"
>;

/**
 * Actions tab: primary entry points to download / sync tools (design: large, clear targets).
 */
export function GlobalDirectoriesActionsTab(props: GlobalDirectoriesActionsTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <TRNInteractiveCard
        collapsible={false}
        title="Download and sync"
        contentClassName="space-y-3 pt-0 text-[11px] leading-relaxed text-zinc-400"
      >
        <p className="mb-0">
          Open the same tools you use from the rest of the app: fetch catalog models, mirror the
          free GitHub pack, or browse the model catalog.
        </p>
        <LoaderLaunchButtons
          onOpenModelLoader={props.onOpenModelLoader}
          onOpenFreeAssetsLoader={props.onOpenFreeAssetsLoader}
          onOpenModelCatalog={props.onOpenModelCatalog}
          modelLoaderDisabledReason={props.modelLoaderDisabledReason}
          freeLoaderDisabledReason={props.freeLoaderDisabledReason}
          layout="stacked"
          buttonSize="default"
        />
        <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
          When a control is unavailable, hover the row—the wrapper keeps a native tooltip with the
          reason (for example Model Loader and the downloader bridge).
        </TRNHintText>
      </TRNInteractiveCard>

      <TRNInteractiveCard
        collapsible={false}
        title="Related in this panel"
        contentClassName="space-y-1.5 pt-0 text-[11px] text-zinc-400"
      >
        <ul className="mb-0 list-inside list-disc space-y-1 pl-0.5 marker:text-zinc-600">
          <li>
            <span className="font-medium text-zinc-300">Disk layout</span> — per-user folders,
            repo patterns, and bridge paths.
          </li>
          <li>
            <span className="font-medium text-zinc-300">Runtime</span> — injected LOCAL / FREE /
            ONLINE base URIs and refresh from host.
          </li>
          <li>
            <span className="font-medium text-zinc-300">Overview</span> — short narrative of what
            ships with the product vs your library.
          </li>
        </ul>
      </TRNInteractiveCard>
    </div>
  );
}
