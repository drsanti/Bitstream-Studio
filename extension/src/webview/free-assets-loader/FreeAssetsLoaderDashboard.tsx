import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Clipboard,
  Download,
  FolderOpen,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  SortableTable,
  type SortableTableColumn,
} from "../ui/components/SortableTable";
import { TRNButton } from "../ui/TRN/TRNButton.js";
import { TRNHintText } from "../ui/TRN/TRNHintText.js";
import { TRNWindow, type TRNWindowRect } from "../ui/TRN/TRNWindow.js";
import { FreeAssetKindBadge } from "./FreeAssetKindBadge.js";
import { FreeAssetsLoaderHeaderActions } from "./FreeAssetsLoaderHeader.js";
import { FreeAssetsLoaderSaveFolderFooter } from "./FreeAssetsLoaderSaveFolderFooter.js";
import {
  computeInitialFreeAssetsLoaderRect,
  FREE_ASSETS_LOADER_WINDOW_STORAGE_KEY,
  LOADER_MODAL_SEARCH_INPUT_CLASS,
  LOADER_MODAL_TABLE_FRAME_CLASS,
} from "./loader-modal-chrome.js";
import { scheduleWebviewReloadAfterAssetSync } from "../asset-bootstrap/requestWebviewReloadAfterAssetSync";
import {
  ternionFreeAssetPackCopy,
  TERNION_FREE_ASSET_PACK_NAME,
} from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { useFreeAssetsLoaderRuntime } from "./useFreeAssetsLoaderRuntime";
import type {
  FreeAssetIndexEntry,
  FreeLocalAssetEntry,
} from "../../model-downloader/protocol";
import { MODEL_CATALOG_REFRESH_DOWNLOADED_EVENT } from "../model-catalog/modelCatalogEvents";
import { getModelLoaderWsClientUrl } from "../runtimeWsUrls";
import { FreeAssetsLoaderBridgeDevFooter } from "./FreeAssetsLoaderBridgeDevFooter.js";
import {
  classifyFreeAssetsCatalogFetchError,
  FreeAssetsLoaderCatalogIssuePanel,
  type FreeAssetsLoaderCatalogIssue,
} from "./FreeAssetsLoaderCatalogIssuePanel.js";
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

