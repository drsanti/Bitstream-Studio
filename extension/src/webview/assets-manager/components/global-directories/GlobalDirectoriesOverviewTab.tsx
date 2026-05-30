import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Compass, Laptop, Library, Package, Sparkles } from "lucide-react";
import { TRNHintText, TRNInteractiveCard, TRNMenuSectionTitle } from "../../../ui/TRN";
import type { LoaderLaunchButtonsProps } from "./LoaderLaunchButtons.js";
import { LoaderLaunchButtons } from "./LoaderLaunchButtons.js";

export type GlobalDirectoriesOverviewTabProps = Pick<
  LoaderLaunchButtonsProps,
  | "onOpenModelLoader"
  | "onOpenFreeAssetsLoader"
  | "onOpenModelCatalog"
  | "modelLoaderDisabledReason"
  | "freeLoaderDisabledReason"
>;

/**
 * Vite-only browser dev: we still keep Overview non-technical; devs use Disk layout / Runtime later.
 */
function useIsViteBrowserDev(): boolean {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return import.meta.env.DEV && window.WEBVIEW_READY !== true;
  }, []);
}

function useWorkspaceContext(isViteBrowserDev: boolean) {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return {
        headline: "Workspace",
        tagline: "Open this panel from the app to see how your assets are organized.",
      };
    }
    if (window.WEBVIEW_READY === true) {
      return {
        headline: "Editor workspace",
        tagline:
          "You’re inside VS Code or Cursor. Built-in previews and anything you download through the loaders stay with this extension—no need to hunt through the product repo on disk.",
      };
    }
    if (isViteBrowserDev) {
      return {
        headline: "Local preview",
        tagline:
          "You’re running a development build in the browser. The same loaders and ideas apply; exact folders can differ from a packaged install.",
      };
    }
    return {
      headline: "Browser workspace",
      tagline:
        "Built-in content and anything you download are kept for this app the way your host stores browser data—separate from the extension source tree.",
    };
  }, [isViteBrowserDev]);
}

type GlanceRowProps = {
  icon: LucideIcon;
  title: string;
  body: string;
};

function GlanceRow(props: GlanceRowProps) {
  const Icon = props.icon;
  return (
    <div className="flex gap-2.5 rounded-md border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
      <div className="mt-0.5 shrink-0 rounded-md border border-zinc-700/50 bg-zinc-900/60 p-1.5">
        <Icon className="h-3.5 w-3.5 text-cyan-400/80" aria-hidden />
      </div>
      <div className="min-w-0 space-y-0.5">
        <div className="text-[11px] font-semibold text-zinc-200">{props.title}</div>
        <p className="mb-0 text-[10px] leading-relaxed text-zinc-400">{props.body}</p>
      </div>
    </div>
  );
}

/**
 * Overview tab: plain-language summary of what assets exist and how to add more.
 * Paths and bases belong in Disk layout / Runtime.
 * @see ../../../../docs/GLOBAL_DIRECTORIES_PANEL_DESIGN.md (Tab: Overview)
 */
export function GlobalDirectoriesOverviewTab(props: GlobalDirectoriesOverviewTabProps) {
  const isViteBrowserDev = useIsViteBrowserDev();
  const workspace = useWorkspaceContext(isViteBrowserDev);

  const includedBody =
    "Boards, previews, and sample models that ship with the product so you can open scenes right away.";

  const libraryBody =
    typeof window !== "undefined" && window.WEBVIEW_READY === true
      ? "Everything you pull in later—catalog models, mirrored free-pack files, and textures—builds your personal library next to this extension."
      : "Catalog models, mirrored free-pack content, and textures you sync become your personal library for this install.";

  const moreBody =
    "Use the buttons below to browse the catalog, run the Model Loader, or sync the free GitHub pack when a scene needs something you don’t have yet.";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-start gap-2.5 rounded-md border border-zinc-700/60 bg-zinc-950/60 px-2.5 py-2">
        <Laptop className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400/85" aria-hidden />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="text-[11px] font-semibold text-zinc-100">{workspace.headline}</div>
          <p className="mb-0 text-[10px] leading-relaxed text-zinc-500">{workspace.tagline}</p>
        </div>
      </div>

      <TRNInteractiveCard
        collapsible={false}
        title="Your assets at a glance"
        titleLeadingSlot={<Library className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        contentClassName="space-y-2 pt-0"
      >
        <GlanceRow icon={Package} title="Included with the product" body={includedBody} />
        <GlanceRow icon={Sparkles} title="Your downloaded library" body={libraryBody} />
        <GlanceRow icon={Compass} title="Grow the library" body={moreBody} />
        <TRNHintText tone="muted" className="mb-0 mt-1 text-[10px] leading-snug">
          For exact folders, disk paths, and how URLs are resolved, use the{" "}
          <span className="font-medium text-zinc-400">Disk layout</span> and{" "}
          <span className="font-medium text-zinc-400">Runtime</span> tabs when they list data for
          your environment.
        </TRNHintText>
      </TRNInteractiveCard>

      <div className="shrink-0 space-y-1.5 rounded-md border border-zinc-700/60 bg-black/25 p-2">
        <TRNMenuSectionTitle spacing="labelOnly">Add or browse assets</TRNMenuSectionTitle>
        <LoaderLaunchButtons
          onOpenModelLoader={props.onOpenModelLoader}
          onOpenFreeAssetsLoader={props.onOpenFreeAssetsLoader}
          onOpenModelCatalog={props.onOpenModelCatalog}
          modelLoaderDisabledReason={props.modelLoaderDisabledReason}
          freeLoaderDisabledReason={props.freeLoaderDisabledReason}
        />
        <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
          Model Loader needs the downloader bridge in some setups; if a button is dimmed, hover for
          the reason.
        </TRNHintText>
      </div>
    </div>
  );
}
