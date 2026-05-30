import { useCallback, useEffect, useId, useState } from "react";
import {
  normalizeSensorCfg,
  type Bs2SensorConfig,
} from "../../../bitstream2/domains/config/sensor-config";
import { hasSensorCfgV21 } from "../../../bitstream2/domains/config/caps";
import { TRNButton, TRNFormField, TRNHintText } from "../../ui/TRN";
import { IntervalRateField } from "./IntervalRateField";
import { PublishModeField } from "./PublishModeField";
import { SensorMaskChannelsField } from "./SensorMaskChannelsField";
import { SAMPLING_HZ_PRESETS } from "../lib/samplingRatePresets";
import { TRNSectionContainer } from "../../ui/TRN/TRNSectionContainer";
import type { Bitstream2SimulatorFeed, SensorCfgApplyState } from "../hooks/useBitstream2SimulatorFeed";
import { sensorIdLabel } from "../lib/formatSensorSample";
import { SENSOR_CFG_UI } from "../../bitstream-app/constants/sensorConfigUiLabels";
import {
  appliedFieldHint,
  changedSensorCfgFields,
  isSensorCfgDirty,
  sensorCfgSignature,
  streamSummary,
  type SensorCfgFieldKey,
} from "../lib/sensorCfgDraft";

type Props = Pick<
  Bitstream2SimulatorFeed,
  | "simState"
  | "hello"
  | "metrics"
  | "sendPing"
  | "refreshCfg"
  | "applyCfg"
  | "cfgApplyBySensorId"
>;

const inputClass =
  "w-full min-w-0 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100";

const fieldDirtyRing = "border-amber-600/50 ring-1 ring-amber-500/25";

