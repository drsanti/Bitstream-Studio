import {
  TRNButton,
  TRNHintText,
  TRNSelect,
  TRNSortableSettingsCardList,
  type TRNSortableSettingsCardItem,
} from "@/ui/TRN";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { inferSensorTelemetryHintFromSourceKey } from "../../../sensor-studio/core/live/resolve-sensor-source-key.js";
import {
  SENSOR_HEALTH_FALLBACK_LIVE_MAX_AGE_MS,
  SENSOR_HEALTH_FALLBACK_STALE_MAX_AGE_MS,
} from "../../../sensor-studio/core/device/sensor-health-thresholds.js";
import { writeClipboardText } from "../../../ui/utils/clipboard.js";
import { useBitstreamConnectionStore } from "../../state/bitstreamConnection.store.js";
import { useBitstreamLiveStore } from "../../state/bitstreamLive.store.js";
import { ANIMATION_LAB_STORAGE_PREFIX } from "./animation-lab-constants.js";
import { resolveAnimationLabTwinLiveNumeric } from "./animation-lab-twin-live.js";
import {
  defaultSubParamForSensor,
  TWIN_MAPPING_SENSOR_NONE,
  TWIN_MAPPING_SENSOR_OPTIONS,
  subParamOptionsForSensor,
  type TwinMappingSensorId,
} from "./animation-lab-twin-mapping-catalog.js";
import {
  readEffectiveLiveSourceKeyForRow,
  readMappingColumnsForRow,
  useAnimationLabTwinMappingStore,
} from "./animation-lab-twin-mapping.store.js";
import type {
  AnimationLabDigitalTwinDef,
  AnimationLabTwinComponentDef,
  AnimationLabTwinComponentLive,
} from "./digital-twin.types.js";
import { twinI18n } from "./animation-lab-twin-i18n.js";
import { useAnimationLabTwinLocaleStore } from "./animation-lab-twin-locale.store.js";
import {
  resolveTwinComponentDisplayLabel,
  resolveTwinSignalDisplayLabel,
} from "./animation-lab-twin-localize.js";
import { useGlbAnimationLabTwin } from "./glb-animation-lab-twin-context.js";

function formatPreviewValue(value: number, unit: string): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const text = value.toFixed(digits);
  return unit.length > 0 ? `${text} ${unit}` : text;
}

type RowMappingStatus = "sim" | "idle" | "live" | "stale";

function resolveRowMappingStatus(args: {
  liveSourceKey: string | undefined;
  liveActive: boolean;
  liveValue: number | null;
  nowMs: number;
  lastAtMs: number | null;
}): RowMappingStatus {
  if (args.liveSourceKey == null) {
    return "sim";
  }
  if (!args.liveActive) {
    return "idle";
  }
  if (args.liveValue == null) {
    return "idle";
  }
  if (args.lastAtMs == null) {
    return "idle";
  }
  const ageMs = args.nowMs - args.lastAtMs;
  if (ageMs > SENSOR_HEALTH_FALLBACK_STALE_MAX_AGE_MS) {
    return "stale";
  }
  if (ageMs > SENSOR_HEALTH_FALLBACK_LIVE_MAX_AGE_MS) {
    return "stale";
  }
  return "live";
}

function statusLabel(status: RowMappingStatus): string {
  switch (status) {
    case "sim":
      return "SIM";
    case "idle":
      return "WAIT";
    case "live":
      return "LIVE";
    case "stale":
      return "STALE";
  }
}

function statusClass(status: RowMappingStatus): string {
  switch (status) {
    case "sim":
      return "text-zinc-500";
    case "idle":
      return "text-amber-400/90";
    case "live":
      return "text-emerald-400/90";
    case "stale":
      return "text-orange-400/90";
  }
}

function MappingStatusBadge(props: { status: RowMappingStatus }) {
  return (
    <span
      className={twMerge(
        "shrink-0 text-[9px] font-bold uppercase tracking-wide",
        statusClass(props.status),
      )}
    >
      {statusLabel(props.status)}
    </span>
  );
}

const SENSOR_SELECT_OPTIONS = TWIN_MAPPING_SENSOR_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

function MappingColumnHeader() {
  const locale = useAnimationLabTwinLocaleStore((s) => s.locale);
  return (
    <div className="mb-1 grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.7fr)_minmax(0,1fr)_2.25rem] gap-1 border-b border-zinc-800/70 pb-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
      <span>{twinI18n(locale, "mapping.columnParameter")}</span>
      <span>{twinI18n(locale, "mapping.columnSensor")}</span>
      <span>{twinI18n(locale, "mapping.columnSubParam")}</span>
      <span className="text-center" aria-hidden>
        ●
      </span>
    </div>
  );
}

