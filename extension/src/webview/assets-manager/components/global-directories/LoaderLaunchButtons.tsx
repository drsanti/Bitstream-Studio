import type { ReactNode } from "react";
import { CloudDownload, Download, Package } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../../ui/TRN";

const HOST_UNAVAILABLE = "Not available in this host";

export type LoaderLaunchButtonsProps = {
  onOpenModelLoader?: () => void;
  onOpenFreeAssetsLoader?: () => void;
  onOpenModelCatalog?: () => void;
  /** Native tooltip when Model Loader is unavailable (e.g. bridge down). */
  modelLoaderDisabledReason?: string;
  /** Native tooltip when Free loader is unavailable. */
  freeLoaderDisabledReason?: string;
  className?: string;
  /** `inline` matches Overview density; `stacked` is for the Actions tab (full-width column). */
  layout?: "inline" | "stacked";
  /** Default TRN button size; use `default` on Actions for clearer primary targets. */
  buttonSize?: "default" | "compact";
};

function UnavailableLauncherWrap(props: {
  reason?: string;
  children: ReactNode;
  layout: "inline" | "stacked";
}) {
  const { reason, children, layout } = props;
  return (
    <span
      className={layout === "stacked" ? "block w-full" : "inline-flex"}
      title={reason ?? HOST_UNAVAILABLE}
    >
      {children}
    </span>
  );
}

/**
 * Presentational row for opening Model Loader, Free loader, and Browse models (Asset Manager).
 * @see ../../../../docs/GLOBAL_DIRECTORIES_PANEL_DESIGN.md (Launchers)
 */
export function LoaderLaunchButtons(props: LoaderLaunchButtonsProps) {
  const {
    onOpenModelLoader,
    onOpenFreeAssetsLoader,
    onOpenModelCatalog,
    modelLoaderDisabledReason,
    freeLoaderDisabledReason,
    className = "",
    layout = "inline",
    buttonSize = "compact",
  } = props;

  const wrapClass =
    layout === "stacked"
      ? "flex w-full max-w-md flex-col gap-2"
      : "flex flex-wrap items-center gap-2";

  const mlUnavailable = onOpenModelLoader == null;
  const freeUnavailable = onOpenFreeAssetsLoader == null;
  const catalogUnavailable = onOpenModelCatalog == null;

  const btnClass = layout === "stacked" ? "w-full justify-start gap-2" : "gap-1.5";
  const iconClass =
    buttonSize === "default"
      ? "h-4 w-4 shrink-0 opacity-90"
      : "h-3 w-3 shrink-0 opacity-90";

  const modelButton = (
    <TRNButton
      type="button"
      size={buttonSize}
      disabled={mlUnavailable}
      className={btnClass}
      onClick={() => onOpenModelLoader?.()}
    >
      <Download className={iconClass} aria-hidden />
      Model Loader
    </TRNButton>
  );

  const freeButton = (
    <TRNButton
      type="button"
      size={buttonSize}
      disabled={freeUnavailable}
      className={btnClass}
      onClick={() => onOpenFreeAssetsLoader?.()}
    >
      <CloudDownload className={iconClass} aria-hidden />
      Free loader
    </TRNButton>
  );

  const catalogButton = (
    <TRNButton
      type="button"
      size={buttonSize}
      disabled={catalogUnavailable}
      className={btnClass}
      onClick={() => onOpenModelCatalog?.()}
    >
      <Package className={iconClass} aria-hidden />
      Browse models
    </TRNButton>
  );

  return (
    <div className={twMerge(wrapClass, className)}>
      {mlUnavailable ? (
        <UnavailableLauncherWrap reason={modelLoaderDisabledReason} layout={layout}>
          {modelButton}
        </UnavailableLauncherWrap>
      ) : (
        modelButton
      )}
      {freeUnavailable ? (
        <UnavailableLauncherWrap reason={freeLoaderDisabledReason} layout={layout}>
          {freeButton}
        </UnavailableLauncherWrap>
      ) : (
        freeButton
      )}
      {catalogUnavailable ? (
        <UnavailableLauncherWrap layout={layout}>{catalogButton}</UnavailableLauncherWrap>
      ) : (
        catalogButton
      )}
    </div>
  );
}
