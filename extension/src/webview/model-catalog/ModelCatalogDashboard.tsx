import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Trash2,
  ImageIcon,
  Menu,
  X,
  Package,
  Maximize2,
} from "lucide-react";
import { Card } from "../ui/components/Card";
import { Input } from "../ui/components/Input";
import { GlassDropdown } from "../ui/components/GlassDropdown";
import { IconMenu, type IconMenuItem } from "../ui/components/IconMenu";
import type { ModelEntry } from "./modelCatalog-types";
import { scanModelCatalogAssets } from "./modelCatalog-asset-scan";
import { mergeCatalogModels } from "./modelCatalogMerge";
import { ModelCatalogBridgeDownloaded } from "./ModelCatalogBridgeDownloaded";
import {
  MODEL_CATALOG_LOCAL_MODELS_CHANGED_MESSAGE,
  MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT,
} from "./modelCatalogEvents";
import {
  getThumbnailFromCache,
  setThumbnailInCache,
  clearThumbnailCache,
} from "./thumbnail-cache";
import { generateThumbnailDataUrl } from "./thumbnail-generator";
import { buildGlobalDirectoryFallbackOptions } from "../asset-resolution/global-directory-online-fallback";
import { catalogDedupeKeyToResolveRelativePath } from "./modelCatalogMerge";
import { preflightModelPreviewUrlWithGlobalDirectoryFallback } from "../model-loader/ui/preflightModelPreviewUrl";
import { ModelPreviewModal } from "./ModelPreviewModal";
import { openAnimationLabForCatalogEntry } from "../bitstream-app/components/animation-lab/open-animation-lab-from-catalog.js";
import { resolveCatalogModelPreviewUrl } from "./resolve-catalog-model-preview-url";
import { formatModelDisplayName } from "./formatModelDisplayName";
import { useModalFullscreenFill } from "../ui/useModalFullscreenFill";
import { BridgeRequiredEmptyState } from "../ui/components/BridgeRequiredEmptyState";
import { getModelLoaderWsClientUrl } from "../runtimeWsUrls";

export interface ModelCatalogDashboardProps {
  open: boolean;
  onClose: () => void;
}

type ThumbnailState =
  | { status: "loading" }
  | { status: "ready"; dataUrl: string }
  | { status: "error"; message: string };

