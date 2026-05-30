import React from "react";
import type { ModelLoaderModelEntry } from "../types";
import { ModelLoaderActionsCard, type ModelLoaderActionsCardProps } from "./ModelLoaderActionsCard";
import { ModelLoaderConfigCard, type ModelLoaderConfigCardProps } from "./ModelLoaderConfigCard";
import { ModelLoaderGroupCard } from "./ModelLoaderGroupCard";
import { ModelLoaderQueryCard, type ModelLoaderQueryCardProps } from "./ModelLoaderQueryCard";
import {
  ModelLoaderDownloaderCards,
  type ModelLoaderDownloaderCardsProps,
} from "./ModelLoaderDownloaderCards";
import {
  ModelLoaderDownloadLocationCard,
  type ModelLoaderDownloadLocationCardProps,
} from "./ModelLoaderDownloadLocationCard";

export type ModelLoaderResultsTableProps = ModelLoaderActionsCardProps &
  ModelLoaderConfigCardProps &
  ModelLoaderQueryCardProps &
  ModelLoaderDownloaderCardsProps &
  ModelLoaderDownloadLocationCardProps & {
    rows: ModelLoaderModelEntry[];
    onSelect: (productId: string) => void;
    onSelectRow?: (row: ModelLoaderModelEntry) => void;
  };

export function ModelLoaderResultsTable(props: ModelLoaderResultsTableProps) {
  const {
    rows,
    selectedProductId,
    onSelect,
    onSelectRow,
    config,
    onChange,
    onSave,
    isExtension,
    page,
    limit,
    searchText,
    selectedCategory,
    categoryOptions,
    onPageChange,
    onLimitChange,
    onSearchTextChange,
    onSelectedCategoryChange,
    onListModels,
    loading,
    outputDir,
    defaultRootHint,
    supportsFolderPicker,
    lastDownloadOutputDir,
    onPickFolder,
    onRevealPath,
    buttonClassName,
    selectedModelInfo,
    lastDownloadResult,
    jobHistory,
    jobEvents,
    currentJobState,
    onClearJobHistory,
    onRetryJob,
    ...actionOnly
  } = props;
  type SortKey = "productId" | "name" | "category" | "fileType" | "sizeBytes";
  const [sortKey, setSortKey] = React.useState<SortKey>("productId");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const formatBytes = (bytes?: number): string => {
    if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes < 0) {
      return "-";
    }
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const sortedRows = React.useMemo(() => {
    const factor = sortDir === "asc" ? 1 : -1;
    const items = [...rows];
    items.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" || typeof bv === "number") {
        const an = typeof av === "number" ? av : -1;
        const bn = typeof bv === "number" ? bv : -1;
        return (an - bn) * factor;
      }
      const as = String(av ?? "").toLowerCase();
      const bs = String(bv ?? "").toLowerCase();
      return as.localeCompare(bs) * factor;
    });
    return items;
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <ModelLoaderGroupCard title="Online models (catalog)" defaultOpen>
      <div className="space-y-3">
        <div className="max-h-[42vh] overflow-y-auto scrollbar-dark-small">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-white/10 text-left text-gray-400">
                <th className="px-3 py-1.5 text-[11px] uppercase tracking-wide cursor-pointer select-none" onClick={() => handleSort("productId")}>Product ID{sortIndicator("productId")}</th>
                <th className="px-3 py-1.5 text-[11px] uppercase tracking-wide cursor-pointer select-none" onClick={() => handleSort("name")}>Name{sortIndicator("name")}</th>
                <th className="px-3 py-1.5 text-[11px] uppercase tracking-wide cursor-pointer select-none" onClick={() => handleSort("category")}>Category{sortIndicator("category")}</th>
                <th className="px-3 py-1.5 text-[11px] uppercase tracking-wide cursor-pointer select-none" onClick={() => handleSort("fileType")}>Type{sortIndicator("fileType")}</th>
                <th className="px-3 py-1.5 text-[11px] uppercase tracking-wide cursor-pointer select-none" onClick={() => handleSort("sizeBytes")}>Size{sortIndicator("sizeBytes")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-xs text-gray-400">
                    No online models returned. Check API key / network, adjust page size, or use List
                    models.
                  </td>
                </tr>
              )}
              {sortedRows.map((row) => {
                const selected = row.productId === selectedProductId;
                return (
                  <tr
                    key={row.productId}
                    className={`border-t border-white/10 cursor-pointer transition-colors duration-150 ${
                      selected
                        ? "bg-sky-500/15 ring-1 ring-inset ring-sky-400/25"
                        : "hover:bg-white/5"
                    }`}
                    onClick={() => {
                      onSelect(row.productId);
                      onSelectRow?.(row);
                    }}
                  >
                    <td className="px-3 py-1.5 font-mono text-blue-300">{row.productId}</td>
                    <td className="px-3 py-1.5 text-gray-200">{row.name}</td>
                    <td className="px-3 py-1.5 text-gray-300">{row.category}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] uppercase text-cyan-300/90">
                      {row.fileType ?? "-"}
                    </td>
                    <td className="px-3 py-1.5 text-[11px] text-gray-300">
                      {formatBytes(row.sizeBytes)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ModelLoaderGroupCard title="Actions" defaultOpen>
          <div className="space-y-3">
            <ModelLoaderActionsCard
              selectedProductId={selectedProductId}
              loading={loading}
              currentJobState={currentJobState}
              {...actionOnly}
            />
            <ModelLoaderGroupCard title="Advanced" defaultOpen={false}>
              <div className="space-y-3">
                <ModelLoaderDownloadLocationCard
                  outputDir={outputDir}
                  defaultRootHint={defaultRootHint}
                  isExtension={isExtension}
                  supportsFolderPicker={supportsFolderPicker}
                  lastDownloadOutputDir={lastDownloadOutputDir}
                  onPickFolder={onPickFolder}
                  onRevealPath={onRevealPath}
                />
                <ModelLoaderConfigCard
                  config={config}
                  onChange={onChange}
                  onSave={onSave}
                  loading={loading}
                  isExtension={isExtension}
                  buttonClassName={buttonClassName}
                />
                <ModelLoaderQueryCard
                  page={page}
                  limit={limit}
                  loading={loading}
                  buttonClassName={buttonClassName}
                  searchText={searchText}
                  selectedCategory={selectedCategory}
                  categoryOptions={categoryOptions}
                  onPageChange={onPageChange}
                  onLimitChange={onLimitChange}
                  onSearchTextChange={onSearchTextChange}
                  onSelectedCategoryChange={onSelectedCategoryChange}
                  onListModels={onListModels}
                />
                <ModelLoaderDownloaderCards
                  selectedModelInfo={selectedModelInfo}
                  lastDownloadResult={lastDownloadResult}
                  jobHistory={jobHistory}
                  jobEvents={jobEvents}
                  currentJobState={currentJobState}
                  loading={loading}
                  buttonClassName={buttonClassName}
                  onClearJobHistory={onClearJobHistory}
                  onRetryJob={onRetryJob}
                />
              </div>
            </ModelLoaderGroupCard>
          </div>
        </ModelLoaderGroupCard>
      </div>
    </ModelLoaderGroupCard>
  );
}
