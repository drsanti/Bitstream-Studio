import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Download, Key, Maximize2, Menu, Package, X } from "lucide-react";
import { AlertDialog } from "../ui/components/AlertDialog";
import { Card } from "../ui/components/Card";
import { IconMenu, type IconMenuItem } from "../ui/components/IconMenu";
import { useModelLoaderController } from "./hooks/useModelLoaderController";
import { useModelLoaderDownloads } from "./hooks/useModelLoaderDownloads";
import {
  ModelLoaderConfigCard,
  ModelLoaderLocalModelsTable,
  ModelLoaderModelDetailsCard,
  ModelLoaderResultsTable,
} from "./components";
import { MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT } from "../model-catalog/modelCatalogEvents";
import { projectRelativePathToDevUrl, bridgeWebPathToCatalogModelUrl } from "../model-catalog/modelCatalogMerge";
import { resolveTesaiotTexturesToFetchableUrl } from "../logical-asset-url";
import type { ModelLoaderDetailsSelection } from "./types";
import {
  getInvalidApiKeyDialogCopy,
  isLikelyInvalidApiKeyError,
} from "./modelLoaderAuthErrors";
import {
  DEV_SRC_ASSETS_PREFIX,
  FREE_MODELS_WEB_PREFIX,
  TESAIOT_MODELS_WEB_PREFIX,
  TESAIOT_TEXTURES_WEB_PREFIX,
} from "../../assetLayout";
import { useModalFullscreenFill } from "../ui/useModalFullscreenFill";
import { BridgeRequiredEmptyState } from "../ui/components/BridgeRequiredEmptyState";
import { getModelLoaderWsClientUrl } from "../runtimeWsUrls";

const MODEL_LOADER_MODAL_SIZE_KEY = "t3d.modelLoader.modalSize";
const MODAL_VIEWPORT_MARGIN = 32;
const MODAL_MIN_WIDTH = 480;
const MODAL_MIN_HEIGHT = 320;
/** Bottom-right region: show affordance and resize hit target (px from corner). */
const RESIZE_CORNER_PROXIMITY_PX = 48;

type ModalSize = { width: number; height: number };

function getDefaultModalSize(): ModalSize {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900 };
  }
  return {
    width: Math.round(window.innerWidth * 0.9),
    height: Math.round(window.innerHeight * 0.9),
  };
}

function clampModalSize(width: number, height: number): ModalSize {
  if (typeof window === "undefined") {
    return {
      width: Math.max(MODAL_MIN_WIDTH, Math.round(width)),
      height: Math.max(MODAL_MIN_HEIGHT, Math.round(height)),
    };
  }
  const maxW = Math.max(MODAL_MIN_WIDTH, window.innerWidth - MODAL_VIEWPORT_MARGIN);
  const maxH = Math.max(MODAL_MIN_HEIGHT, window.innerHeight - MODAL_VIEWPORT_MARGIN);
  return {
    width: Math.min(maxW, Math.max(MODAL_MIN_WIDTH, Math.round(width))),
    height: Math.min(maxH, Math.max(MODAL_MIN_HEIGHT, Math.round(height))),
  };
}

function loadSavedModalSize(): ModalSize | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(MODEL_LOADER_MODAL_SIZE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { width?: unknown; height?: unknown };
    if (typeof parsed.width !== "number" || typeof parsed.height !== "number") {
      return null;
    }
    if (!Number.isFinite(parsed.width) || !Number.isFinite(parsed.height)) {
      return null;
    }
    return clampModalSize(parsed.width, parsed.height);
  } catch {
    return null;
  }
}

function loadInitialModalSize(): ModalSize {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900 };
  }
  const saved = loadSavedModalSize();
  if (saved) return saved;
  const def = getDefaultModalSize();
  return clampModalSize(def.width, def.height);
}