function ConfigStatusChip({
  dirty,
  applyState,
}: {
  dirty: boolean;
  applyState: SensorCfgApplyState | undefined;
}) {
  if (applyState?.status === "applying") {
    return (
      <span className="shrink-0 rounded-full border border-amber-600/40 bg-amber-950/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200">
        Applying…
      </span>
    );
  }
  if (applyState?.status === "error") {
    return (
      <span className="shrink-0 rounded-full border border-rose-600/40 bg-rose-950/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-rose-200">
        Apply failed
      </span>
    );
  }
  if (applyState?.status === "ok") {
    return (
      <span className="shrink-0 rounded-full border border-emerald-600/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
        Applied
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="shrink-0 rounded-full border border-amber-600/50 bg-amber-950/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-100">
        Unsaved changes
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full border border-zinc-600/60 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
      Synced
    </span>
  );
}

function FieldWasHint({ applied, field }: { applied: Bs2SensorConfig; field: SensorCfgFieldKey }) {
  return (
    <p className="text-[10px] text-amber-200/70">Applied: {appliedFieldHint(field, applied)}</p>
  );
}

function ConfigEditorRow({
  applied,
  applyState,
  capsV21,
  onApply,
  onRefresh,
  onDirtyChange,
  onDraftChange,
}: {
  applied: Bs2SensorConfig;
  applyState: SensorCfgApplyState | undefined;
  capsV21: boolean;
  onApply: (cfg: Bs2SensorConfig) => void;
  onRefresh: () => void;
  onDirtyChange: (sensorId: number, dirty: boolean) => void;
  onDraftChange: (sensorId: number, draft: Bs2SensorConfig) => void;
}) {
  const [draft, setDraft] = useState(applied);
  const baseId = useId();
  const appliedSig = sensorCfgSignature(applied);

  useEffect(() => {
    setDraft(applied);
  }, [appliedSig]);

  const dirty = isSensorCfgDirty(draft, applied);
  const changedFields = new Set(changedSensorCfgFields(draft, applied));
  const applying = applyState?.status === "applying";

  useEffect(() => {
    onDirtyChange(applied.sensorId, dirty);
    return () => onDirtyChange(applied.sensorId, false);
  }, [applied.sensorId, dirty, onDirtyChange]);

  useEffect(() => {
    onDraftChange(applied.sensorId, draft);
  }, [applied.sensorId, draft, onDraftChange]);

  const fieldClass = (field: SensorCfgFieldKey) =>
    changedFields.has(field) ? fieldDirtyRing : "";

  return (
    <article
      className={
        "min-w-0 rounded-lg border bg-zinc-950/50 p-3 " +
        (dirty ? "border-amber-700/45" : "border-zinc-800")
      }
    >
      <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100">{sensorIdLabel(applied.sensorId)}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Stream {streamSummary(applied)}
            {dirty ? (
              <span className="text-amber-200/80">
                {" "}
                → pending {streamSummary(draft)}
              </span>
            ) : null}
          </p>
        </div>
        <ConfigStatusChip dirty={dirty} applyState={applyState} />
      </header>

      {applyState?.status === "error" && applyState.message ? (
        <p className="mb-2 text-xs text-rose-300">{applyState.message}</p>
      ) : null}
      {applyState?.status === "ok" && applyState.message ? (
        <p className="mb-2 text-xs text-emerald-300">{applyState.message}</p>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          className={
            "flex min-w-0 flex-col gap-1 rounded-md border bg-zinc-900/40 px-3 py-2 sm:col-span-2 " +
            (changedFields.has("enabled") ? "border-amber-700/40" : "border-zinc-800/80")
          }
        >
          <div className="flex items-center gap-3">
            <input
              id={`${baseId}-enabled`}
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded border-zinc-600"
              checked={draft.enabled}
              disabled={applying}
              onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))}
            />
            <label htmlFor={`${baseId}-enabled`} className="text-sm text-zinc-200">
              Streaming enabled
            </label>
          </div>
          {changedFields.has("enabled") ? (
            <FieldWasHint applied={applied} field="enabled" />
          ) : null}
        </div>

        <PublishModeField
          publishMode={draft.publishMode}
          appliedMode={applied.publishMode}
          disabled={applying}
          dirty={changedFields.has("publishMode")}
          onChange={(publishMode) => setDraft((d) => ({ ...d, publishMode }))}
        />

        <SensorMaskChannelsField
          sensorId={applied.sensorId}
          mask={draft.mask}
          appliedMask={applied.mask}
          disabled={applying}
          dirty={changedFields.has("mask")}
          onMaskChange={(mask) => setDraft((d) => ({ ...d, mask }))}
        />

        <IntervalRateField
          label={SENSOR_CFG_UI.sampleRate}
          intervalMs={draft.samplingIntervalMs}
          appliedIntervalMs={applied.samplingIntervalMs}
          presets={SAMPLING_HZ_PRESETS}
          disabled={applying}
          dirty={
            changedFields.has("samplingIntervalMs") ||
            (capsV21 && changedFields.has("publishIntervalMs"))
          }
          onIntervalMsChange={(samplingIntervalMs) =>
            setDraft((d) => ({
              ...d,
              samplingIntervalMs,
              publishIntervalMs: capsV21 ? 0 : d.publishIntervalMs,
            }))
          }
        />
        {capsV21 ? (
          <TRNHintText tone="info" className="sm:col-span-2">
            Sample and UART telemetry use this rate (publishIntervalMs = same as sampling).
          </TRNHintText>
        ) : null}

        {draft.publishMode !== 0 ? (
          <>
            <TRNFormField label="Delta (×0.01)" htmlFor={`${baseId}-delta`}>
              <input
                id={`${baseId}-delta`}
                type="number"
                min={0}
                className={`${inputClass} ${fieldClass("deltaX100")}`}
                value={draft.deltaX100}
                disabled={applying}
                onChange={(e) => setDraft((d) => ({ ...d, deltaX100: Number(e.target.value) }))}
              />
              {changedFields.has("deltaX100") ? (
                <FieldWasHint applied={applied} field="deltaX100" />
              ) : null}
            </TRNFormField>

            <TRNFormField label={`${SENSOR_CFG_UI.minPublishInterval} (ms)`} htmlFor={`${baseId}-min-publish`}>
              <input
                id={`${baseId}-min-publish`}
                type="number"
                min={0}
                className={`${inputClass} ${fieldClass("minPublishIntervalMs")}`}
                value={draft.minPublishIntervalMs}
                disabled={applying}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, minPublishIntervalMs: Number(e.target.value) }))
                }
              />
              {changedFields.has("minPublishIntervalMs") ? (
                <FieldWasHint applied={applied} field="minPublishIntervalMs" />
              ) : null}
            </TRNFormField>
          </>
        ) : null}
      </div>

      <footer className="mt-3 flex flex-wrap gap-2 border-t border-zinc-800/80 pt-3">
        <button
          type="button"
          disabled={!dirty || applying}
          title={dirty ? "Send SENSOR_CFG_SET to the simulator" : "No changes to apply"}
          className={
            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors " +
            (dirty && !applying
              ? "border-emerald-600/60 bg-emerald-950/50 text-emerald-100 hover:bg-emerald-900/40"
              : "cursor-not-allowed border-zinc-700/80 bg-zinc-900/40 text-zinc-500")
          }
          onClick={() => onApply(draft)}
        >
          Apply cfg
        </button>
        <button
          type="button"
          disabled={!dirty || applying}
          className={
            "rounded-md border px-3 py-1.5 text-xs transition-colors " +
            (dirty && !applying
              ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800/80"
              : "cursor-not-allowed border-zinc-800 text-zinc-600")
          }
          onClick={() => setDraft({ ...applied })}
        >
          Revert
        </button>
        <button
          type="button"
          disabled={applying}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800/80 disabled:opacity-50"
          onClick={onRefresh}
        >
          Refresh
        </button>
      </footer>
    </article>
  );
}

