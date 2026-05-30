import React from "react";
import type { ModelLoaderLocalEntry } from "../types";
import { ModelLoaderGroupCard } from "./ModelLoaderGroupCard";

export interface ModelLoaderLocalModelsTableProps {
  rows: ModelLoaderLocalEntry[];
  loading: boolean;
  error: string | null;
  selectedRowId: string | null;
  onSelectRowId: (rowId: string) => void;
  /** Rendered below the local models table (e.g. 3D preview and model details). */
  belowTable?: React.ReactNode;
}

export function ModelLoaderLocalModelsTable({
  rows,
  loading,
  error,
  selectedRowId,
  onSelectRowId,
  belowTable,
}: ModelLoaderLocalModelsTableProps) {
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
    <ModelLoaderGroupCard title="Loaded models (local)" defaultOpen>
      <div className="space-y-3">
        {error && (
          <p className="text-xs text-amber-300/95 rounded border border-amber-500/35 bg-amber-500/10 px-2 py-1.5">
            {error}
          </p>
        )}
        <div className="max-h-[32vh] overflow-y-auto scrollbar-dark-small">
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
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-xs text-gray-400">
                  No downloaded models yet. Use Download after selecting an online model.
                </td>
              </tr>
            )}
            {sortedRows.map((row) => (
              <tr
                key={row.id}
                className={`border-t border-white/10 transition-colors duration-150 cursor-pointer ${
                  row.id === selectedRowId
                    ? "bg-sky-500/15 ring-1 ring-inset ring-sky-400/25"
                    : "hover:bg-white/5"
                }`}
                onClick={() => onSelectRowId(row.id)}
              >
                <td className="px-3 py-1.5 font-mono text-blue-300">
                  {row.productId || "-"}
                </td>
                <td className="px-3 py-1.5 text-gray-200">{row.name}</td>
                <td className="px-3 py-1.5 text-gray-300">
                  {row.category || "Uncategorized"}
                </td>
                <td className="px-3 py-1.5 font-mono text-[11px] uppercase text-cyan-300/90">
                  {row.fileType}
                </td>
                <td className="px-3 py-1.5 text-[11px] text-gray-300">
                  {formatBytes(row.sizeBytes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {belowTable}
      </div>
    </ModelLoaderGroupCard>
  );
}
