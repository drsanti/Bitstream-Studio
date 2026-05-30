import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Box,
  Clipboard,
  Download,
  File,
  FileJson,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Menu,
  RefreshCw,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { IconMenu, type IconMenuItem } from "../ui/components/IconMenu";
import {
  SortableTable,
  type SortableTableColumn,
} from "../ui/components/SortableTable";
import { ModelLoaderGroupCard } from "../model-loader/components/ModelLoaderGroupCard";
import { useModalFullscreenFill } from "../ui/useModalFullscreenFill";
import { useFreeAssetsLoaderRuntime } from "./useFreeAssetsLoaderRuntime";
import type {
  FreeAssetIndexEntry,
  FreeLocalAssetEntry,
} from "../../model-downloader/protocol";
import { MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT } from "../model-catalog/modelCatalogEvents";
import { getModelLoaderWsClientUrl } from "../runtimeWsUrls";
import { BridgeRequiredEmptyState } from "../ui/components/BridgeRequiredEmptyState";
import {
  type FreeAssetKind,
  classifyFreeAssetKind,
  splitRelativeAssetPath,
} from "./freeAssetKind";
import {
  DEFAULT_LOCAL_SORT,
  DEFAULT_ONLINE_SORT,
  type LocalSortColumn,
  type OnlineSortColumn,
  sortLocalEntries,
  sortOnlineEntries,
  toggleColumnSort,
} from "./sortFreeAssetTable";

const MODAL_SIZE_KEY = "t3d.freeAssetsLoader.modalSize";
const MODAL_VIEWPORT_MARGIN = 32;
const MODAL_MIN_WIDTH = 480;
const MODAL_MIN_HEIGHT = 320;

type ModalSize = { width: number; height: number };

/** After download: show path + open/reveal; errors use tone `error`. */
type FreeAssetsToast = {
  message: string;
  savedTo?: string;
  tone?: "default" | "error";
};

function clampModalSize(width: number, height: number): ModalSize {
  if (typeof window === "undefined") {
    return {
      width: Math.max(MODAL_MIN_WIDTH, Math.round(width)),
      height: Math.max(MODAL_MIN_HEIGHT, Math.round(height)),
    };
  }
  const maxW = Math.max(
    MODAL_MIN_WIDTH,
    window.innerWidth - MODAL_VIEWPORT_MARGIN,
  );
  const maxH = Math.max(
    MODAL_MIN_HEIGHT,
    window.innerHeight - MODAL_VIEWPORT_MARGIN,
  );
  return {
    width: Math.min(maxW, Math.max(MODAL_MIN_WIDTH, Math.round(width))),
    height: Math.min(maxH, Math.max(MODAL_MIN_HEIGHT, Math.round(height))),
  };
}

function loadInitialModalSize(): ModalSize {
  if (typeof window === "undefined") {
    return { width: 1200, height: 800 };
  }
  try {
    const raw = localStorage.getItem(MODAL_SIZE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { width?: unknown; height?: unknown };
      if (
        typeof parsed.width === "number" &&
        typeof parsed.height === "number"
      ) {
        return clampModalSize(parsed.width, parsed.height);
      }
    }
  } catch {
    /* ignore */
  }
  return clampModalSize(window.innerWidth * 0.88, window.innerHeight * 0.88);
}

function persistModalSize(size: ModalSize): void {
  try {
    localStorage.setItem(MODAL_SIZE_KEY, JSON.stringify(size));
  } catch {
    /* ignore */
  }
}

