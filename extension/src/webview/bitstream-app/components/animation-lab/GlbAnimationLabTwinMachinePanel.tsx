import { TRNButton, TRNHintText, TRNSortableSettingsCardList, type TRNSortableSettingsCardItem } from "@/ui/TRN";
import { Activity, ClipboardCopy } from "lucide-react";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { twinHealthLabelLocalized } from "./animation-lab-twin-i18n.js";
import { twinHealthClassName } from "./animation-lab-twin-health.js";
import { useAnimationLabTwinLocaleStore } from "./animation-lab-twin-locale.store.js";
import { ANIMATION_LAB_STORAGE_PREFIX } from "./animation-lab-constants.js";
import type {
  AnimationLabTwinAlert,
  AnimationLabTwinComponentLive,
  AnimationLabTwinHealth,
} from "./digital-twin.types.js";
import { GlbAnimationLabTwinSparkline } from "./GlbAnimationLabTwinSparkline.js";
import { useGlbAnimationLabTwin } from "./glb-animation-lab-twin-context.js";

const TWIN_MACHINE_CARDS_PANEL_ID = `${ANIMATION_LAB_STORAGE_PREFIX}:inspector-twin-machine-cards`;

function formatSignalValue(value: number, unit: string): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const text = value.toFixed(digits);
  return unit.length > 0 ? `${text} ${unit}` : text;
}

