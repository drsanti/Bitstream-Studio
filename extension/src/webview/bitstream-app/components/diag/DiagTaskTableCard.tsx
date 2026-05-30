import {
  TRNDragHandle,
  TRNInteractiveCard,
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNSegmentedControl,
  TRNTooltip,
} from "@/ui/TRN";
import { ListTree } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DiagTaskRow } from "../../types/diagTaskTable";

type ViewMode = "minimal" | "standard" | "full";

type SortKey =
  | "name"
  | "state"
  | "priority"
  | "cpuPctX100"
  | "stackMinEverWords"
  | "waitTicks"
  | "runTicks"
  | "runCount"
  | "stackAllocWords"
  | "taskId"
  | "flags"
  | "healthFlags";

type SortDir = "asc" | "desc";

type SortState = { key: SortKey; dir: SortDir } | null;

function fmtPctX100(v: number): string {
  const clamped = Math.min(Math.max(v, 0), 10000);
  return (clamped / 100).toFixed(2);
}

function fmtWaitTicks(waitTicks: number): string {
  // Firmware reports RTOS ticks since last observed runtime delta.
  // We render raw ticks to avoid assuming tickHz.
  if (!Number.isFinite(waitTicks)) {
    return "—";
  }
  if (waitTicks < 1000) return `${waitTicks}t`;
  return `${Math.round(waitTicks / 1000)}kt`;
}

function stateLabel(state: number): string {
  // Keep compact; firmware encodes FreeRTOS task states via `bitstream_diag_port_map_task_state`.
  // 0=Running, 1=Ready, 2=Blocked, 3=Suspended, 4=Deleted.
  if (state === 0) return "Run";
  if (state === 1) return "Rdy";
  if (state === 2) return "Blk";
  if (state === 3) return "Sus";
  if (state === 4) return "Del";
  return `0x${state.toString(16)}`;
}

function sortRows(rows: DiagTaskRow[], sort: SortState): DiagTaskRow[] {
  const copy = [...rows];
  if (!sort) {
    return copy.sort((a, b) => b.cpuPctX100 - a.cpuPctX100);
  }
  const dir = sort.dir === "asc" ? 1 : -1;
  const cmpNum = (a: number, b: number) => (a - b) * dir;
  const cmpStr = (a: string, b: string) => a.localeCompare(b) * dir;
  return copy.sort((a, b) => {
    switch (sort.key) {
      case "name":
        return cmpStr(a.name, b.name);
      case "state":
        return cmpNum(a.state, b.state);
      case "priority":
        return cmpNum(a.priority, b.priority);
      case "cpuPctX100":
        return cmpNum(a.cpuPctX100, b.cpuPctX100);
      case "stackMinEverWords":
        return cmpNum(a.stackMinEverWords, b.stackMinEverWords);
      case "waitTicks":
        return cmpNum(a.waitTicks, b.waitTicks);
      case "runTicks":
        return cmpNum(a.runTicks, b.runTicks);
      case "runCount":
        return cmpNum(a.runCount, b.runCount);
      case "stackAllocWords":
        return cmpNum(a.stackAllocWords, b.stackAllocWords);
      case "taskId":
        return cmpNum(a.taskId, b.taskId);
      case "flags":
        return cmpNum(a.flags, b.flags);
      case "healthFlags":
        return cmpNum(a.healthFlags, b.healthFlags);
      default:
        return 0;
    }
  });
}

function sortIcon(sort: SortState, key: SortKey): string {
  if (!sort || sort.key !== key) return "";
  return sort.dir === "desc" ? "↓" : "↑";
}

function nextSort(prev: SortState, key: SortKey): SortState {
  if (!prev || prev.key !== key) return { key, dir: "desc" };
  if (prev.dir === "desc") return { key, dir: "asc" };
  return null;
}

function headerBtnClass(active: boolean): string {
  return `inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[11px] font-semibold normal-case tracking-normal ${
    active ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
  }`;
}

function cellMonoClass(align: "left" | "right" = "right"): string {
  return `font-mono text-[11px] leading-none ${align === "right" ? "text-right" : "text-left"} text-zinc-200`;
}

function cellMonoRightSlot(className = ""): string {
  // Ensure right alignment even when the content is inside an inline tooltip trigger.
  return `block w-full ${cellMonoClass("right")} ${className}`.trim();
}

type Severity = "normal" | "warning" | "danger";

function severityTextClass(sev: Severity): string {
  if (sev === "danger") return "text-rose-300";
  if (sev === "warning") return "text-amber-300";
  return "text-zinc-200";
}

function rowClassName(stale?: boolean): string {
  return stale ? "border-b border-zinc-800/80 opacity-60 hover:bg-white/2" : "border-b border-zinc-800/80 hover:bg-white/3";
}