function formatBytes(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatModified(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  try {
    return new Date(ms).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

const KIND_BADGE: Record<
  FreeAssetKind,
  { label: string; Icon: LucideIcon; className: string }
> = {
  model: {
    label: "Model",
    Icon: Box,
    className:
      "border border-emerald-400/35 bg-emerald-500/12 text-emerald-100/95 shadow-sm shadow-emerald-950/40",
  },
  texture: {
    label: "Texture",
    Icon: ImageIcon,
    className:
      "border border-violet-400/35 bg-violet-500/12 text-violet-100/95 shadow-sm shadow-violet-950/40",
  },
  data: {
    label: "Data",
    Icon: FileJson,
    className:
      "border border-sky-400/30 bg-sky-500/10 text-sky-100/90 shadow-sm shadow-sky-950/35",
  },
  other: {
    label: "File",
    Icon: File,
    className:
      "border border-zinc-500/35 bg-zinc-600/15 text-zinc-200/90 shadow-sm shadow-black/30",
  },
};

const ONLINE_ASSET_TABLE_COLUMNS: SortableTableColumn<OnlineSortColumn>[] = [
  {
    id: "select",
    label: "Select",
    sortable: false,
    srOnlyLabel: true,
    headerClassName: "w-10",
  },
  {
    id: "kind",
    label: "Kind",
    sortable: true,
    sortColumnId: "kind",
    headerClassName: "w-[112px]",
  },
  {
    id: "file",
    label: "File",
    sortable: true,
    sortColumnId: "file",
    headerClassName: "min-w-0",
  },
  {
    id: "size",
    label: "Size",
    sortable: true,
    sortColumnId: "size",
    align: "right",
    headerClassName: "w-[100px]",
  },
];

const LOCAL_ASSET_TABLE_COLUMNS: SortableTableColumn<LocalSortColumn>[] = [
  {
    id: "kind",
    label: "Kind",
    sortable: true,
    sortColumnId: "kind",
    headerClassName: "w-[112px]",
  },
  {
    id: "file",
    label: "File",
    sortable: true,
    sortColumnId: "file",
    headerClassName: "min-w-0",
  },
  {
    id: "size",
    label: "Size",
    sortable: true,
    sortColumnId: "size",
    align: "right",
    headerClassName: "w-[88px]",
  },
  {
    id: "modified",
    label: "Modified",
    sortable: true,
    sortColumnId: "modified",
    align: "right",
    headerClassName: "w-[120px]",
  },
];

export interface FreeAssetsLoaderDashboardProps {
  open: boolean;
  onClose: () => void;
}

export function FreeAssetsLoaderDashboard({
  open,
  onClose,
}: FreeAssetsLoaderDashboardProps) {
  const rt = useFreeAssetsLoaderRuntime(open);
  const [entries, setEntries] = useState<FreeAssetIndexEntry[]>([]);
  const [localEntries, setLocalEntries] = useState<FreeLocalAssetEntry[]>([]);
  const [localRootFs, setLocalRootFs] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [mainTab, setMainTab] = useState<"online" | "local">("online");
  const [onlineSort, setOnlineSort] = useState(() => DEFAULT_ONLINE_SORT);
  const [localSort, setLocalSort] = useState(() => DEFAULT_LOCAL_SORT);
  const [lastOutputRoot, setLastOutputRoot] = useState("");
  const [toast, setToast] = useState<FreeAssetsToast | null>(null);
  const toastClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const { fillViewport, toggleFillParent, exitFillParent } =
    useModalFullscreenFill(open);
  const [modalSize, setModalSize] = useState<ModalSize>(() =>
    loadInitialModalSize(),
  );
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    if (rt.freeGithubRootFs) {
      setLastOutputRoot((prev) => (prev.trim() ? prev : rt.freeGithubRootFs));
    }
  }, [open, rt.freeGithubRootFs]);

  useEffect(() => {
    return () => {
      if (toastClearRef.current) {
        clearTimeout(toastClearRef.current);
      }
    };
  }, []);

  const clearToastTimer = useCallback(() => {
    if (toastClearRef.current) {
      clearTimeout(toastClearRef.current);
      toastClearRef.current = null;
    }
  }, []);

  const scheduleToastClear = useCallback(
    (ms: number) => {
      clearToastTimer();
      toastClearRef.current = setTimeout(() => {
        setToast(null);
        toastClearRef.current = null;
      }, ms);
    },
    [clearToastTimer],
  );

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.relativePath.toLowerCase().includes(q) ||
        e.repoPath.toLowerCase().includes(q),
    );
  }, [entries, deferredSearch]);

  const filteredLocal = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return localEntries;
    return localEntries.filter((e) => e.relativePath.toLowerCase().includes(q));
  }, [localEntries, deferredSearch]);

  const sortedOnline = useMemo(
    () => sortOnlineEntries(filtered, onlineSort),
    [filtered, onlineSort],
  );

  const sortedLocal = useMemo(
    () => sortLocalEntries(filteredLocal, localSort),
    [filteredLocal, localSort],
  );

  const onOnlineSortClick = useCallback((columnId: OnlineSortColumn) => {
    setOnlineSort((prev) => toggleColumnSort(prev, columnId));
  }, []);

  const onLocalSortClick = useCallback((columnId: LocalSortColumn) => {
    setLocalSort((prev) => toggleColumnSort(prev, columnId));
  }, []);

  const fetchIndex = useCallback(async () => {
    try {
      const rows = await rt.listIndex();
      setEntries(rows);
      setSelected(new Set());
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const isRate =
        raw.includes("rate limit") ||
        raw.includes("403") ||
        raw.toLowerCase().includes("api rate limit exceeded");
      const friendly = isRate
        ? "GitHub API rate limit exceeded. Add a token: VS Code Settings → `ternion.githubToken` (read-only classic PAT is enough), or set the `GITHUB_TOKEN` environment variable for the extension host / bridge. Then click Refresh list again."
        : raw;
      setToast({ message: friendly, tone: "error" });
      scheduleToastClear(16_000);
    }
  }, [rt, scheduleToastClear]);

  const fetchLocalEntries = useCallback(async () => {
    try {
      const { entries: rows, rootFs } = await rt.listLocalFreeAssets();
      setLocalEntries(rows);
      if (rootFs?.trim()) {
        setLocalRootFs(rootFs.trim());
      }
    } catch {
      /* rt.error / optional toast */
    }
  }, [rt]);

  const toggleRow = useCallback((repoPath: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(repoPath)) next.delete(repoPath);
      else next.add(repoPath);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelected(new Set(filtered.map((e) => e.repoPath)));
  }, [filtered]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const revealOrCopyDirectory = useCallback(
    async (dir: string) => {
      const trimmed = dir.trim();
      if (!trimmed) {
        setToast({ message: "No folder path yet.", tone: "error" });
        scheduleToastClear(5000);
        return;
      }
      try {
        if (rt.isExtension) {
          await rt.revealFolder(trimmed);
        } else {
          await rt.copyPathToClipboard(trimmed);
          setToast({ message: "Path copied to clipboard" });
          scheduleToastClear(4000);
        }
      } catch (e) {
        setToast({
          message: e instanceof Error ? e.message : String(e),
          tone: "error",
        });
        scheduleToastClear(8000);
      }
    },
    [rt, scheduleToastClear],
  );

  const runDownload = useCallback(
    async (subset: string[] | undefined) => {
      try {
        const res = await rt.syncDownload(subset);
        const out = res.outputRootDir?.trim() ?? "";
        setLastOutputRoot(out);
        const errPart = res.errors.length
          ? ` (${res.errors.length} error(s))`
          : "";
        if (out) {
          setToast({
            message: `Downloaded ${res.downloaded} file(s)${errPart}. Files are saved here:`,
            savedTo: out,
          });
        } else {
          setToast({
            message: `Downloaded ${res.downloaded} file(s)${errPart}. Save location was not reported.`,
          });
        }
        window.dispatchEvent(
          new CustomEvent(MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT),
        );
        scheduleToastClear(out ? 15000 : 8000);
        void fetchLocalEntries();
      } catch (e) {
        console.error(e);
        setToast({
          message: e instanceof Error ? e.message : String(e),
          tone: "error",
        });
        scheduleToastClear(8000);
      }
    },
    [scheduleToastClear, rt, fetchLocalEntries],
  );

  const onOpenFolder = useCallback(async () => {
    const dir =
      rt.downloadFolderOverrideFs?.trim() ||
      lastOutputRoot ||
      rt.downloadRootFs;
    await revealOrCopyDirectory(dir);
  }, [
    lastOutputRoot,
    rt.downloadFolderOverrideFs,
    rt.downloadRootFs,
    revealOrCopyDirectory,
  ]);

  const onCopyPath = useCallback(async () => {
    const dir =
      rt.downloadFolderOverrideFs?.trim() ||
      lastOutputRoot ||
      rt.downloadRootFs;
    const trimmed = dir.trim();
    if (!trimmed) {
      setToast({ message: "No folder path yet.", tone: "error" });
      scheduleToastClear(5000);
      return;
    }
    try {
      await rt.copyPathToClipboard(trimmed);
      setToast({ message: "Path copied to clipboard" });
      scheduleToastClear(4000);
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : String(e),
        tone: "error",
      });
      scheduleToastClear(8000);
    }
  }, [
    lastOutputRoot,
    rt.downloadFolderOverrideFs,
    rt.downloadRootFs,
    rt.copyPathToClipboard,
    scheduleToastClear,
  ]);

  const freeLoaderMenuItems: IconMenuItem[] = useMemo(
    () => [
      {
        id: "full-screen",
        label: fillViewport ? "Exit full screen" : "Full screen",
        icon: <Maximize2 className="h-3.5 w-3.5 shrink-0" />,
        onSelect: () => {
          toggleFillParent();
        },
        title: fillViewport
          ? "Restore Free Loader to its default size"
          : "Expand Free Loader to fill the webview",
      },
      {
        id: "close",
        label: "Close",
        icon: <X className="h-3.5 w-3.5 shrink-0" />,
        onSelect: onClose,
        title: "Close Free Loader",
      },
    ],
    [fillViewport, onClose, toggleFillParent],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
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
  }, [open, headerMenuOpen, fillViewport, exitFillParent, onClose]);

  const onPointerDownResize = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const el = modalRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startW: r.width,
        startH: r.height,
      };
      const onMove = (ev: PointerEvent) => {
        const s = resizeRef.current;
        if (!s) return;
        const dw = ev.clientX - s.startX;
        const dh = ev.clientY - s.startY;
        setModalSize(clampModalSize(s.startW + dw, s.startH + dh));
      };
      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setModalSize((sz) => {
          persistModalSize(sz);
          return sz;
        });
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [],
  );

  if (!open) return null;

  const pathToShow =
    rt.downloadFolderOverrideFs?.trim() ||
    lastOutputRoot ||
    rt.freeGithubRootFs ||
    "(fetching path…)";

  const shouldShowBridgeEmptyState =
    !rt.isExtension &&
    (rt.bridge.connectionState === "disconnected" ||
      rt.bridge.connectionState === "error");

  return (
    <div
      className={
        fillViewport
          ? "t3d-shell-overlay fixed inset-0 z-200 flex min-h-0 w-full flex-col bg-black/50 p-0 backdrop-blur-sm"
          : "t3d-shell-overlay fixed inset-0 z-200 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-assets-loader-title"
    >
      <div
        ref={modalRef}
        className={
          fillViewport
            ? "relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden border-0 bg-[#0f1419] shadow-none"
            : "relative flex max-h-[min(92vh,920px)] min-h-[320px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f1419] shadow-xl"
        }
        style={
          fillViewport
            ? { width: "100%", height: "100%", minHeight: 0 }
            : { width: modalSize.width, height: modalSize.height }
        }
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-sky-400" aria-hidden />
            <h2
              id="free-assets-loader-title"
              className="text-lg font-semibold text-white"
            >
              Free Loader
            </h2>
            {!rt.isExtension && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                Bridge: {rt.bridge.connectionState}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <IconMenu
              open={headerMenuOpen}
              onOpenChange={setHeaderMenuOpen}
              triggerIcon={<Menu className="h-5 w-5 shrink-0 text-zinc-300" />}
              triggerTitle="Free Loader menu"
              containerClassName="relative z-40"
              items={freeLoaderMenuItems}
            />
            <button
              type="button"
              className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <div className="shrink-0 space-y-2 border-b border-white/10 px-4 py-2">
            {shouldShowBridgeEmptyState ? (
              <BridgeRequiredEmptyState
                title="Free Loader needs the bridge in browser mode"
                details="Start the bridge to list local assets and sync downloads from a standalone browser."
                wsUrl={getModelLoaderWsClientUrl()}
                commands={[
                  "npm run dev:model-loader-browser",
                  "npm run dev:with-model-loader",
                ]}
                extensionHint={`With the TERNION extension installed and loaded, the model broker on ${getModelLoaderWsClientUrl()} should start automatically. Reload this page after a few seconds, or run the dev commands above if you are not using the packaged extension.`}
              />
            ) : null}
            <div
              className="flex rounded-lg border border-white/10 bg-black/25 p-1"
              role="tablist"
              aria-label="Asset views"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mainTab === "online"}
                className={`min-h-10 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mainTab === "online"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
                onClick={() => setMainTab("online")}
              >
                Online Assets
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mainTab === "local"}
                className={`min-h-10 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mainTab === "local"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
                onClick={() => setMainTab("local")}
              >
                Local Assets
              </button>
            </div>
            <div className="relative w-full min-w-0">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                className="w-full rounded-md border border-white/10 bg-black/30 py-1.5 pl-8 pr-2 text-sm text-white placeholder:text-zinc-600"
                placeholder={
                  mainTab === "online"
                    ? "Filter GitHub paths…"
                    : "Filter local paths…"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={
                  mainTab === "online"
                    ? "Filter online paths"
                    : "Filter local paths"
                }
              />
            </div>
          </div>

          {rt.progress && rt.progress.phase !== "done" && (
            <div className="shrink-0 border-b border-white/10 px-4 py-2 text-sm text-zinc-300">
              {rt.progress.phase === "listing" && "Listing…"}
              {rt.progress.phase === "downloading" && (
                <>
                  Downloading {rt.progress.fileIndex ?? 0}/
                  {rt.progress.totalFiles ?? "?"} —{" "}
                  {rt.progress.currentPath ?? ""}
                </>
              )}
              <span className="ml-2 text-sky-400">
                {Math.round(rt.progress.percent)}%
              </span>
            </div>
          )}

          {toast && (
            <div
              className={`shrink-0 border-b px-4 py-3 text-sm ${
                toast.tone === "error"
                  ? "border-red-500/35 bg-red-500/10 text-red-100"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-50"
              }`}
              role="status"
            >
              <p>{toast.message}</p>
              {toast.savedTo ? (
                <div className="mt-2 space-y-2">
                  <p
                    className="break-all font-mono text-xs text-zinc-200"
                    title={toast.savedTo}
                  >
                    {toast.savedTo}
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500"
                    onClick={() =>
                      void revealOrCopyDirectory(toast.savedTo ?? "")
                    }
                  >
                    {rt.isExtension ? (
                      <FolderOpen className="h-4 w-4" aria-hidden />
                    ) : (
                      <Clipboard className="h-4 w-4" aria-hidden />
                    )}
                    {rt.isExtension
                      ? "Open in File Explorer"
                      : "Copy folder path"}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-2 pt-2">
            {mainTab === "online" && (
              <>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15"
                    onClick={() => void fetchIndex()}
                    disabled={rt.listLoading || rt.busy}
                  >
                    {rt.listLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh list
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
                    onClick={() => void runDownload(undefined)}
                    disabled={rt.busy || entries.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Download all
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
                    onClick={() => void runDownload(Array.from(selected))}
                    disabled={
                      rt.busy || entries.length === 0 || selected.size === 0
                    }
                  >
                    Download selected
                  </button>
                  <button
                    type="button"
                    className="text-sm text-sky-300 hover:underline"
                    onClick={selectAllFiltered}
                  >
                    Select all (filtered)
                  </button>
                  <button
                    type="button"
                    className="text-sm text-zinc-400 hover:underline"
                    onClick={clearSelection}
                  >
                    Clear
                  </button>
                </div>
                <div
                  className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/[0.07] bg-linear-to-b from-black/35 to-black/20 shadow-inner shadow-black/40"
                  role="tabpanel"
                  aria-label="Online Assets"
                >
                  <div className="max-h-[min(58vh,580px)] min-h-[200px] overflow-auto scrollbar-dark-small">
                    {entries.length === 0 && !rt.listLoading ? (
                      <div className="flex min-h-[min(36vh,280px)] flex-col items-center justify-center gap-3 px-4 py-10 text-center text-zinc-400">
                        <p>
                          No index loaded yet. Use Refresh to fetch the GitHub
                          file tree.
                        </p>
                        <button
                          type="button"
                          className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-500"
                          onClick={() => void fetchIndex()}
                        >
                          Fetch list
                        </button>
                      </div>
                    ) : (
                      <SortableTable<OnlineSortColumn>
                        caption="Free pack files from GitHub; kinds include 3D models and textures"
                        columns={ONLINE_ASSET_TABLE_COLUMNS}
                        sort={onlineSort}
                        onSortClick={onOnlineSortClick}
                      >
                        <tbody className="text-sm text-zinc-200">
                          {sortedOnline.map((row, idx) => {
                            const kind = classifyFreeAssetKind(
                              row.relativePath,
                            );
                            const { parent, fileName } = splitRelativeAssetPath(
                              row.relativePath,
                            );
                            const badge = KIND_BADGE[kind];
                            const KindIcon = badge.Icon;
                            return (
                              <tr
                                key={row.repoPath}
                                className={`border-b border-white/4 transition-colors hover:bg-white/4 ${
                                  idx % 2 === 0
                                    ? "bg-white/1.5"
                                    : "bg-transparent"
                                }`}
                              >
                                <td className="align-middle px-2 py-2 pl-3">
                                  <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 rounded border-white/25 bg-black/40 text-sky-500 focus:ring-1 focus:ring-sky-500/50"
                                    checked={selected.has(row.repoPath)}
                                    onChange={() => toggleRow(row.repoPath)}
                                    aria-label={`Select ${row.relativePath}`}
                                  />
                                </td>
                                <td className="align-middle px-2 py-2">
                                  <span
                                    className={`inline-flex max-w-22 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide ${badge.className}`}
                                    title={kind}
                                  >
                                    <KindIcon
                                      className="h-3 w-3 shrink-0 opacity-90"
                                      aria-hidden
                                    />
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="min-w-0 max-w-0 align-middle px-2 py-2">
                                  <div className="min-w-0">
                                    <div
                                      className="truncate font-mono text-[13px] font-medium leading-snug text-zinc-100"
                                      title={row.relativePath}
                                    >
                                      {fileName}
                                    </div>
                                    {parent ? (
                                      <div
                                        className="truncate font-mono text-[11px] leading-snug text-zinc-500"
                                        title={parent}
                                      >
                                        {parent}
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right align-middle font-mono text-xs tabular-nums text-zinc-400">
                                  {formatBytes(row.sizeBytes)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </SortableTable>
                    )}
                  </div>
                </div>
              </>
            )}

            {mainTab === "local" && (
              <div
                className="flex min-h-0 flex-1 flex-col gap-2"
                role="tabpanel"
                aria-label="Local Assets"
              >
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Files on disk under the Free pack folder (same tree as sync
                  target). Use the search field above to filter.
                </p>
                {localRootFs ? (
                  <p
                    className="break-all font-mono text-[11px] text-zinc-400"
                    title={localRootFs}
                  >
                    {localRootFs}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15 disabled:opacity-50"
                    onClick={() => void fetchLocalEntries()}
                    disabled={rt.localListLoading}
                  >
                    {rt.localListLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="h-4 w-4" aria-hidden />
                    )}
                    Refresh local
                  </button>
                  {localRootFs && rt.isExtension ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500"
                      onClick={() => void revealOrCopyDirectory(localRootFs)}
                    >
                      <FolderOpen className="h-4 w-4" aria-hidden />
                      Open folder
                    </button>
                  ) : null}
                  {localRootFs && !rt.isExtension ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500"
                      onClick={() => void revealOrCopyDirectory(localRootFs)}
                    >
                      <Clipboard className="h-4 w-4" aria-hidden />
                      Copy root path
                    </button>
                  ) : null}
                </div>
                <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-linear-to-b from-black/35 to-black/20 shadow-inner shadow-black/40">
                  <div className="max-h-[min(42vh,480px)] min-h-[120px] overflow-auto scrollbar-dark-small">
                    {rt.localListLoading && localEntries.length === 0 ? (
                      <div className="flex min-h-[120px] items-center justify-center gap-2 text-sm text-zinc-500">
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        Scanning local files…
                      </div>
                    ) : filteredLocal.length === 0 ? (
                      <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 px-4 py-8 text-center text-sm text-zinc-500">
                        <p>
                          No local files yet, or none match the filter. Open the
                          Online Assets tab to sync, or use Refresh local.
                        </p>
                      </div>
                    ) : (
                      <SortableTable<LocalSortColumn>
                        caption="Local Free pack files on disk"
                        columns={LOCAL_ASSET_TABLE_COLUMNS}
                        sort={localSort}
                        onSortClick={onLocalSortClick}
                      >
                        <tbody className="text-sm text-zinc-200">
                          {sortedLocal.map((row, idx) => {
                            const kind = classifyFreeAssetKind(
                              row.relativePath,
                            );
                            const { parent, fileName } = splitRelativeAssetPath(
                              row.relativePath,
                            );
                            const badge = KIND_BADGE[kind];
                            const KindIcon = badge.Icon;
                            return (
                              <tr
                                key={row.relativePath}
                                className={`border-b border-white/4 transition-colors hover:bg-white/4 ${
                                  idx % 2 === 0
                                    ? "bg-white/1.5"
                                    : "bg-transparent"
                                }`}
                              >
                                <td className="align-middle px-2 py-2 pl-3">
                                  <span
                                    className={`inline-flex max-w-22 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide ${badge.className}`}
                                  >
                                    <KindIcon
                                      className="h-3 w-3 shrink-0 opacity-90"
                                      aria-hidden
                                    />
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="min-w-0 max-w-0 align-middle px-2 py-2">
                                  <div className="min-w-0">
                                    <div
                                      className="truncate font-mono text-[13px] font-medium leading-snug text-zinc-100"
                                      title={row.relativePath}
                                    >
                                      {fileName}
                                    </div>
                                    {parent ? (
                                      <div
                                        className="truncate font-mono text-[11px] leading-snug text-zinc-500"
                                        title={parent}
                                      >
                                        {parent}
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-2 py-2 text-right align-middle font-mono text-xs tabular-nums text-zinc-400">
                                  {formatBytes(row.sizeBytes)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right align-middle font-mono text-[11px] tabular-nums text-zinc-500">
                                  {formatModified(row.modifiedAtMs)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </SortableTable>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-white/10 px-4 py-3">
            <ModelLoaderGroupCard title="Download location" defaultOpen={false}>
              <div
                className="break-all font-mono text-xs text-zinc-200"
                title={pathToShow}
              >
                {pathToShow}
              </div>
              {rt.isExtension ? (
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  This path is your per-user extension storage (global storage).
                  It is not inside the extension install or your source repo.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-amber-100/85">
                  <span className="font-medium text-amber-200/95">
                    Development (browser + bridge).
                  </span>{" "}
                  Syncs use the same per-user folder as the VS Code extension
                  (<code className="rounded bg-black/40 px-1 text-zinc-300">
                    globalStorage/…/terniondev.bitstream-studio/assets/free
                  </code>
                  ), not the monorepo{" "}
                  <code className="rounded bg-black/40 px-1 text-zinc-300">
                    ternion-t3d/assets/free
                  </code>{" "}
                  tree unless you set{" "}
                  <code className="rounded bg-black/40 px-1 text-zinc-300">
                    TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR
                  </code>
                  .
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {rt.supportsFolderPicker ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-zinc-200 hover:bg-white/10"
                    onClick={() => void rt.pickDownloadFolder()}
                  >
                    Choose folder…
                  </button>
                ) : null}
                {rt.downloadFolderOverrideFs ? (
                  <button
                    type="button"
                    className="text-sm text-sky-300 hover:underline"
                    onClick={() => rt.clearDownloadFolderOverride()}
                  >
                    Use default folder
                  </button>
                ) : null}
                {rt.isExtension ? (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500"
                      onClick={() => void onOpenFolder()}
                    >
                      <FolderOpen className="h-4 w-4" aria-hidden />
                      Open folder
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15"
                      onClick={() => void onCopyPath()}
                    >
                      <Clipboard className="h-4 w-4" aria-hidden />
                      Copy path
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500"
                    onClick={() => void onOpenFolder()}
                  >
                    <Clipboard className="h-4 w-4" aria-hidden />
                    Copy path
                  </button>
                )}
              </div>
            </ModelLoaderGroupCard>
          </div>
        </div>

        {!fillViewport && (
          <div
            className="absolute bottom-0 right-0 h-12 w-12 cursor-nwse-resize"
            onPointerDown={onPointerDownResize}
            style={{
              background:
                "linear-gradient(135deg, transparent 50%, rgba(148,163,184,0.25) 50%)",
            }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