export function ModelCatalogDashboard({
  open,
  onClose,
}: ModelCatalogDashboardProps) {
  const [query, setQuery] = useState("");

  const [selectedModelUrl, setSelectedModelUrl] = useState<string | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null,
  );
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { fillViewport, toggleFillParent, exitFillParent } =
    useModalFullscreenFill(open);

  const [refreshNonce, setRefreshNonce] = useState(0);
  /** Increments when the local downloads list should be rescanned (disk may have new folders). */
  const [downloadedListNonce, setDownloadedListNonce] = useState(0);
  const [thumbRefreshNonce, setThumbRefreshNonce] = useState(0);
  const staticModels = useMemo(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return scanModelCatalogAssets();
  }, [refreshNonce]);

  const isExtension =
    typeof window !== "undefined" &&
    !!(window as Window & { __VSCODE_API__?: unknown }).__VSCODE_API__;
  const isInstalledVsixRuntime = useMemo(() => {
    if (typeof window === "undefined") return false;
    const localBase = (
      window as Window & { LOCAL_ASSETS_BASE_URI?: string }
    ).LOCAL_ASSETS_BASE_URI;
    if (!localBase) return false;
    const normalized = localBase.replace(/\\/g, "/").toLowerCase();
    // Installed extension path example:
    // .../users/<name>/.vscode/extensions/<publisher>.<name>-<version>/out/webview/assets/
    return normalized.includes("/.vscode/extensions/");
  }, []);

  const [bridgeStatus, setBridgeStatus] = useState<{
    connectionState: string;
    error?: string | null;
  }>({ connectionState: "disconnected", error: null });

  const [extensionDownloadedModels, setExtensionDownloadedModels] = useState<
    ModelEntry[]
  >([]);
  const [browserDownloadedModels, setBrowserDownloadedModels] = useState<
    ModelEntry[]
  >([]);

  const onBrowserDownloadedModels = useCallback((models: ModelEntry[]) => {
    setBrowserDownloadedModels(models);
  }, []);

  /** Extension host: push when a download finishes writing to disk. */
  useEffect(() => {
    if (!open) return;
    const onExtensionPush = (event: MessageEvent) => {
      const msg = event.data as { type?: string } | undefined;
      if (msg?.type === MODEL_CATALOG_LOCAL_MODELS_CHANGED_MESSAGE) {
        setDownloadedListNonce((n) => n + 1);
      }
    };
    window.addEventListener("message", onExtensionPush);
    return () => window.removeEventListener("message", onExtensionPush);
  }, [open]);

  /** Browser: Model Loader dispatches after a successful download. */
  useEffect(() => {
    if (!open) return;
    const bump = () => setDownloadedListNonce((n) => n + 1);
    window.addEventListener(MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT, bump);
    return () =>
      window.removeEventListener(MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT, bump);
  }, [open]);

  /** Local downloads sync occurs once on open; subsequent updates are manual/event-driven. */

  useEffect(() => {
    if (!open) return;
    const vscodeApi =
      ((typeof window !== "undefined" &&
        (window as Window & { __VSCODE_API__?: unknown }).__VSCODE_API__) as
        | { postMessage?: (message: unknown) => void }
        | undefined) || null;
    if (!vscodeApi) {
      setExtensionDownloadedModels([]);
      return;
    }

    let cancelled = false;
    const requestId = `model-catalog-dl-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const onMessage = (event: MessageEvent) => {
      const msg = event.data as {
        type?: string;
        requestId?: string;
        downloadedModels?: Array<
          Omit<ModelEntry, "modelCategory"> & {
            category?: string;
            modelCategory?: string;
          }
        >;
      };
      if (
        msg?.type !== "model-catalog-downloaded-models-response" ||
        msg.requestId !== requestId
      ) {
        return;
      }
      if (!cancelled) {
        setExtensionDownloadedModels(
          (msg.downloadedModels ?? []).map((entry) => ({
            ...entry,
            modelCategory:
              typeof entry.modelCategory === "string" &&
              entry.modelCategory.trim() !== ""
                ? entry.modelCategory.trim()
                : typeof entry.category === "string" &&
                    entry.category.trim() !== ""
                  ? entry.category.trim()
                  : "Uncategorized",
          })),
        );
      }
    };

    window.addEventListener("message", onMessage);
    if (typeof vscodeApi.postMessage !== "function") {
      return () => {
        cancelled = true;
        window.removeEventListener("message", onMessage);
      };
    }

    vscodeApi.postMessage({
      type: "model-catalog-get-downloaded-models",
      requestId,
    });

    return () => {
      cancelled = true;
      window.removeEventListener("message", onMessage);
    };
  }, [open, refreshNonce, downloadedListNonce]);

  const dynamicDownloadedModels = isExtension
    ? extensionDownloadedModels
    : browserDownloadedModels;

  const effectiveStaticModels = useMemo(() => {
    if (!isExtension || !isInstalledVsixRuntime) {
      return staticModels;
    }
    // In installed VSIX, packaged GLB/GLTF may be intentionally omitted from the package
    // (or not available at runtime). Showing those static cards causes 404 preview URLs
    // under out/webview/assets. Prefer runtime-managed downloaded entries only.
    return staticModels.filter((m) => m.catalogCategory !== "packaged");
  }, [isExtension, isInstalledVsixRuntime, staticModels]);

  const models = useMemo(
    () => mergeCatalogModels(effectiveStaticModels, dynamicDownloadedModels),
    [effectiveStaticModels, dynamicDownloadedModels],
  );

  const shouldShowBridgeEmptyState =
    open &&
    !isExtension &&
    models.length === 0 &&
    bridgeStatus.connectionState !== "connected";

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const categoryOptions = useMemo(() => {
    const values = new Set<string>();
    for (const model of models) {
      const category = model.modelCategory?.trim();
      if (category) {
        values.add(category);
      }
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [models]);

  useEffect(() => {
    if (categoryFilter === "all") {
      return;
    }
    if (!categoryOptions.includes(categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, categoryOptions]);

  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models.filter((m) => {
      const matchesCategory =
        categoryFilter === "all" ? true : m.modelCategory === categoryFilter;
      const matchesQuery =
        q.length === 0 ? true : m.name.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [models, query, categoryFilter]);

  const [thumbById, setThumbById] = useState<Record<string, ThumbnailState>>(
    {},
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const activeModelIds = new Set(filteredModels.map((m) => m.id));

    // VS Code webview can be strict about concurrent WebGL contexts.
    // Keep thumbnail rendering sequential for stability.
    const workerCount = 1;
    const queue = filteredModels.map((m) => m);
    let nextIndex = 0;

    const runWorker = async () => {
      while (!cancelled) {
        const i = nextIndex;
        nextIndex++;
        if (i >= queue.length) return;

        const model = queue[i];
        const modelId = model.id;

        if (!activeModelIds.has(modelId)) {
          continue;
        }

        setThumbById((prev) => {
          if (prev[modelId]?.status === "ready") return prev;
          return { ...prev, [modelId]: { status: "loading" } };
        });

        try {
          const modelUrl = resolveCatalogModelPreviewUrl(model);
          const cached = await getThumbnailFromCache(modelId);
          if (cancelled) return;
          if (cached) {
            setThumbById((prev) => ({
              ...prev,
              [modelId]: { status: "ready", dataUrl: cached },
            }));
            continue;
          }

          const packRel = catalogDedupeKeyToResolveRelativePath(model.dedupeKey);
          const pf = await preflightModelPreviewUrlWithGlobalDirectoryFallback(
            modelUrl,
            buildGlobalDirectoryFallbackOptions(modelUrl, {
              packRelativePath: packRel ?? undefined,
            }),
            new AbortController().signal,
          );
          if (cancelled) return;
          if (!pf.ok) {
            setThumbById((prev) => ({
              ...prev,
              [modelId]: { status: "error", message: pf.message },
            }));
            continue;
          }

          const dataUrl = await generateThumbnailDataUrl(pf.url);
          if (cancelled) return;

          await setThumbnailInCache(modelId, dataUrl);
          setThumbById((prev) => ({
            ...prev,
            [modelId]: { status: "ready", dataUrl },
          }));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to generate thumbnail";
          console.error("[ModelCatalog] Thumbnail generation failed", {
            modelId,
            modelUrl: resolveCatalogModelPreviewUrl(model),
            message,
            err,
          });
          setThumbById((prev) => ({
            ...prev,
            [modelId]: { status: "error", message },
          }));
        }
      }
    };

    // Start (only thumbnails for currently filtered models).
    setThumbById((prev) => {
      const next: Record<string, ThumbnailState> = { ...prev };
      filteredModels.forEach((m) => {
        if (!next[m.id]) {
          next[m.id] = { status: "loading" };
        }
      });
      return next;
    });

    const workers: Promise<void>[] = [];
    for (let w = 0; w < workerCount; w++) {
      workers.push(runWorker());
    }

    return () => {
      cancelled = true;
      void Promise.all(workers).catch(() => undefined);
    };
  }, [open, filteredModels, thumbRefreshNonce]);

  /** Hide entries whose preview URL cannot be fetched (missing file, HTML fallback, etc.). */
  const visibleCatalogModels = useMemo(
    () =>
      filteredModels.filter((model) => thumbById[model.id]?.status !== "error"),
    [filteredModels, thumbById],
  );

  const showCatalogEmptyMessage =
    visibleCatalogModels.length === 0 &&
    filteredModels.length > 0 &&
    !shouldShowBridgeEmptyState;

  const showCatalogNoModelsMessage =
    filteredModels.length === 0 && !shouldShowBridgeEmptyState;

  // Close selected model modal if the dashboard closes.
  useEffect(() => {
    if (!open) {
      setSelectedModelUrl(null);
      setSelectedModelName(null);
      setMenuOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (menuOpen) {
        setMenuOpen(false);
        return;
      }
      if (fillViewport) {
        exitFillParent();
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, fillViewport, exitFillParent, onClose, open]);

  const menuItems: IconMenuItem[] = useMemo(
    () => [
      {
        id: "refresh-list",
        label: "Refresh list",
        icon: <RefreshCw className="h-3.5 w-3.5 shrink-0" />,
        onSelect: () => setRefreshNonce((n) => n + 1),
        title: "Rescan packaged models and refresh downloaded list",
      },
      {
        id: "rerender",
        label: "Re-render",
        icon: <ImageIcon className="h-3.5 w-3.5 shrink-0" />,
        onSelect: () => {
          setThumbById({});
          setThumbRefreshNonce((n) => n + 1);
        },
        title: "Re-render thumbnails (use cache if present)",
      },
      {
        id: "clear-cache",
        label: "Clear cache",
        icon: <Trash2 className="h-3.5 w-3.5 shrink-0" />,
        onSelect: () => {
          clearThumbnailCache();
          setThumbById({});
          setThumbRefreshNonce((n) => n + 1);
        },
        title: "Clear cached thumbnails and regenerate",
      },
      {
        id: "full-screen",
        label: fillViewport ? "Exit full screen" : "Full screen",
        icon: <Maximize2 className="h-3.5 w-3.5 shrink-0" />,
        onSelect: () => {
          toggleFillParent();
        },
        title: fillViewport
          ? "Restore Model Catalog to its default size"
          : "Expand Model Catalog to fill the webview",
      },
      {
        id: "close",
        label: "Close",
        icon: <X className="h-3.5 w-3.5 shrink-0" />,
        onSelect: onClose,
        title: "Close model catalog",
      },
    ],
    [onClose, fillViewport, toggleFillParent],
  );

  if (!open) return null;

  const badgePalette = [
    "border-emerald-300/35 bg-emerald-500/15 text-emerald-100",
    "border-sky-300/35 bg-sky-500/15 text-sky-100",
    "border-violet-300/35 bg-violet-500/15 text-violet-100",
    "border-amber-300/35 bg-amber-500/15 text-amber-100",
    "border-rose-300/35 bg-rose-500/15 text-rose-100",
    "border-cyan-300/35 bg-cyan-500/15 text-cyan-100",
  ] as const;
  const resolveCategoryBadgeClassName = (category: string): string => {
    const value = category.trim().toLowerCase();
    if (!value) {
      return "border-white/15 bg-white/8 text-gray-200";
    }
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return badgePalette[hash % badgePalette.length];
  };

  return (
    <>
      {!isExtension && (
        <ModelCatalogBridgeDownloaded
          active={open}
          refreshNonce={refreshNonce}
          downloadedListNonce={downloadedListNonce}
          onModels={onBrowserDownloadedModels}
          onStatus={setBridgeStatus}
        />
      )}
      <div
        className={
          fillViewport
            ? "t3d-shell-overlay fixed inset-0 z-50 flex min-h-0 w-full flex-col bg-black/45 p-0 backdrop-blur-sm"
            : "t3d-shell-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
        }
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget) return;
          onClose();
        }}
      >
        <div
          className={
            fillViewport
              ? "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden scrollbar-dark-small"
              : "h-[90%] w-[90%] overflow-auto scrollbar-dark-small"
          }
        >
          <Card
            title={
              <>
                <Package
                  className="h-5 w-5 shrink-0 text-gray-200"
                  aria-hidden
                />
                <span>Model Catalog</span>
              </>
            }
            headerClassName="py-[8px]"
            className={
              fillViewport
                ? "flex h-full min-h-0 flex-col overflow-hidden rounded-none border-0 bg-white/8 backdrop-blur-2xl shadow-none ring-0"
                : "border border-white/15 bg-white/8 backdrop-blur-2xl shadow-2xl shadow-black/35 ring-1 ring-white/8"
            }
            headerActions={
              <IconMenu
                open={menuOpen}
                onOpenChange={setMenuOpen}
                triggerIcon={<Menu className="h-5 w-5 shrink-0" />}
                triggerTitle="Open model catalog menu"
                items={menuItems}
              />
            }
          >
            <div className="relative flex min-h-0 flex-1 flex-col gap-4">
              <div
                className={`pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-cyan-300/8 ${
                  fillViewport ? "rounded-none" : "rounded-md"
                }`}
              />
              {shouldShowBridgeEmptyState ? (
                <div className="relative">
                  <BridgeRequiredEmptyState
                    title="Model Catalog needs the Model Downloader bridge in browser mode"
                    details="This page can’t scan your local downloads from a standalone browser unless the bridge server is running."
                    wsUrl={getModelLoaderWsClientUrl()}
                    commands={[
                      "npm run dev:model-loader-browser",
                      "npm run dev:with-model-loader",
                    ]}
                    extensionHint={`With the TERNION extension installed and loaded, the model broker on ${getModelLoaderWsClientUrl()} should start automatically. Reload this page after a few seconds, or run the dev commands above if you are not using the packaged extension.`}
                  />
                </div>
              ) : null}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center model-catalog-filter-row w-full">
                <div className="w-full sm:w-64 shrink-0">
                  <Input
                    placeholder="Search models..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    inputClassName="h-9 rounded-md py-1.5 text-sm"
                  />
                </div>
                <div className="flex flex-row flex-wrap items-center gap-3 w-full min-w-0 sm:flex-1">
                  <div className="w-full min-w-0 sm:w-64 shrink-0">
                    <GlassDropdown
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      options={[
                        { value: "all", label: "All Categories" },
                        ...categoryOptions.map((category) => ({
                          value: category,
                          label: category,
                        })),
                      ]}
                      ariaLabel="Filter by category"
                      triggerClassName="border-white/10 bg-neutral-950/80 focus:border-white/25 focus:ring-white/10"
                      menuClassName="border-white/10 bg-neutral-950/85"
                    />
                  </div>
                  <div
                    className="text-sm text-gray-400 shrink-0 ml-auto flex items-center justify-end gap-2 text-right"
                    aria-live="polite"
                  >
                    <span className="whitespace-nowrap">
                      {categoryOptions.length}{" "}
                      {categoryOptions.length === 1 ? "category" : "categories"}
                    </span>
                    <span className="text-gray-500 select-none" aria-hidden>
                      ·
                    </span>
                    <span className="whitespace-nowrap">
                      {visibleCatalogModels.length}{" "}
                      {visibleCatalogModels.length === 1 ? "model" : "models"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={
                  fillViewport
                    ? "min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-dark-small"
                    : "max-h-[58vh] overflow-y-auto pr-1 scrollbar-dark-small"
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {showCatalogNoModelsMessage ? (
                    <p className="col-span-full text-center text-sm text-gray-400 py-10 px-4">
                      No models in this catalog yet. Download models from Model Loader (or
                      ensure packaged assets are present), then refresh the catalog.
                    </p>
                  ) : null}
                  {showCatalogEmptyMessage ? (
                    <p className="col-span-full text-center text-sm text-gray-400 py-10 px-4">
                      No loadable models match your filters. Some entries were hidden because
                      their files are missing or not reachable from this session.
                    </p>
                  ) : null}
                  {visibleCatalogModels.map((model) => {
                    const thumb = thumbById[model.id];
                    const imgSrc =
                      thumb && thumb.status === "ready" ? thumb.dataUrl : null;
                    const thumbReady = thumb?.status === "ready";
                    const displayName = formatModelDisplayName(model.name);

                    return (
                      <div key={model.id} className="group flex flex-col gap-1 text-left">
                        <button
                          type="button"
                          className="disabled:cursor-wait"
                          disabled={!thumbReady}
                          onClick={() => {
                            if (!thumbReady) {
                              return;
                            }
                            setSelectedModelId(model.id);
                            setSelectedModelUrl(
                              resolveCatalogModelPreviewUrl(model),
                            );
                            setSelectedModelName(displayName);
                          }}
                          title={displayName}
                        >
                          <div className="relative rounded-lg border border-white/10 bg-neutral-950/75 backdrop-blur-xl p-2 shadow-md shadow-black/30 ring-1 ring-black/25 transition-colors group-hover:border-blue-400/35">
                            <div className="pointer-events-none absolute inset-0 rounded-lg bg-linear-to-br from-white/6 via-transparent to-cyan-400/6" />
                            <div className="aspect-square rounded-md overflow-hidden border border-border/60 bg-gray-900/40">
                              {imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-white/5 animate-pulse" aria-hidden />
                              )}
                            </div>
                            <div className="mt-2">
                              <div className="text-sm font-semibold truncate text-gray-100">
                                {displayName}
                              </div>
                              <div className="text-xs text-gray-400 flex flex-col gap-1">
                                <span
                                  className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] ${resolveCategoryBadgeClassName(
                                    model.modelCategory || "Uncategorized",
                                  )}`}
                                >
                                  {model.modelCategory || "Uncategorized"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                        {thumbReady ? (
                          <button
                            type="button"
                            className="w-fit rounded border border-cyan-500/30 bg-cyan-950/30 px-2 py-0.5 text-[10px] font-medium text-cyan-100/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-cyan-900/40"
                            onClick={() => openAnimationLabForCatalogEntry(model)}
                          >
                            Animation Lab
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <ModelPreviewModal
            open={selectedModelUrl !== null}
            onClose={() => {
              setSelectedModelId(null);
              setSelectedModelUrl(null);
              setSelectedModelName(null);
            }}
            catalogModelId={selectedModelId}
            modelUrl={selectedModelUrl}
            modelName={selectedModelName}
            onCaptureThumbnail={async (dataUrl) => {
              const modelId = selectedModelId;
              if (!modelId) {
                return;
              }
              await setThumbnailInCache(modelId, dataUrl);
              setThumbById((prev) => ({
                ...prev,
                [modelId]: { status: "ready", dataUrl },
              }));
            }}
          />
        </div>
      </div>
    </>
  );
}
