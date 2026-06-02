import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { CircleCheck, Loader2 } from "lucide-react";
import {
  classifyFreePackRelativePath,
  FREE_PACK_ASSET_CATEGORIES,
  freePackCategoryMeta,
  packRelativeFromSyncProgressPath,
  summarizePathsByFreePackCategory,
  type FreePackAssetCategoryId,
} from "./freePackAssetCategories.js";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";

type RowStatus = "pending" | "active" | "done";

function rowStatusForCategory(
  categoryId: FreePackAssetCategoryId,
  activeId: FreePackAssetCategoryId | null,
  completedIds: ReadonlySet<FreePackAssetCategoryId>,
): RowStatus {
  if (activeId === categoryId) {
    return "active";
  }
  if (completedIds.has(categoryId)) {
    return "done";
  }
  return "pending";
}

function CategoryIcon(props: {
  status: RowStatus;
  Icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
}) {
  const { status, Icon } = props;
  if (status === "active") {
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-300" strokeWidth={2.25} aria-hidden />;
  }
  if (status === "done") {
    return <CircleCheck className="h-4 w-4 shrink-0 text-emerald-400/90" strokeWidth={2.25} aria-hidden />;
  }
  return <Icon className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={2} aria-hidden />;
}

export function StartupChecklistAssetTypeActivity(props: {
  mode: "syncing" | "missing";
  syncCurrentPath?: string | null;
  syncPhase?: "listing" | "downloading" | "done" | null;
  missingPaths?: readonly string[];
}) {
  const { mode, syncCurrentPath, syncPhase, missingPaths = [] } = props;

  const [completedIds, setCompletedIds] = useState<Set<FreePackAssetCategoryId>>(() => new Set());
  const lastActiveRef = useRef<FreePackAssetCategoryId | null>(null);

  const packRelative = packRelativeFromSyncProgressPath(syncCurrentPath ?? null);
  const activeCategoryId =
    packRelative != null ? classifyFreePackRelativePath(packRelative) : null;

  useEffect(() => {
    if (mode !== "syncing") {
      setCompletedIds(new Set());
      lastActiveRef.current = null;
      return;
    }
    const prev = lastActiveRef.current;
    if (prev != null && activeCategoryId != null && prev !== activeCategoryId) {
      setCompletedIds((current) => {
        if (current.has(prev)) {
          return current;
        }
        const next = new Set(current);
        next.add(prev);
        return next;
      });
    }
    if (activeCategoryId != null) {
      lastActiveRef.current = activeCategoryId;
    }
  }, [activeCategoryId, mode]);

  const syncingRows = useMemo(() => {
    const visibleIds = new Set<FreePackAssetCategoryId>(completedIds);
    if (activeCategoryId != null) {
      visibleIds.add(activeCategoryId);
    }
    if (visibleIds.size === 0) {
      return FREE_PACK_ASSET_CATEGORIES.slice(0, 3);
    }
    return FREE_PACK_ASSET_CATEGORIES.filter((c) => visibleIds.has(c.id));
  }, [activeCategoryId, completedIds]);

  if (mode === "missing") {
    const groups = summarizePathsByFreePackCategory(missingPaths);
    if (groups.length === 0) {
      return (
        <p className="text-[10px] text-zinc-500">
          {ternionFreeAssetPackCopy.incompleteShort}
        </p>
      );
    }
    return (
      <ul className="space-y-1.5" aria-label="Missing asset categories">
        {groups.map(({ meta, count }) => (
          <li
            key={meta.id}
            className="flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-950/15 px-2 py-1.5"
          >
            <meta.icon className="h-4 w-4 shrink-0 text-rose-300/80" strokeWidth={2} aria-hidden />
            <span className="min-w-0 flex-1 text-[11px] font-medium text-zinc-200">{meta.label}</span>
            <span className="shrink-0 text-[10px] text-zinc-500">
              {count} file{count === 1 ? "" : "s"}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const listing = syncPhase === "listing" && activeCategoryId == null;

  return (
    <ul className="space-y-1.5" aria-label="Download activity" aria-live="polite">
      {listing ? (
        <li className="flex items-center gap-2 rounded-md border border-sky-500/25 bg-sky-950/20 px-2 py-1.5">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-300" strokeWidth={2.25} aria-hidden />
          <span className="text-[11px] font-medium text-sky-100/90">Preparing download…</span>
        </li>
      ) : null}
      {syncingRows.map((meta) => {
        const status = rowStatusForCategory(meta.id, activeCategoryId, completedIds);
        const tone =
          status === "active"
            ? "border-sky-500/30 bg-sky-950/25 text-sky-50"
            : status === "done"
              ? "border-emerald-500/20 bg-emerald-950/10 text-zinc-200"
              : "border-zinc-800/80 bg-zinc-950/40 text-zinc-400";
        return (
          <li
            key={meta.id}
            className={`flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors ${tone}`}
          >
            <CategoryIcon status={status} Icon={meta.icon} />
            <span className="text-[11px] font-medium">{meta.label}</span>
            {status === "active" ? (
              <span className="ml-auto text-[10px] text-sky-200/70">Downloading…</span>
            ) : null}
          </li>
        );
      })}
      {activeCategoryId != null && !syncingRows.some((r) => r.id === activeCategoryId) ? (
        <li className="flex items-center gap-2 rounded-md border border-sky-500/30 bg-sky-950/25 px-2 py-1.5">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-300" strokeWidth={2.25} aria-hidden />
          <span className="text-[11px] font-medium text-sky-50">
            {freePackCategoryMeta(activeCategoryId).label}
          </span>
          <span className="ml-auto text-[10px] text-sky-200/70">Downloading…</span>
        </li>
      ) : null}
    </ul>
  );
}