export function FirmwareParamsPanel(props: Props) {
  const configs = (props.simState?.configs ?? []).map((c) =>
    normalizeSensorCfg({
      publishIntervalMs: 0,
      ...c,
    } as Bs2SensorConfig),
  );
  const hello = props.hello ?? props.simState;
  const capsV21 = hasSensorCfgV21(hello?.caps ?? props.simState?.caps ?? 0);
  const [dirtySensorIds, setDirtySensorIds] = useState<Set<number>>(() => new Set());
  const [draftBySensorId, setDraftBySensorId] = useState<Record<number, Bs2SensorConfig>>({});

  const onDirtyChange = useCallback((sensorId: number, dirty: boolean) => {
    setDirtySensorIds((prev) => {
      const next = new Set(prev);
      if (dirty) next.add(sensorId);
      else next.delete(sensorId);
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) {
        return prev;
      }
      return next;
    });
  }, []);

  const dirtyCount = dirtySensorIds.size;

  const onDraftChange = useCallback((sensorId: number, draft: Bs2SensorConfig) => {
    setDraftBySensorId((prev) => ({ ...prev, [sensorId]: draft }));
  }, []);

  const applyAll = useCallback(() => {
    for (const sensorId of dirtySensorIds) {
      const draft = draftBySensorId[sensorId];
      if (draft) {
        props.applyCfg(draft);
      }
    }
  }, [dirtySensorIds, draftBySensorId, props]);

  const anyApplying = Object.values(props.cfgApplyBySensorId).some((s) => s?.status === "applying");

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <TRNSectionContainer title="Firmware identity" glass glassPreset="soft">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-zinc-500">fwTag</dt>
            <dd className="truncate font-mono text-zinc-200">
              {hello?.fwTag ?? props.simState?.fwTag ?? "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-zinc-500">version</dt>
            <dd className="font-mono">{hello?.version ?? props.simState?.version ?? "—"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-zinc-500">caps</dt>
            <dd className="font-mono">
              0x{(hello?.caps ?? props.simState?.caps ?? 0).toString(16)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-zinc-500">mtuSensor</dt>
            <dd className="font-mono">{hello?.mtuSensor ?? props.simState?.mtuSensor ?? "—"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-zinc-500">mtuCtrl</dt>
            <dd className="font-mono">{hello?.mtuCtrl ?? props.simState?.mtuCtrl ?? "—"}</dd>
          </div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <dt className="text-zinc-500">active streams</dt>
            <dd className="wrap-break-word font-mono text-xs">
              {(props.simState?.streamActiveSensorIds ?? []).length > 0
                ? (props.simState?.streamActiveSensorIds ?? [])
                    .map((id) => sensorIdLabel(id))
                    .join(", ")
                : "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-3">
          <button
            type="button"
            className="rounded-md border border-zinc-600 bg-zinc-900/60 px-3 py-1.5 text-sm hover:bg-zinc-800"
            onClick={props.sendPing}
          >
            Send PING
          </button>
        </div>
      </TRNSectionContainer>

      <TRNSectionContainer title="Sensor configuration" glass glassPreset="soft">
        <div className="mb-3 space-y-1.5">
          <TRNHintText tone="info">
            Edits are local until you click <strong className="font-medium text-zinc-200">Apply cfg</strong>.
            The Node simulator keeps streaming the last applied settings.
          </TRNHintText>
          {dirtyCount > 0 ? (
            <TRNHintText tone="warn">
              {dirtyCount} sensor{dirtyCount === 1 ? "" : "s"} have unsaved changes. Samples will not
              change until you Apply.
            </TRNHintText>
          ) : configs.length > 0 ? (
            <TRNHintText>All sensor configs match the simulator.</TRNHintText>
          ) : null}
          {dirtyCount > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={anyApplying}
                className={
                  "rounded-md border px-3 py-1.5 text-xs font-medium " +
                  (anyApplying
                    ? "cursor-not-allowed border-zinc-700 text-zinc-500"
                    : "border-emerald-600/60 bg-emerald-950/50 text-emerald-100 hover:bg-emerald-900/40")
                }
                onClick={applyAll}
              >
                Apply all ({dirtyCount})
              </button>
            </div>
          ) : null}
        </div>

        {configs.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No simulator state yet. Start{" "}
            <code className="text-zinc-400">bitstream-simulator</code> extension + bridge.
          </p>
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            {configs.map((cfg) => (
              <ConfigEditorRow
                key={cfg.sensorId}
                applied={cfg}
                capsV21={capsV21}
                applyState={props.cfgApplyBySensorId[cfg.sensorId]}
                onApply={props.applyCfg}
                onRefresh={() => props.refreshCfg(cfg.sensorId)}
                onDirtyChange={onDirtyChange}
                onDraftChange={onDraftChange}
              />
            ))}
          </div>
        )}
      </TRNSectionContainer>

      <TRNSectionContainer title="Link metrics" glass glassPreset="soft">
        {props.metrics ? (
          <dl className="grid grid-cols-1 gap-2 text-xs font-mono text-zinc-300 sm:grid-cols-2">
            <div>framesOk: {props.metrics.framesOk}</div>
            <div>crcFail: {props.metrics.framesCrcFail}</div>
            <div>uartIn: {props.metrics.uartBytesIn}</div>
            <div>resync: {props.metrics.resyncByteSkips}</div>
            <div className="sm:col-span-2">lenReject: {props.metrics.framesLenReject}</div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </TRNSectionContainer>
    </div>
  );
}