function TwinMappingComponentCardContent(props: {
  component: AnimationLabTwinComponentDef;
  liveComponent: AnimationLabTwinComponentLive | undefined;
  primaryKey: string;
  streamLive: boolean;
  nowMs: number;
  signalLiveSourceByKey: Record<string, string | null>;
  setSignalMapping: ReturnType<typeof useAnimationLabTwinMappingStore.getState>["setSignalMapping"];
  setCardPrimary: ReturnType<typeof useAnimationLabTwinMappingStore.getState>["setCardPrimary"];
  latestByHint: ReturnType<typeof useBitstreamLiveStore.getState>["latestByHint"];
  lastAtByHint: ReturnType<typeof useBitstreamLiveStore.getState>["lastAtByHint"];
  locale: ReturnType<typeof useAnimationLabTwinLocaleStore.getState>["locale"];
}) {
  const {
    component,
    liveComponent,
    primaryKey,
    streamLive,
    nowMs,
    signalLiveSourceByKey,
    setSignalMapping,
    setCardPrimary,
    latestByHint,
    lastAtByHint,
    locale,
  } = props;

  const componentLabel = resolveTwinComponentDisplayLabel(component, locale);

  return (
    <div className="flex flex-col gap-0.5">
      <MappingColumnHeader />
      {component.signals.map((signal) => {
        const signalLabel = resolveTwinSignalDisplayLabel(signal, locale);
        const mapKey = `${component.id}::${signal.key}`;
        const columns = readMappingColumnsForRow({
          metadataLiveSourceKey: signal.liveSourceKey,
          signalLiveSourceByKey,
          componentId: component.id,
          signalKey: signal.key,
        });
        const effectiveKey = readEffectiveLiveSourceKeyForRow({
          metadataLiveSourceKey: signal.liveSourceKey,
          signalLiveSourceByKey,
          componentId: component.id,
          signalKey: signal.key,
        });
        const hint =
          effectiveKey != null ? inferSensorTelemetryHintFromSourceKey(effectiveKey) : null;
        const liveValue =
          effectiveKey != null
            ? resolveAnimationLabTwinLiveNumeric(latestByHint, effectiveKey)
            : null;
        const lastAt = hint != null ? lastAtByHint[hint] : null;
        const status = resolveRowMappingStatus({
          liveSourceKey: effectiveKey,
          liveActive: streamLive,
          liveValue,
          nowMs,
          lastAtMs: lastAt,
        });
        const simSignal = liveComponent?.signals.find((s) => s.key === signal.key);
        const previewText =
          liveValue != null
            ? formatPreviewValue(liveValue, signal.unit)
            : simSignal != null
              ? formatPreviewValue(simSignal.value, signal.unit)
              : "—";

        const subOptions = subParamOptionsForSensor(columns.sensor);
        const subSelectOptions =
          columns.sensor === TWIN_MAPPING_SENSOR_NONE
            ? [{ value: "", label: "—" }]
            : subOptions.map((o) => ({
                value: o.subParam,
                label: o.label,
              }));

        const isPrimary = signal.key === primaryKey;

        return (
          <div
            key={mapKey}
            className={twMerge(
              "grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.7fr)_minmax(0,1fr)_2.25rem] items-center gap-1 rounded-md border border-transparent py-1 pl-1.5 pr-1",
              isPrimary && "border-l-2 border-l-cyan-500/70 pl-1",
            )}
          >
            <div className="min-w-0">
              <button
                type="button"
                className={twMerge(
                  "mb-0.5 block max-w-full truncate text-left text-[10px] font-medium",
                  isPrimary ? "text-cyan-300" : "text-zinc-200",
                )}
                aria-label={`Show ${signalLabel} on 3D card for ${componentLabel}`}
                onClick={() => setCardPrimary(component.id, signal.key)}
              >
                {isPrimary ? "● " : ""}
                {signalLabel}
              </button>
              <div className="flex items-center gap-1 truncate text-[9px] text-zinc-500">
                <MappingStatusBadge status={status} />
                <span className="truncate">{previewText}</span>
              </div>
            </div>

            <TRNSelect
              size="sm"
              ariaLabel={`Sensor for ${component.label} ${signal.label}`}
              value={columns.sensor}
              options={SENSOR_SELECT_OPTIONS}
              buttonClassName="h-7 min-h-7 px-1.5 text-[10px]"
              onValueChange={(sensor) => {
                const sid = sensor as TwinMappingSensorId;
                if (sid === TWIN_MAPPING_SENSOR_NONE) {
                  setSignalMapping(component.id, signal.key, TWIN_MAPPING_SENSOR_NONE, "");
                  return;
                }
                const sub = defaultSubParamForSensor(sid);
                setSignalMapping(component.id, signal.key, sid, sub);
              }}
            />

            <TRNSelect
              size="sm"
              ariaLabel={`Sub-parameter for ${component.label} ${signal.label}`}
              value={columns.subParam}
              disabled={columns.sensor === TWIN_MAPPING_SENSOR_NONE}
              options={subSelectOptions}
              buttonClassName="h-7 min-h-7 px-1.5 text-[10px]"
              onValueChange={(subParam) => {
                if (columns.sensor === TWIN_MAPPING_SENSOR_NONE) {
                  return;
                }
                setSignalMapping(component.id, signal.key, columns.sensor, subParam);
              }}
            />

            <span
              className="text-center text-[8px] text-zinc-600"
              aria-hidden={!isPrimary}
            >
              {isPrimary ? "3D" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function buildMappingSortablePanelId(twin: AnimationLabDigitalTwinDef): string {
  const safe = twin.assetId.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  return `${ANIMATION_LAB_STORAGE_PREFIX}:twin-mapping-cards:${safe}`;
}

export function GlbAnimationLabInspectorLiveMappingTab() {
  const locale = useAnimationLabTwinLocaleStore((s) => s.locale);
  const twinCtx = useGlbAnimationLabTwin();
  const connected = useBitstreamConnectionStore((s) => s.connected);
  const latestByHint = useBitstreamLiveStore((s) => s.latestByHint);
  const lastAtByHint = useBitstreamLiveStore((s) => s.lastAtByHint);
  const signalLiveSourceByKey = useAnimationLabTwinMappingStore((s) => s.signalLiveSourceByKey);
  const cardPrimaryByComponent = useAnimationLabTwinMappingStore((s) => s.cardPrimaryByComponent);
  const setSignalMapping = useAnimationLabTwinMappingStore((s) => s.setSignalMapping);
  const setCardPrimary = useAnimationLabTwinMappingStore((s) => s.setCardPrimary);
  const resetAllMappings = useAnimationLabTwinMappingStore((s) => s.resetAllMappings);
  const snapshot = useAnimationLabTwinMappingStore((s) => s.snapshot);

  const nowMs = Date.now();
  const streamLive =
    twinCtx != null &&
    connected &&
    (twinCtx.dataSource === "live" || twinCtx.dataSource === "mixed");

  if (twinCtx == null || twinCtx.twin == null) {
    return (
      <TRNHintText tone="muted" className="mb-0 text-xs">
        Load a model with a machine twin to map live sensors to 3D tag cards.
      </TRNHintText>
    );
  }

  const twin = twinCtx.twin;
  const defaultExpanded = twin.components.length <= 5;

  const sortableItems: TRNSortableSettingsCardItem[] = useMemo(
    () =>
      twin.components.map((component) => {
        const liveComponent = twinCtx.components.find((c) => c.id === component.id);
        const primaryKey =
          cardPrimaryByComponent[component.id] ??
          component.cardPrimarySignalKey ??
          component.signals[0]?.key ??
          "";

        return {
          id: component.id,
          title: resolveTwinComponentDisplayLabel(component, locale),
          defaultExpanded,
          titleTrailing:
            component.group != null ? (
              <span className="shrink-0 text-[9px] font-normal uppercase tracking-wide text-zinc-500">
                {component.group}
              </span>
            ) : undefined,
          content: (
            <TwinMappingComponentCardContent
              component={component}
              liveComponent={liveComponent}
              primaryKey={primaryKey}
              streamLive={streamLive}
              nowMs={nowMs}
              signalLiveSourceByKey={signalLiveSourceByKey}
              setSignalMapping={setSignalMapping}
              setCardPrimary={setCardPrimary}
              latestByHint={latestByHint}
              lastAtByHint={lastAtByHint}
              locale={locale}
            />
          ),
        };
      }),
    [
      cardPrimaryByComponent,
      defaultExpanded,
      lastAtByHint,
      latestByHint,
      nowMs,
      setCardPrimary,
      setSignalMapping,
      signalLiveSourceByKey,
      streamLive,
      locale,
      twin.components,
      twinCtx.components,
    ],
  );

  const copyMappingJson = async (): Promise<void> => {
    await writeClipboardText(JSON.stringify(snapshot(), null, 2));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <TRNHintText tone="muted" className="mb-0 shrink-0 text-[10px] leading-snug">
        Map each 3D tag card to sensor sub-parameters. Drag cards to reorder. Data source:{" "}
        <span className="font-medium text-zinc-300">{twinCtx.dataSourceCaption}</span>
        {!connected ? " · connect Bitstream or Simulator for live preview" : null}
      </TRNHintText>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
        <TRNSortableSettingsCardList
          panelId={buildMappingSortablePanelId(twin)}
          className="flex flex-col gap-2 pb-2"
          items={sortableItems}
        />
      </div>

      <TRNHintText tone="muted" className="mb-0 shrink-0 text-[9px] leading-snug">
        Drag the grip to reorder cards. Tap a parameter name to show it on the 3D tag (● cyan
        accent + 3D column). Other rows map live data for the twin panel only.
      </TRNHintText>

      <div className="flex shrink-0 flex-wrap gap-1.5">
        <TRNButton
          size="compact"
          tone="neutral"
          className="border-zinc-600/80 bg-zinc-900/60 text-[11px]"
          onClick={() => void copyMappingJson()}
        >
          Copy mapping JSON
        </TRNButton>
        <TRNButton
          size="compact"
          tone="neutral"
          className="border-zinc-600/80 bg-zinc-900/60 text-[11px]"
          onClick={() => resetAllMappings()}
        >
          Reset all mappings
        </TRNButton>
      </div>
    </div>
  );
}