/** After download: show path + open/reveal; errors use tone `error`. */
type FreeAssetsToast = {
  message: string;
  savedTo?: string;
  tone?: "default" | "error";
};

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
  const [catalogIssue, setCatalogIssue] = useState<FreeAssetsLoaderCatalogIssue | null>(
    null,
  );
  const toastClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [initialRect, setInitialRect] = useState<Partial<TRNWindowRect>>(() =>
    computeInitialFreeAssetsLoaderRect(),
  );

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    setInitialRect(computeInitialFreeAssetsLoaderRect());
  }, [open]);

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
    setCatalogIssue(null);
    try {
      const rows = await rt.listIndex();
      setEntries(rows);
      setSelected(new Set());
      setCatalogIssue(null);
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setCatalogIssue(classifyFreeAssetsCatalogFetchError(raw));
      setMainTab("online");
    }
  }, [rt]);

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

  const bridgeReady =
    rt.isExtension || rt.bridge.connectionState === "connected";

  useEffect(() => {
    if (!open || !bridgeReady) {
      return;
    }
    void fetchIndex();
    void fetchLocalEntries();
  }, [open, bridgeReady, fetchIndex, fetchLocalEntries]);

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
        if (res.errors.length === 0) {
          scheduleWebviewReloadAfterAssetSync(1200);
        }
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
    <TRNWindow
      open={open}
      onClose={onClose}
      title={TERNION_FREE_ASSET_PACK_NAME}
      prefixIcon={<Download className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      headerActions={
        <FreeAssetsLoaderHeaderActions
          isExtension={rt.isExtension}
          connectionState={rt.bridge.connectionState}
          onlineCount={entries.length}
          localCount={localEntries.length}
          selectedCount={selected.size}
          listLoading={rt.listLoading}
        />
      }
      initialRect={initialRect}
      minWidth={480}
      minHeight={320}
      modal
      modalBackdropCloses
      zIndex={220}
      heightMode="fixed"
      reopenStrategy="normalize"
      resizable
      resizeEdges="all"
      showFooter={false}
      showMaximize
      glass
      glassPreset="medium"
      persistRectStorageKey={FREE_ASSETS_LOADER_WINDOW_STORAGE_KEY}
      headerClassName="!h-9 min-h-9 py-1"
      contentClassName="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0"
      contentStyle={{ flex: "1 1 0%", minHeight: 0 }}
      shellProps={{ "aria-labelledby": "free-assets-loader-subtitle" }}
    >
      <p
        id="free-assets-loader-subtitle"
        className="shrink-0 border-b border-zinc-800/80 px-3 py-1.5 text-[11px] leading-snug text-zinc-400"
      >
        Sync models, skies, and textures for local previews
      </p>
      <p className="shrink-0 border-b border-zinc-800/80 px-3 py-1 text-[10px] text-zinc-500 lg:hidden">
        Catalog{" "}
        <span className="font-medium text-zinc-300">
          {rt.listLoading ? "…" : String(entries.length)}
        </span>
        {" · "}
        On disk <span className="font-medium text-zinc-300">{localEntries.length}</span>
        {" · "}
        Selected{" "}
        <span
          className={
            selected.size > 0 ? "font-medium text-cyan-200/90" : "font-medium text-zinc-300"
          }
        >
          {selected.size}
        </span>
      </p>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-2 border-b border-zinc-800/80 px-4 py-2.5">
            <div className="flex gap-1.5" role="tablist" aria-label="Asset views">
              <TRNButton
                size="compact"
                className="min-w-0 flex-1 font-sans"
                selected={mainTab === "online"}
                role="tab"
                aria-selected={mainTab === "online"}
                onClick={() => setMainTab("online")}
              >
                Online catalog
              </TRNButton>
              <TRNButton
                size="compact"
                className="min-w-0 flex-1 font-sans"
                selected={mainTab === "local"}
                role="tab"
                aria-selected={mainTab === "local"}
                onClick={() => setMainTab("local")}
              >
                On this device
              </TRNButton>
            </div>
            <div className="relative w-full min-w-0">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden
              />
              <input
                type="search"
                className={LOADER_MODAL_SEARCH_INPUT_CLASS}
                placeholder={
                  mainTab === "online"
                    ? ternionFreeAssetPackCopy.filterOnlinePaths
                    : "Filter local paths…"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={
                  mainTab === "online"
                    ? "Filter online catalog"
                    : "Filter local paths"
                }
              />
            </div>
          </div>

          {rt.progress && rt.progress.phase !== "done" && (
            <div className="shrink-0 border-b border-zinc-800/80 px-4 py-2">
              <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-zinc-300">
                <span className="min-w-0 truncate">
                  {rt.progress.phase === "listing" && "Listing remote catalog…"}
                  {rt.progress.phase === "downloading" && (
                    <>
                      Downloading {rt.progress.fileIndex ?? 0}/
                      {rt.progress.totalFiles ?? "?"}
                      {rt.progress.currentPath
                        ? ` — ${rt.progress.currentPath}`
                        : ""}
                    </>
                  )}
                </span>
                <span className="shrink-0 font-medium text-cyan-300/90">
                  {Math.round(rt.progress.percent)}%
                </span>
              </div>
              <div
                className="h-1 overflow-hidden rounded-full bg-zinc-800/90"
                role="progressbar"
                aria-valuenow={Math.round(rt.progress.percent)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-cyan-500/70 transition-[width] duration-150"
                  style={{ width: `${Math.min(100, Math.max(0, rt.progress.percent))}%` }}
                />
              </div>
            </div>
          )}

          {toast && (
            <div
              className={`shrink-0 border-b px-4 py-2.5 text-[12px] leading-relaxed ${
                toast.tone === "error"
                  ? "border-rose-500/35 bg-rose-950/35 text-rose-100"
                  : "border-emerald-500/30 bg-emerald-950/30 text-emerald-50"
              }`}
              role="status"
            >
              <p>{toast.message}</p>
              {toast.savedTo ? (
                <div className="mt-2 space-y-2">
                  <p className="break-all text-[11px] text-zinc-200" title={toast.savedTo}>
                    {toast.savedTo}
                  </p>
                  <TRNButton
                    size="compact"
                    selected
                    prefixIcon={
                      rt.isExtension ? (
                        <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      ) : (
                        <Clipboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      )
                    }
                    onClick={() => void revealOrCopyDirectory(toast.savedTo ?? "")}
                  >
                    {rt.isExtension ? "Open in File Explorer" : "Copy folder path"}
                  </TRNButton>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 pb-3 pt-2">
            {mainTab === "online" && (
              <>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <TRNButton
                    size="compact"
                    prefixIcon={
                      rt.listLoading ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      )
                    }
                    onClick={() => void fetchIndex()}
                    disabled={rt.listLoading || rt.busy}
                  >
                    Refresh catalog
                  </TRNButton>
                  <TRNButton
                    size="compact"
                    selected
                    prefixIcon={<Download className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                    onClick={() => void runDownload(undefined)}
                    disabled={rt.busy || entries.length === 0}
                  >
                    Download all
                  </TRNButton>
                  <TRNButton
                    size="compact"
                    prefixIcon={<Download className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                    onClick={() => void runDownload(Array.from(selected))}
                    disabled={rt.busy || entries.length === 0 || selected.size === 0}
                    hint={
                      selected.size === 0
                        ? "Select rows in the table first"
                        : `Download ${selected.size} selected file(s)`
                    }
                  >
                    Download selected ({selected.size})
                  </TRNButton>
                  <TRNButton size="compact" onClick={selectAllFiltered}>
                    Select all
                  </TRNButton>
                  <TRNButton size="compact" onClick={clearSelection}>
                    Clear
                  </TRNButton>
                </div>
                <div
                  className={`${LOADER_MODAL_TABLE_FRAME_CLASS} min-h-[200px] flex-1`}
                  role="tabpanel"
                  aria-label="Online catalog"
                >
                  <div className="h-full min-h-[200px] max-h-full overflow-auto scrollbar-hide">
                    {entries.length === 0 && !rt.listLoading ? (
                      catalogIssue ? (
                        <FreeAssetsLoaderCatalogIssuePanel
                          issue={catalogIssue}
                          localCount={localEntries.length}
                          isExtension={rt.isExtension}
                          listLoading={rt.listLoading}
                          onRetry={() => void fetchIndex()}
                          onOpenLocalTab={() => setMainTab("local")}
                        />
                      ) : (
                        <div className="flex min-h-[min(36vh,280px)] flex-col items-center justify-center gap-3 px-4 py-10 text-center text-zinc-400">
                          <p>{ternionFreeAssetPackCopy.fetchIndexEmpty}</p>
                          <TRNButton size="compact" selected onClick={() => void fetchIndex()}>
                            Load catalog
                          </TRNButton>
                        </div>
                      )
                    ) : (
                      <SortableTable<OnlineSortColumn>
                        caption={ternionFreeAssetPackCopy.onlineTableCaption}
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
                            return (
                              <tr
                                key={row.repoPath}
                                className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/50 ${
                                  idx % 2 === 0 ? "bg-zinc-900/25" : "bg-transparent"
                                }`}
                              >
                                <td className="align-middle px-2 py-2 pl-3">
                                  <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-950 text-cyan-500 focus:ring-1 focus:ring-cyan-500/40"
                                    checked={selected.has(row.repoPath)}
                                    onChange={() => toggleRow(row.repoPath)}
                                    aria-label={`Select ${row.relativePath}`}
                                  />
                                </td>
                                <td className="align-middle px-2 py-2">
                                  <FreeAssetKindBadge kind={kind} />
                                </td>
                                <td className="min-w-0 max-w-0 align-middle px-2 py-2">
                                  <div className="min-w-0">
                                    <div
                                      className="truncate text-[13px] font-medium leading-snug text-zinc-100"
                                      title={row.relativePath}
                                    >
                                      {fileName}
                                    </div>
                                    {parent ? (
                                      <div
                                        className="truncate text-[11px] leading-snug text-zinc-500"
                                        title={parent}
                                      >
                                        {parent}
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right align-middle text-xs text-zinc-400">
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
                aria-label="On this device"
              >
                <TRNHintText>
                  Files under the TERNION pack save folder. Use the search field above to filter.
                </TRNHintText>
                {localRootFs ? (
                  <p className="break-all text-[11px] text-zinc-400" title={localRootFs}>
                    {localRootFs}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  <TRNButton
                    size="compact"
                    prefixIcon={
                      rt.localListLoading ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      )
                    }
                    onClick={() => void fetchLocalEntries()}
                    disabled={rt.localListLoading}
                  >
                    Refresh on disk
                  </TRNButton>
                  {localRootFs ? (
                    <TRNButton
                      size="compact"
                      selected
                      prefixIcon={
                        rt.isExtension ? (
                          <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        ) : (
                          <Clipboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        )
                      }
                      onClick={() => void revealOrCopyDirectory(localRootFs)}
                    >
                      {rt.isExtension ? "Open pack folder" : "Copy pack root"}
                    </TRNButton>
                  ) : null}
                </div>
                <div className={`${LOADER_MODAL_TABLE_FRAME_CLASS} min-h-[160px] flex-1`}>
                  <div className="h-full min-h-[160px] overflow-auto scrollbar-hide">
                    {rt.localListLoading && localEntries.length === 0 ? (
                      <div className="flex min-h-[120px] items-center justify-center gap-2 text-sm text-zinc-500">
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        Scanning local files…
                      </div>
                    ) : filteredLocal.length === 0 ? (
                      <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 px-4 py-8 text-center text-sm text-zinc-500">
                        <p>
                          No files on disk yet, or none match the filter. Use Online
                          catalog to sync, or refresh on disk.
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
                            return (
                              <tr
                                key={row.relativePath}
                                className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/50 ${
                                  idx % 2 === 0 ? "bg-zinc-900/25" : "bg-transparent"
                                }`}
                              >
                                <td className="align-middle px-2 py-2 pl-3">
                                  <FreeAssetKindBadge kind={kind} />
                                </td>
                                <td className="min-w-0 max-w-0 align-middle px-2 py-2">
                                  <div className="min-w-0">
                                    <div
                                      className="truncate text-[13px] font-medium leading-snug text-zinc-100"
                                      title={row.relativePath}
                                    >
                                      {fileName}
                                    </div>
                                    {parent ? (
                                      <div
                                        className="truncate text-[11px] leading-snug text-zinc-500"
                                        title={parent}
                                      >
                                        {parent}
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-2 py-2 text-right align-middle text-xs text-zinc-400">
                                  {formatBytes(row.sizeBytes)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right align-middle text-[11px] text-zinc-500">
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
        </div>

      <footer className="shrink-0 space-y-2 border-t border-zinc-800/80 px-4 py-2.5">
        {shouldShowBridgeEmptyState ? (
          <FreeAssetsLoaderBridgeDevFooter
            wsUrl={getModelLoaderWsClientUrl()}
            commands={[
              "npm run start:bridge",
              "npm run dev:with-model-loader",
            ]}
            extensionHint={`With the Bitstream Studio extension loaded, the broker on ${getModelLoaderWsClientUrl()} should start automatically. Reload after a few seconds, or run the commands above.`}
          />
        ) : null}
        <FreeAssetsLoaderSaveFolderFooter
          pathToShow={pathToShow}
          isExtension={rt.isExtension}
          supportsFolderPicker={rt.supportsFolderPicker}
          hasFolderOverride={rt.downloadFolderOverrideFs != null}
          onPickFolder={() => void rt.pickDownloadFolder()}
          onClearFolderOverride={() => rt.clearDownloadFolderOverride()}
          onOpenFolder={() => void onOpenFolder()}
          onCopyPath={() => void onCopyPath()}
        />
      </footer>
    </TRNWindow>
  );
}