function severityForCpuPctX100(cpuPctX100: number): Severity {
  // Heuristic: highlight unusually high per-task CPU%.
  if (cpuPctX100 >= 9000) return "danger";
  if (cpuPctX100 >= 7000) return "warning";
  return "normal";
}

function severityForStackMinWords(
  stackMinEverWords: number,
  healthFlags: number,
): Severity {
  // Firmware `healthFlags` bit0 currently indicates stack min-ever < 64 words.
  if ((healthFlags & 0x0001) !== 0) return "danger";
  if (stackMinEverWords !== 0xffff && stackMinEverWords < 128) return "warning";
  return "normal";
}

export function DiagTaskTableCard(props: {
  rows: DiagTaskRow[];
  expectedTaskCount: number | null;
  updatedAt: number | null;
  error: string | null;
  epoch?: number | null;
  deltaSeq?: number | null;
  deltaTimestampMs?: number | null;
  deltaPublishedAtMs?: number | null;
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  diagnosticsStreamEnabled: boolean;
  viewMode: ViewMode;
  onViewModeChange: (next: ViewMode) => void;
  onRequestSetPriority: (
    taskId: number,
    newPriority: number,
  ) => Promise<boolean>;
  debugLines?: string[];
  freshCount?: number;
  staleCount?: number;
  hasQualityWarning?: boolean;
}) {
  const {
    rows,
    expectedTaskCount,
    updatedAt,
    error,
    epoch = null,
    deltaSeq = null,
    deltaTimestampMs = null,
    deltaPublishedAtMs = null,
    collapsed,
    onCollapsedChange,
    diagnosticsStreamEnabled,
    viewMode,
    onViewModeChange,
    onRequestSetPriority,
    debugLines = [],
    freshCount = 0,
    staleCount = 0,
    hasQualityWarning = false,
  } = props;

  const [sort, setSort] = useState<SortState>({
    key: "cpuPctX100",
    dir: "desc",
  });
  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);

  const [menuOpenForTaskId, setMenuOpenForTaskId] = useState<number | null>(
    null,
  );
  const [menuBusy, setMenuBusy] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (menuOpenForTaskId == null) {
      return;
    }
    const onDown = (evt: MouseEvent) => {
      const t = evt.target as Node | null;
      if (!t) return;
      if (menuAnchorRef.current?.contains(t)) return;
      if (menuPanelRef.current?.contains(t)) return;
      setMenuOpenForTaskId(null);
    };
    window.addEventListener("mousedown", onDown, true);
    return () => window.removeEventListener("mousedown", onDown, true);
  }, [menuOpenForTaskId]);

  const onHeaderClick = useCallback((key: SortKey) => {
    setSort((prev) => nextSort(prev, key));
  }, []);

  const columns = useMemo(() => {
    const base: Array<{
      key: SortKey;
      label: string;
      align?: "left" | "right";
    }> = [
      { key: "name", label: "Task", align: "left" },
      { key: "state", label: "State" },
      { key: "priority", label: "Prio" },
      { key: "cpuPctX100", label: "CPU %" },
      { key: "stackMinEverWords", label: "Stack min" },
      { key: "waitTicks", label: "Last run" },
    ];
    if (viewMode === "standard" || viewMode === "full") {
      base.push({ key: "runTicks", label: "Runtime" });
      base.push({ key: "runCount", label: "Run count" });
      base.push({ key: "stackAllocWords", label: "Stack alloc" });
    }
    if (viewMode === "full") {
      base.push({ key: "taskId", label: "Task ID" });
      base.push({ key: "flags", label: "Row flags" });
      base.push({ key: "healthFlags", label: "Health flags" });
    }
    return base;
  }, [viewMode]);

  const viewModeOptions = useMemo(
    () => [
      { value: "minimal", label: "Minimal" },
      { value: "standard", label: "Standard" },
      { value: "full", label: "Full" },
    ],
    [],
  );

  const shownCount = rows.length;
  const countText =
    expectedTaskCount != null
      ? `${shownCount}/${expectedTaskCount}`
      : `${shownCount}`;

  return (
    <TRNInteractiveCard
      title="Task Diagnostics"
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
          <ListTree
            className="h-4 w-4 shrink-0 text-zinc-400"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
      }
      titleTrailingSlot={
        <div className="inline-flex items-center gap-2">
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
            fresh {freshCount}
          </span>
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
            stale {staleCount}
          </span>
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
              hasQualityWarning
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border-zinc-600 bg-zinc-800/50 text-zinc-300"
            }`}
          >
            quality {hasQualityWarning ? "warn" : "ok"}
          </span>
          <span className="text-[11px] font-semibold text-zinc-400">
            {countText}
          </span>
        </div>
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className="h-auto rounded-md border-zinc-700/80 bg-black/40 p-2"
      collapsible
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      contentClassName="min-h-0"
    >
      {error ? <div className="mb-2 text-xs text-rose-300">{error}</div> : null}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <TRNSegmentedControl
          value={viewMode}
          onValueChange={(v) => {
            if (v === "minimal" || v === "standard" || v === "full") {
              onViewModeChange(v);
            }
          }}
          options={viewModeOptions}
          ariaLabel="Task diagnostics view mode"
          size="sm"
          variant="outline"
          tone="accent"
          allowDeselect={false}
        />
        <div className="flex flex-col items-end gap-0.5 text-[11px] font-semibold text-zinc-400">
          <div>
            {updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : "No data yet"}
          </div>
          <div className="font-mono text-[10px] font-semibold text-zinc-500">
            epoch={epoch ?? "--"} seq={deltaSeq ?? "--"}{" "}
            Δts={deltaTimestampMs != null ? `${deltaTimestampMs}ms` : "--"}{" "}
            Δpub={deltaPublishedAtMs != null ? `${deltaPublishedAtMs}ms` : "--"}
          </div>
        </div>
      </div>

      {!diagnosticsStreamEnabled ? (
        <p className="text-xs text-zinc-400">
          Turn on{" "}
          <span className="font-semibold text-zinc-300">
            Streaming mode
          </span>{" "}
          to view task metrics.
        </p>
      ) : (
        <div className="min-h-0 overflow-auto rounded border border-zinc-700/80 bg-black/20">
          <table className="min-w-full table-fixed border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur">
              <tr>
                {columns.map((c) => {
                  const active = sort?.key === c.key;
                  return (
                    <th
                      key={c.key}
                      className="border-b border-zinc-700/80 px-2 py-1 text-left"
                    >
                      <button
                        type="button"
                        className={headerBtnClass(active)}
                        onClick={() => onHeaderClick(c.key)}
                      >
                        <span>{c.label}</span>
                        <span className="text-zinc-500">
                          {sortIcon(sort, c.key)}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const cpuOver = row.cpuPctX100 > 10000;
                const cpuText = fmtPctX100(row.cpuPctX100);
                const cpuSev: Severity = cpuOver
                  ? "danger"
                  : severityForCpuPctX100(row.cpuPctX100);
                const stackSev = severityForStackMinWords(
                  row.stackMinEverWords,
                  row.healthFlags,
                );
                return (
                  <tr key={row.taskId} className={rowClassName(row.stale)}>
                    {columns.map((c) => {
                      if (c.key === "name") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <TRNTooltip
                              placement="top"
                              content={
                                <div className="space-y-1 text-xs">
                                  <div className="font-semibold text-zinc-100">
                                    {row.name}
                                  </div>
                                  <div className="text-zinc-300">
                                    Task ID: {row.taskId}
                                  </div>
                                  <div className="text-zinc-400">
                                    Row flags: 0x{row.flags.toString(16)}
                                  </div>
                                  <div className="text-zinc-400">
                                    Health flags: 0x
                                    {row.healthFlags.toString(16)}
                                  </div>
                                </div>
                              }
                              trigger={
                                <span className="block min-w-0 truncate text-[11px] font-semibold text-zinc-100">
                                  {row.name}
                                </span>
                              }
                            />
                          </td>
                        );
                      }

                      if (c.key === "priority") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <div className="relative inline-flex">
                              <button
                                ref={(el) => {
                                  if (menuOpenForTaskId === row.taskId) {
                                    menuAnchorRef.current = el;
                                  }
                                }}
                                type="button"
                                className={`rounded-sm px-1.5 py-0.5 ${cellMonoClass()} hover:bg-white/5 cursor-pointer`}
                                onClick={() => {
                                  setMenuOpenForTaskId((prev) =>
                                    prev === row.taskId ? null : row.taskId,
                                  );
                                }}
                                onContextMenu={(e) => {
                                  // Right-click should open the priority menu (native-feeling workflow).
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setMenuOpenForTaskId(row.taskId);
                                }}
                              >
                                {row.priority}
                              </button>

                              {menuOpenForTaskId === row.taskId ? (
                                <div
                                  className="absolute left-0 top-full z-20 mt-1 w-44"
                                  ref={menuPanelRef}
                                >
                                  <TRNMenuPanel tone="glass-dropdown">
                                    <div className="px-2 py-1 text-[11px] font-semibold text-zinc-300">
                                      Set priority
                                    </div>
                                    {[1, 2, 3, 4, 5].map((p) => (
                                      <TRNMenuItemButton
                                        key={p}
                                        label={`Priority ${p}`}
                                        rightSlot={
                                          p === row.priority ? (
                                            <span className="text-[11px] font-semibold text-emerald-300">
                                              current
                                            </span>
                                          ) : null
                                        }
                                        disabled={menuBusy}
                                        onClick={async () => {
                                          setMenuBusy(true);
                                          const ok = await onRequestSetPriority(
                                            row.taskId,
                                            p,
                                          );
                                          setMenuBusy(false);
                                          if (ok) {
                                            setMenuOpenForTaskId(null);
                                          }
                                        }}
                                      />
                                    ))}
                                  </TRNMenuPanel>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        );
                      }

                      if (c.key === "cpuPctX100") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            {cpuOver ? (
                              <TRNTooltip
                                placement="top"
                                content={
                                  <div className="space-y-1 text-xs">
                                    <div className="font-semibold text-zinc-100">
                                      CPU % clamped
                                    </div>
                                    <div className="text-zinc-300">
                                      Raw: {(row.cpuPctX100 / 100).toFixed(2)}%
                                    </div>
                                    <div className="text-zinc-400">
                                      This typically indicates an overflow in
                                      older firmware CPU% math.
                                    </div>
                                  </div>
                                }
                                trigger={
                                  <span
                                    className={cellMonoRightSlot(
                                      severityTextClass(cpuSev),
                                    )}
                                  >
                                    {cpuText}
                                  </span>
                                }
                              />
                            ) : (
                              <div
                                className={cellMonoRightSlot(
                                  severityTextClass(cpuSev),
                                )}
                              >
                                {cpuText}
                              </div>
                            )}
                          </td>
                        );
                      }

                      if (c.key === "stackMinEverWords") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <TRNTooltip
                              placement="top"
                              content={
                                <div className="space-y-1 text-xs">
                                  <div className="font-semibold text-zinc-100">
                                    Stack min ever (words)
                                  </div>
                                  <div className="text-zinc-400">
                                    Firmware reports FreeRTOS stack high
                                    watermark (minimum free observed).
                                  </div>
                                </div>
                              }
                              trigger={
                                <span
                                  className={cellMonoRightSlot(
                                    severityTextClass(stackSev),
                                  )}
                                >
                                  {row.stackMinEverWords === 0xffff
                                    ? "—"
                                    : row.stackMinEverWords}
                                </span>
                              }
                            />
                          </td>
                        );
                      }

                      if (c.key === "waitTicks") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <TRNTooltip
                              placement="top"
                              content={
                                <div className="text-xs text-zinc-200">
                                  Ticks since last observed runtime delta
                                  (tickHz not included in payload)
                                </div>
                              }
                              trigger={
                                <span className={cellMonoRightSlot()}>
                                  {fmtWaitTicks(row.waitTicks)}
                                </span>
                              }
                            />
                          </td>
                        );
                      }

                      if (c.key === "state") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <div className={`${cellMonoClass()} text-zinc-300`}>
                              {stateLabel(row.state)}
                            </div>
                          </td>
                        );
                      }

                      if (c.key === "runTicks") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <div className={cellMonoClass()}>
                              {row.runTicks}
                            </div>
                          </td>
                        );
                      }
                      if (c.key === "runCount") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <div className={cellMonoClass()}>
                              {row.runCount}
                            </div>
                          </td>
                        );
                      }
                      if (c.key === "stackAllocWords") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <div className={cellMonoClass()}>
                              {row.stackAllocWords}
                            </div>
                          </td>
                        );
                      }
                      if (c.key === "taskId") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <div className={cellMonoClass()}>{row.taskId}</div>
                          </td>
                        );
                      }
                      if (c.key === "flags") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <div className={cellMonoClass()}>
                              0x{row.flags.toString(16)}
                            </div>
                          </td>
                        );
                      }
                      if (c.key === "healthFlags") {
                        return (
                          <td key={c.key} className="px-2 py-1">
                            <div className={cellMonoClass()}>
                              0x{row.healthFlags.toString(16)}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={c.key} className="px-2 py-1">
                          <div className={cellMonoClass()}>—</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {debugLines.length > 0 ? (
        <div className="mt-2 rounded border border-zinc-800 bg-zinc-950/60 p-2">
          <div className="mb-1 text-[11px] font-semibold text-zinc-400">Debug</div>
          <div className="space-y-0.5 font-mono text-[11px] text-zinc-300">
            {debugLines.map((line, idx) => (
              <div key={`${idx}-${line}`}>{line}</div>
            ))}
          </div>
        </div>
      ) : null}
    </TRNInteractiveCard>
  );
}