function formatAlertTime(atMs: number): string {
  return new Date(atMs).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function HealthPill(props: { health: AnimationLabTwinHealth; className?: string }) {
  const locale = useAnimationLabTwinLocaleStore((s) => s.locale);
  return (
    <span
      className={twMerge(
        "inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        twinHealthClassName(props.health),
        props.className,
      )}
    >
      {twinHealthLabelLocalized(props.health, locale)}
    </span>
  );
}

function ComponentRow(props: {
  row: AnimationLabTwinComponentLive;
  selected: boolean;
  onSelect: () => void;
}) {
  const { row, selected, onSelect } = props;
  return (
    <TRNButton
      type="button"
      size="compact"
      selected={selected}
      className="h-auto w-full justify-between gap-2 px-2.5 py-2 text-left"
      onClick={onSelect}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-medium">{row.label}</div>
        {row.group != null ? (
          <div className="truncate text-[10px] font-normal text-zinc-400">{row.group}</div>
        ) : null}
      </div>
      <HealthPill health={row.health} />
    </TRNButton>
  );
}

function AlertRow(props: { alert: AnimationLabTwinAlert }) {
  const { alert } = props;
  const cleared = alert.clearedAtMs != null;
  return (
    <li
      className={twMerge(
        "flex flex-col gap-0.5 rounded border px-2 py-1.5",
        cleared
          ? "border-zinc-800/70 bg-zinc-950/40 opacity-70"
          : "border-amber-700/40 bg-amber-950/20",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-medium text-zinc-200">
          {alert.componentLabel}
        </span>
        <HealthPill health={alert.health} className="px-1 py-0 text-[9px]" />
      </div>
      <span className="text-[10px] leading-snug text-zinc-400">{alert.message}</span>
      <span className="text-[9px] text-zinc-600">
        {formatAlertTime(alert.atMs)}
        {cleared && alert.clearedAtMs != null
          ? ` · cleared ${formatAlertTime(alert.clearedAtMs)}`
          : ""}
      </span>
    </li>
  );
}

export function GlbAnimationLabTwinMachinePanel() {
  const twinCtx = useGlbAnimationLabTwin();
  const [copyHint, setCopyHint] = useState<"idle" | "ok" | "fail">("idle");

  const grouped = useMemo(() => {
    if (twinCtx == null || twinCtx.components.length === 0) {
      return [];
    }
    const map = new Map<string, AnimationLabTwinComponentLive[]>();
    for (const c of twinCtx.components) {
      const key = c.group ?? "Components";
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [twinCtx]);

  const recentAlerts = useMemo(() => {
    if (twinCtx == null) {
      return [];
    }
    return [...twinCtx.alerts].reverse().slice(0, 12);
  }, [twinCtx]);

  const sortableItems = useMemo((): TRNSortableSettingsCardItem[] => {
    if (twinCtx == null || twinCtx.twin == null || twinCtx.summary == null) {
      return [];
    }

    const selected =
      twinCtx.components.find((c) => c.id === twinCtx.selectedComponentId) ?? null;

    const onCopyReport = () => {
      void twinCtx.copyMaintenanceReport().then((ok) => {
        setCopyHint(ok ? "ok" : "fail");
        window.setTimeout(() => setCopyHint("idle"), 2200);
      });
    };

    const items: TRNSortableSettingsCardItem[] = [
      {
        id: "overview",
        title: "Machine Twin",
        icon: <Activity className="size-3.5 text-cyan-400/90" aria-hidden />,
        titleTrailingSlot: <HealthPill health={twinCtx.summary.health} />,
        defaultExpanded: true,
        content: (
          <div className="flex flex-col gap-2">
            <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
              {twinCtx.dataSourceCaption}
            </TRNHintText>
            <div className="rounded-md border border-zinc-700/50 bg-zinc-900/40 px-2 py-1.5">
              <div className="text-[11px] font-medium text-zinc-200">{twinCtx.summary.label}</div>
              {twinCtx.summary.activeAlertCount > 0 ? (
                <div className="text-[10px] text-amber-300/90">
                  {twinCtx.summary.activeAlertCount} active alert
                  {twinCtx.summary.activeAlertCount === 1 ? "" : "s"}
                  {twinCtx.activeAlertCount > 0
                    ? ` · ${twinCtx.activeAlertCount} in maintenance log`
                    : null}
                </div>
              ) : (
                <div className="text-[10px] text-zinc-500">All subsystems within limits</div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <TRNButton size="compact" className="gap-1 px-2" onClick={onCopyReport}>
                <ClipboardCopy className="size-3.5 shrink-0" aria-hidden />
                Copy report
              </TRNButton>
              {copyHint === "ok" ? (
                <span className="text-[10px] text-emerald-400/90">Copied JSON</span>
              ) : null}
              {copyHint === "fail" ? (
                <span className="text-[10px] text-rose-400/90">Copy failed</span>
              ) : null}
            </div>
          </div>
        ),
      },
    ];

    if (recentAlerts.length > 0) {
      items.push({
        id: "maintenance-log",
        title: "Maintenance log",
        defaultExpanded: false,
        content: (
          <ul className="flex max-h-36 flex-col gap-1 overflow-y-auto scrollbar-hide">
            {recentAlerts.map((alert) => (
              <AlertRow key={`${alert.id}-${alert.atMs}`} alert={alert} />
            ))}
          </ul>
        ),
      });
    }

    items.push({
      id: "subsystems",
      title: "Subsystems",
      defaultExpanded: true,
      content: (
        <div className="flex max-h-48 flex-col gap-2 overflow-y-auto scrollbar-hide">
          {grouped.map(([group, rows]) => (
            <div key={group} className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {group}
              </span>
              {rows.map((row) => (
                <ComponentRow
                  key={row.id}
                  row={row}
                  selected={row.id === twinCtx.selectedComponentId}
                  onSelect={() => twinCtx.selectComponent(row.id)}
                />
              ))}
            </div>
          ))}
        </div>
      ),
    });

    items.push({
      id: "signals",
      title: selected != null ? selected.label : "Signals",
      defaultExpanded: true,
      content:
        selected != null ? (
          <div className="flex flex-col gap-1.5">
            <ul className="flex flex-col gap-1.5">
              {selected.signals.map((signal) => {
                const trend = twinCtx.readTrendSamples(selected.id, signal.key);
                return (
                  <li
                    key={signal.key}
                    className="flex flex-col gap-1 rounded border border-zinc-800/80 bg-zinc-950/60 px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-400">{signal.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-zinc-100">
                          {formatSignalValue(signal.value, signal.unit)}
                        </span>
                        <HealthPill health={signal.health} className="px-1 py-0 text-[9px]" />
                      </div>
                    </div>
                    <GlbAnimationLabTwinSparkline
                      samples={trend}
                      strokeColor={
                        signal.health === "error"
                          ? "#fb7185"
                          : signal.health === "warning"
                            ? "#fb923c"
                            : "#22d3ee"
                      }
                    />
                  </li>
                );
              })}
            </ul>
            {selected.glbAnchor != null ? (
              <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
                Linked animation: {selected.glbAnchor}. Use Play in the Playback tab to stress this
                subsystem.
              </TRNHintText>
            ) : null}
          </div>
        ) : (
          <TRNHintText tone="muted" className="mb-0 text-[11px]">
            Select a subsystem to view trends and parameters.
          </TRNHintText>
        ),
    });

    return items;
  }, [copyHint, grouped, recentAlerts, twinCtx]);

  if (twinCtx == null || twinCtx.twin == null || twinCtx.summary == null) {
    return null;
  }

  return (
    <TRNSortableSettingsCardList
      panelId={TWIN_MACHINE_CARDS_PANEL_ID}
      items={sortableItems}
      className="space-y-2"
    />
  );
}