function persistModalSize(size: ModalSize): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(
      MODEL_LOADER_MODAL_SIZE_KEY,
      JSON.stringify({ width: size.width, height: size.height }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export interface ModelLoaderDashboardProps {
  open: boolean;
  onClose: () => void;
  /** Called after the loader closes; use to open Model Catalog (e.g. set catalog open). */
  onOpenModelCatalog?: () => void;
}

function normalizePreviewUrl(value?: string, baseUrl?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (
    /^https?:\/\//i.test(trimmed) ||
    /^vscode-webview:\/\//i.test(trimmed) ||
    /^blob:/i.test(trimmed)
  ) {
    return trimmed;
  }
  if (
    trimmed.startsWith(DEV_SRC_ASSETS_PREFIX) ||
    trimmed.startsWith("../")
  ) {
    return projectRelativePathToDevUrl(trimmed);
  }
  if (
    trimmed.startsWith(TESAIOT_MODELS_WEB_PREFIX) ||
    trimmed.startsWith(FREE_MODELS_WEB_PREFIX)
  ) {
    return bridgeWebPathToCatalogModelUrl(trimmed);
  }
  if (trimmed.startsWith(TESAIOT_TEXTURES_WEB_PREFIX)) {
    return resolveTesaiotTexturesToFetchableUrl(trimmed);
  }
  if (baseUrl && !/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    try {
      return new URL(trimmed, baseUrl).toString();
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function readMetadataText(metadataJson: unknown, keys: string[]): string | undefined {
  if (!metadataJson || typeof metadataJson !== "object") {
    return undefined;
  }
  const record = metadataJson as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

function readAnimationsSummary(metadataJson: unknown): {
  hasAnimations?: string;
  clipCount?: string;
  clips?: string;
} {
  if (!metadataJson || typeof metadataJson !== "object") {
    return {};
  }
  const root = metadataJson as Record<string, unknown>;
  const animations =
    root.animations && typeof root.animations === "object"
      ? (root.animations as Record<string, unknown>)
      : null;
  if (!animations) {
    return {};
  }
  const hasAnimations =
    typeof animations.hasAnimations === "boolean"
      ? String(animations.hasAnimations)
      : undefined;
  const clipCount =
    typeof animations.clipCount === "number"
      ? String(animations.clipCount)
      : undefined;
  const clips = Array.isArray(animations.clips)
    ? animations.clips
        .map((clip) => {
          if (typeof clip === "string") return clip;
          if (clip && typeof clip === "object") {
            const c = clip as Record<string, unknown>;
            if (typeof c.name === "string") return c.name;
          }
          return null;
        })
        .filter((value): value is string => value !== null && value.trim() !== "")
        .join(", ") || undefined
    : undefined;
  return { hasAnimations, clipCount, clips };
}

export function ModelLoaderDashboard({
  open,
  onClose,
  onOpenModelCatalog,
}: ModelLoaderDashboardProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocalRowId, setSelectedLocalRowId] = useState<string | null>(null);
  const [authErrorDialog, setAuthErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    detail?: string;
  }>({ open: false, title: "", message: "" });
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const { fillViewport, toggleFillParent, exitFillParent } =
    useModalFullscreenFill(open);
  const [modalSize, setModalSize] = useState<ModalSize>(() => loadInitialModalSize());
  const modalShellRef = useRef<HTMLDivElement | null>(null);
  const [resizeHandleVisible, setResizeHandleVisible] = useState(false);
  const [isModalResizing, setIsModalResizing] = useState(false);
  const controller = useModelLoaderController(open);
  const downloads = useModelLoaderDownloads(controller.runtime);

  const shouldShowBridgeEmptyState =
    open &&
    !controller.runtime.status.isExtension &&
    (controller.runtime.status.connectionState === "disconnected" ||
      controller.runtime.status.connectionState === "error");

  const btnBase =
    "inline-flex items-center gap-1.5 border border-gray-400/35 bg-slate-700/30 backdrop-blur-md px-2.5 py-1 text-[11px] text-white shadow-sm shadow-black/20 hover:bg-slate-600/35";

  const hasSelection = !!controller.selectedProductId.trim();
  const hasResults = controller.results.data.length > 0;
  const categoryOptions = useMemo(() => {
    const values = new Set<string>();
    for (const row of controller.results.data) {
      const category = row.category?.trim();
      if (category) values.add(category);
    }
    for (const row of controller.localModels) {
      const category = row.category?.trim();
      if (category) values.add(category);
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [controller.localModels, controller.results.data]);

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredOnlineRows = useMemo(() => {
    return controller.results.data.filter((row) => {
      const matchesCategory =
        selectedCategory === "all" ? true : row.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!normalizedSearch) return true;
      return (
        row.name.toLowerCase().includes(normalizedSearch) ||
        row.productId.toLowerCase().includes(normalizedSearch) ||
        row.category.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [controller.results.data, normalizedSearch, selectedCategory]);

  const filteredLocalRows = useMemo(() => {
    return controller.localModels.filter((row) => {
      const rowCategory = row.category || "Uncategorized";
      const matchesCategory =
        selectedCategory === "all" ? true : rowCategory === selectedCategory;
      if (!matchesCategory) return false;
      if (!normalizedSearch) return true;
      return (
        row.name.toLowerCase().includes(normalizedSearch) ||
        row.productId.toLowerCase().includes(normalizedSearch) ||
        rowCategory.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [controller.localModels, normalizedSearch, selectedCategory]);

  const selectedLocalRow = useMemo(() => {
    if (filteredLocalRows.length === 0) return null;
    if (selectedLocalRowId && filteredLocalRows.some((row) => row.id === selectedLocalRowId)) {
      return filteredLocalRows.find((row) => row.id === selectedLocalRowId) ?? null;
    }
    return filteredLocalRows[0] ?? null;
  }, [filteredLocalRows, selectedLocalRowId]);

  const selectedDetails: ModelLoaderDetailsSelection | null = useMemo(() => {
    if (!selectedLocalRow) {
      return null;
    }
    const animations = readAnimationsSummary(selectedLocalRow.metadataJson);
    return {
      source: "local",
      id: selectedLocalRow.id,
      productId: selectedLocalRow.productId || "-",
      name: selectedLocalRow.name || selectedLocalRow.productId || "-",
      category: selectedLocalRow.category || "Uncategorized",
      fileType: selectedLocalRow.fileType,
      sizeBytes: selectedLocalRow.sizeBytes,
      updatedAtMs: selectedLocalRow.updatedAtMs,
      createdAt: readMetadataText(selectedLocalRow.metadataJson, ["created_at", "createdAt"]),
      updatedAt: readMetadataText(selectedLocalRow.metadataJson, ["updated_at", "updatedAt"]),
      description: readMetadataText(selectedLocalRow.metadataJson, ["description"]),
      metadataJson: selectedLocalRow.metadataJson,
      thumbnailUrl: normalizePreviewUrl(
        selectedLocalRow.thumbnailUrl,
        controller.config.baseUrl
      ),
      modelUrl: normalizePreviewUrl(
        selectedLocalRow.modelUrl,
        controller.config.baseUrl
      ),
      hasAnimations: animations.hasAnimations,
      clipCount: animations.clipCount,
      clips: animations.clips,
    };
  }, [
    selectedLocalRow,
    controller.config.baseUrl,
  ]);

  useEffect(() => {
    if (filteredLocalRows.length === 0) {
      setSelectedLocalRowId(null);
      return;
    }
    if (selectedLocalRowId && filteredLocalRows.some((row) => row.id === selectedLocalRowId)) {
      return;
    }
    setSelectedLocalRowId(filteredLocalRows[0]?.id ?? null);
  }, [filteredLocalRows, selectedLocalRowId]);

  const activeProgressPercentRaw =
    controller.currentJobState?.progress?.percent ??
    controller.runtime.downloadProgressPercent;
  const activeProgressPercent = useDeferredValue(activeProgressPercentRaw);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const updateViewport = () => {
      setModalSize((prev) => clampModalSize(prev.width, prev.height));
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (credentialsModalOpen) {
        setCredentialsModalOpen(false);
        return;
      }
      if (headerMenuOpen) {
        setHeaderMenuOpen(false);
        return;
      }
      if (fillViewport) {
        exitFillParent();
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, headerMenuOpen, credentialsModalOpen, fillViewport, exitFillParent, onClose]);

  const handleSaveConfig = useCallback(async () => {
    const trimmedKey = controller.config.apiKey.trim();
    await controller.saveConfig();
    setNotice("Config saved.");
    if (trimmedKey && controller.runtime.status.isExtension) {
      controller.setConfig((prev) => ({
        ...prev,
        apiKey: "",
        hasStoredApiKey: true,
      }));
    }
  }, [controller]);

  const handleRevealDownloadLocation = useCallback(
    async (absolutePath: string) => {
      try {
        await controller.runtime.revealFolder(absolutePath);
        if (!controller.runtime.status.isExtension) {
          setNotice("Path copied to clipboard.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setNotice(`Could not open folder: ${message}`);
      }
    },
    [controller.runtime]
  );

  useEffect(() => {
    if (!open) {
      setAuthErrorDialog({ open: false, title: "", message: "" });
      setHeaderMenuOpen(false);
      setCredentialsModalOpen(false);
      return;
    }
    const err = controller.runtime.error;
    if (!err || !isLikelyInvalidApiKeyError(err)) {
      return;
    }
    const copy = getInvalidApiKeyDialogCopy(err);
    setAuthErrorDialog({
      open: true,
      title: copy.title,
      message: copy.body,
      detail: copy.detail,
    });
    controller.runtime.clearError();
  }, [open, controller.runtime.error]);

  const loaderMenuItems: IconMenuItem[] = useMemo(
    () => [
      {
        id: "model-catalog",
        label: "Model Catalog",
        icon: <Package className="h-3.5 w-3.5 shrink-0" />,
        onSelect: () => {
          onClose();
          onOpenModelCatalog?.();
        },
        title: "Open Model Catalog",
      },
      {
        id: "credentials",
        label: "Credentials",
        icon: <Key className="h-3.5 w-3.5 shrink-0" />,
        onSelect: () => setCredentialsModalOpen(true),
        title: "Model Store credentials",
      },
      {
        id: "full-screen",
        label: fillViewport ? "Exit full screen" : "Full screen",
        icon: <Maximize2 className="h-3.5 w-3.5 shrink-0" />,
        onSelect: () => {
          toggleFillParent();
        },
        title: fillViewport
          ? "Restore Model Loader to its default size"
          : "Expand Model Loader to fill the webview",
      },
      {
        id: "close",
        label: "Close",
        icon: <X className="h-3.5 w-3.5 shrink-0" />,
        onSelect: onClose,
        title: "Close model loader",
      },
    ],
    [onClose, onOpenModelCatalog, fillViewport, toggleFillParent],
  );

  const updateResizeHandleProximity = useCallback((clientX: number, clientY: number) => {
    const el = modalShellRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const near =
      clientX >= rect.right - RESIZE_CORNER_PROXIMITY_PX &&
      clientX <= rect.right &&
      clientY >= rect.bottom - RESIZE_CORNER_PROXIMITY_PX &&
      clientY <= rect.bottom;
    setResizeHandleVisible(near);
  }, []);

  const onModalShellPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isModalResizing) return;
      updateResizeHandleProximity(e.clientX, e.clientY);
    },
    [isModalResizing, updateResizeHandleProximity],
  );

  const onModalShellPointerLeave = useCallback(() => {
    if (!isModalResizing) {
      setResizeHandleVisible(false);
    }
  }, [isModalResizing]);

  const onModalResizePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalResizing(true);
    const target = e.currentTarget;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = modalSize.width;
    const startH = modalSize.height;

    let lastSize: ModalSize = { width: startW, height: startH };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const next = clampModalSize(startW + dx, startH + dy);
      lastSize = next;
      setModalSize(next);
    };

    const endDrag = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      target.releasePointerCapture(e.pointerId);
      persistModalSize(clampModalSize(lastSize.width, lastSize.height));
      setIsModalResizing(false);
      updateResizeHandleProximity(ev.clientX, ev.clientY);
    };

    target.setPointerCapture(e.pointerId);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  if (!open) return null;

  return (
    <>
    <div
      className={
        fillViewport
          ? "t3d-shell-overlay fixed inset-0 z-50 flex min-h-0 w-full flex-col bg-black/65 p-0 backdrop-blur-sm"
          : "t3d-shell-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      }
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        onClose();
      }}
    >
      <div
        ref={modalShellRef}
        className={
          fillViewport
            ? "relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-visible"
            : "relative flex min-h-0 shrink-0 flex-col overflow-visible"
        }
        style={
          fillViewport
            ? { width: "100%", height: "100%", minHeight: 0 }
            : { width: modalSize.width, height: modalSize.height }
        }
        onPointerMove={onModalShellPointerMove}
        onPointerLeave={onModalShellPointerLeave}
      >
        <Card
          title={
            <>
              <Download
                className="h-5 w-5 shrink-0 text-gray-200"
                aria-hidden
              />
              <span>Model Loader</span>
            </>
          }
          headerActions={
            <IconMenu
              open={headerMenuOpen}
              onOpenChange={setHeaderMenuOpen}
              triggerIcon={<Menu className="h-5 w-5 shrink-0" />}
              triggerTitle="Model Loader menu"
              containerClassName="relative z-40"
              items={loaderMenuItems}
            />
          }
          headerClassName="py-[8px] border-b border-white/10 relative z-30 overflow-visible"
          className={
            fillViewport
              ? "flex h-full min-h-0 flex-col overflow-visible rounded-none border-0 bg-neutral-950/55 backdrop-blur-2xl shadow-none ring-0"
              : "border border-white/12 bg-neutral-950/55 backdrop-blur-2xl shadow-2xl shadow-black/50 ring-1 ring-white/6 h-full flex flex-col min-h-0 overflow-visible"
          }
          contentClassName="p-0 flex-1 min-h-0 flex flex-col overflow-hidden relative z-10"
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-cyan-300/8 ${
              fillViewport ? "rounded-none" : "rounded-md"
            }`}
          />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden py-[4px] pl-[4px] pr-0">
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-dark-small py-[4px] pl-[4px] pr-0">
              <div className="space-y-3 opacity-100 transition-opacity duration-300">
                {shouldShowBridgeEmptyState ? (
                  <div className="pr-[4px]">
                    <BridgeRequiredEmptyState
                      title="Model Loader needs the Model Downloader bridge in browser mode"
                      details="Start the bridge to search/download models and to list local downloads from a standalone browser."
                      wsUrl={getModelLoaderWsClientUrl()}
                      commands={[
                        "npm run dev:model-loader-browser",
                        "npm run dev:with-model-loader",
                      ]}
                      extensionHint={`With the TERNION extension installed and loaded, the model broker on ${getModelLoaderWsClientUrl()} should start automatically. Reload this page after a few seconds, or run the dev commands above if you are not using the packaged extension.`}
                    />
                  </div>
                ) : null}
                <ModelLoaderResultsTable
                  outputDir={downloads.outputDir}
                  defaultRootHint={controller.runtime.status.defaultOutputDir}
                  supportsFolderPicker={controller.runtime.status.supportsFolderPicker}
                  lastDownloadOutputDir={controller.lastDownloadResult?.outputDir ?? null}
                  onPickFolder={() => void downloads.pickFolder()}
                  onRevealPath={handleRevealDownloadLocation}
                  rows={filteredOnlineRows}
                  selectedProductId={controller.selectedProductId}
                  onSelect={controller.setSelectedProductId}
                  hasSelection={hasSelection}
                  hasResults={hasResults}
                  loading={controller.runtime.loading}
                  activeProgressPercent={activeProgressPercent}
                  currentJobState={controller.currentJobState}
                  runtimeError={controller.runtime.error}
                  notice={notice}
                  downloadNote={downloads.downloadNote}
                  buttonClassName={btnBase}
                  onSelectedProductIdChange={controller.setSelectedProductId}
                  includeSourceZip={controller.includeSourceZip}
                  onIncludeSourceZipChange={controller.setIncludeSourceZip}
                  onGetInfo={() => void controller.getModelInfo()}
                  onDownload={() =>
                    void controller
                      .downloadModel(downloads.outputDir, controller.includeSourceZip)
                      .then(() => {
                        setNotice("Download completed.");
                        window.dispatchEvent(
                          new Event(MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT)
                        );
                      })
                  }
                  onDownloadAll={() =>
                    void controller
                      .downloadAllModels(downloads.outputDir, controller.includeSourceZip)
                      .then((summary) => {
                        setNotice(
                          `Download all finished: ${summary.succeeded}/${summary.total} succeeded${
                            summary.failed > 0 ? `, ${summary.failed} failed` : ""
                          }.`
                        );
                        window.dispatchEvent(
                          new Event(MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT)
                        );
                      })
                  }
                  onDownloadInfoJson={() =>
                    void controller.downloadModelInfoJson(downloads.outputDir).then(() => {
                      setNotice("Model info JSON downloaded.");
                      window.dispatchEvent(
                        new Event(MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT)
                      );
                    })
                  }
                  onCancel={() => void controller.cancelDownload()}
                  onRefreshLoadedModels={() => void controller.refreshLocalModels()}
                  config={controller.config}
                  onChange={controller.setConfig}
                  onSave={handleSaveConfig}
                  isExtension={controller.runtime.status.isExtension}
                  page={controller.page}
                  limit={controller.limit}
                  searchText={searchText}
                  selectedCategory={selectedCategory}
                  categoryOptions={categoryOptions}
                  onPageChange={controller.setPage}
                  onLimitChange={controller.setLimit}
                  onSearchTextChange={setSearchText}
                  onSelectedCategoryChange={setSelectedCategory}
                  onListModels={() => void controller.listModels()}
                  selectedModelInfo={controller.selectedModelInfo}
                  lastDownloadResult={controller.lastDownloadResult}
                  jobHistory={controller.jobHistory}
                  jobEvents={controller.jobEvents}
                  onClearJobHistory={controller.clearJobHistory}
                  onRetryJob={(jobId) => void controller.retryJob(jobId)}
                />
                <ModelLoaderLocalModelsTable
                  rows={filteredLocalRows}
                  loading={controller.localModelsLoading}
                  error={controller.localModelsError}
                  selectedRowId={selectedLocalRowId}
                  onSelectRowId={setSelectedLocalRowId}
                  belowTable={
                    <ModelLoaderModelDetailsCard selected={selectedDetails} />
                  }
                />
              </div>
            </div>
          </div>
        </Card>
        {!fillViewport && (
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize Model Loader"
            title="Resize"
            className="absolute right-0 bottom-0 z-60 h-12 w-12 cursor-nwse-resize touch-none"
            onPointerDown={onModalResizePointerDown}
          >
            <div
              className={`pointer-events-none absolute right-0 bottom-0 h-5 w-5 rounded-tl border-l border-t transition-opacity duration-150 ${
                resizeHandleVisible || isModalResizing
                  ? "border-white/20 bg-white/5 opacity-100"
                  : "opacity-0"
              }`}
              aria-hidden
            />
          </div>
        )}
      </div>
    </div>
    {credentialsModalOpen && (
      <div
        className="t3d-shell-overlay fixed inset-0 z-60 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="model-loader-credentials-title"
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget) return;
          setCredentialsModalOpen(false);
        }}
      >
        <div
          className="w-full max-w-md"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Card
            title={
              <>
                <Key
                  className="h-5 w-5 shrink-0 text-gray-200"
                  aria-hidden
                />
                <span id="model-loader-credentials-title">Model Store Credentials</span>
              </>
            }
            headerActions={
              <button
                type="button"
                className="inline-flex items-center justify-center rounded p-1 text-gray-400 hover:bg-white/10 hover:text-gray-100"
                onClick={() => setCredentialsModalOpen(false)}
                title="Close"
                aria-label="Close credentials"
              >
                <X className="h-5 w-5 shrink-0" />
              </button>
            }
            headerClassName="py-3 border-b border-white/10"
            className="border border-white/12 bg-neutral-950/90 backdrop-blur-2xl shadow-2xl shadow-black/50 ring-1 ring-white/6 text-gray-100"
            contentClassName="p-4"
          >
            <ModelLoaderConfigCard
              layout="plain"
              config={controller.config}
              onChange={controller.setConfig}
              onSave={async () => {
                await handleSaveConfig();
                setCredentialsModalOpen(false);
              }}
              loading={controller.runtime.loading}
              isExtension={controller.runtime.status.isExtension}
              buttonClassName={btnBase}
            />
          </Card>
        </div>
      </div>
    )}
    <AlertDialog
      open={authErrorDialog.open}
      title={authErrorDialog.title}
      message={authErrorDialog.message}
      detail={authErrorDialog.detail}
      confirmLabel="OK"
      onClose={() => setAuthErrorDialog({ open: false, title: "", message: "" })}
    />
    </>
  );
}
