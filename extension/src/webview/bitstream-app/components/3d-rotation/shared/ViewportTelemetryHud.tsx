import { Activity, Flag, X } from "lucide-react";
import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import { useBmi270FusionQuatWireTapStore } from "../../../state/bmi270FusionQuatWireTap.store.js";
import type { FusionQuat4 } from "./orientationPreviewMath.js";
import {
  eulerZyxDegFromFusionQuat,
  formatDeg1,
  formatFusionQuat4Hud,
  quaternionAngleDegBetween,
  quaternionAngleDegFromIdentity,
} from "./orientationPreviewMath.js";
import {
  orientationPreviewMappingModeLabel,
  type OrientationPreviewMappingMode,
} from "./orientationPreviewMapping.js";
import { TRNParameter } from "@/ui/TRN/TRNParameter";
import { twMerge } from "tailwind-merge";
import { TRNToolboxPanel } from "@/ui/TRN";
import {
  SENSOR_DECK_UNIT_COL_CLASS,
  SENSOR_DECK_VALUE_TEXT_COL_CLASS,
} from "../../telemetry/sensorDeckParameterLayout.js";

function fmtTelemetry2Hz(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  if (value > 9999) {
    return ">9999.00";
  }
  const clamped = Math.min(9999, Math.max(0, value));
  return clamped.toFixed(2);
}

function fmtTelemetry2Fps(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  const clamped = Math.min(999, Math.max(0, value));
  return clamped.toFixed(2);
}

function fmtTelemetry2Ms(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(2);
}

function fmtTelemetry2Count(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) {
    return "—";
  }
  const clamped = Math.min(999, Math.max(0, n));
  return clamped.toFixed(2);
}

const VIEWPORT_TELEMETRY_PANEL_INITIAL_WIDTH_PX = 380;
/** Wide enough for `qx, qy, qz, qw` at 3 decimals without ellipsis. */
const VIEWPORT_TELEMETRY_QUAT_VALUE_COL_CLASS = "min-w-[30ch] max-w-none";

type OrientationMarkSnapshot = {
  wire: FusionQuat4;
  mesh: FusionQuat4;
};

function isFiniteFusionQuat4(q: FusionQuat4): boolean {
  return (
    Number.isFinite(q.qw) &&
    Number.isFinite(q.qx) &&
    Number.isFinite(q.qy) &&
    Number.isFinite(q.qz)
  );
}

function readStoredOrientationMark(
  persistKey: string | undefined,
): OrientationMarkSnapshot | null {
  if (persistKey == null || persistKey.trim().length === 0)
  {
    return null;
  }
  if (typeof localStorage === "undefined")
  {
    return null;
  }
  try
  {
    const raw = localStorage.getItem(`${persistKey}:orient-mark`);
    if (raw == null || raw.trim().length === 0)
    {
      return null;
    }
    const parsed = JSON.parse(raw) as OrientationMarkSnapshot;
    if (
      parsed?.wire != null &&
      parsed?.mesh != null &&
      isFiniteFusionQuat4(parsed.wire) &&
      isFiniteFusionQuat4(parsed.mesh)
    )
    {
      return parsed;
    }
  }
  catch
  {
    // ignore
  }
  return null;
}

function writeStoredOrientationMark(
  persistKey: string | undefined,
  mark: OrientationMarkSnapshot | null,
): void {
  if (persistKey == null || persistKey.trim().length === 0)
  {
    return;
  }
  if (typeof localStorage === "undefined")
  {
    return;
  }
  try
  {
    const storageKey = `${persistKey}:orient-mark`;
    if (mark == null)
    {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(mark));
  }
  catch
  {
    // ignore
  }
}

/** Sentence-style label: uppercase first character only (preserves `UI Δ…`, symbols). */
function telemetryRowLabel(text: string): string {
  const t = text.trim();
  if (t.length === 0) {
    return t;
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export type ViewportTelemetryHudProps = {
  /** Host element for `TRNToolboxPanel` portal + geometry clamp (3D viewport root). */
  positionBoundsRef: RefObject<HTMLElement | null>;
  /** Persist window rect under this storage key suffix (`TRNToolboxPanel` / `TRNWindow`). */
  persistRectStorageKey?: string;
  panelBadge?: string;
  wireHzFromGaps: number | null;
  jitterStdMs: number | null;
  samplesCoalescedLastFlush: number | null | undefined;
  uiHzFromCounter: number | null;
  renderFps: number | null;
  /** Wire-rate fusion quaternion (orientation store). */
  wireFusionQuat?: FusionQuat4 | null;
  /** Mapped mesh target quaternion (same math as OrientationMarkerMesh). */
  meshTargetQuat?: FusionQuat4 | null;
  /** Wire fusion Euler (rad×100) as Three.js ZYX degrees when present on the sample. */
  wireEulerDeg?: {
    pitchDeg: number;
    rollDeg: number;
    yawDeg: number;
  } | null;
  orientationMappingMode?: OrientationPreviewMappingMode;
  onCycleOrientationMappingMode?: () => void;
  className?: string;
};

export function ViewportTelemetryHud(props: ViewportTelemetryHudProps) {
  const {
    positionBoundsRef,
    persistRectStorageKey,
    panelBadge,
    wireHzFromGaps,
    jitterStdMs,
    samplesCoalescedLastFlush,
    uiHzFromCounter,
    renderFps,
    wireFusionQuat,
    meshTargetQuat,
    wireEulerDeg,
    orientationMappingMode,
    onCycleOrientationMappingMode,
    className,
  } = props;

  const wireAngleDeg =
    wireFusionQuat != null
      ? quaternionAngleDegFromIdentity(wireFusionQuat)
      : null;
  const meshAngleDeg =
    meshTargetQuat != null
      ? quaternionAngleDegFromIdentity(meshTargetQuat)
      : null;
  const wireToMeshAngleDeg =
    wireFusionQuat != null && meshTargetQuat != null
      ? quaternionAngleDegBetween(wireFusionQuat, meshTargetQuat)
      : null;
  const meshEulerDeg =
    meshTargetQuat != null ? eulerZyxDegFromFusionQuat(meshTargetQuat) : null;

  const [orientationMark, setOrientationMark] = useState<OrientationMarkSnapshot | null>(
    () => readStoredOrientationMark(persistRectStorageKey),
  );

  useEffect(() => {
    writeStoredOrientationMark(persistRectStorageKey, orientationMark);
  }, [orientationMark, persistRectStorageKey]);

  const deltaWireSinceMarkDeg =
    orientationMark != null && wireFusionQuat != null
      ? quaternionAngleDegBetween(orientationMark.wire, wireFusionQuat)
      : null;
  const deltaMeshSinceMarkDeg =
    orientationMark != null && meshTargetQuat != null
      ? quaternionAngleDegBetween(orientationMark.mesh, meshTargetQuat)
      : null;
  const captureOrientationMark = useCallback(() => {
    const wire = wireFusionQuat ?? null;
    const mesh = meshTargetQuat ?? null;
    if (wire == null && mesh == null)
    {
      return;
    }
    if (wire != null && mesh != null)
    {
      setOrientationMark({ wire: { ...wire }, mesh: { ...mesh } });
      return;
    }
    if (wire != null)
    {
      setOrientationMark({ wire: { ...wire }, mesh: { ...wire } });
      return;
    }
    if (mesh != null)
    {
      setOrientationMark({ wire: { ...mesh }, mesh: { ...mesh } });
    }
  }, [meshTargetQuat, wireFusionQuat]);

  const clearOrientationMark = useCallback(() => {
    setOrientationMark(null);
  }, []);

  const canCaptureMark = wireFusionQuat != null || meshTargetQuat != null;

  const spikeRejectedSinceReset = useBmi270FusionQuatWireTapStore(
    (s) => s.spikeRejectedSinceReset,
  );

  const [panelOpen, setPanelOpen] = useState(() => {
    if (!persistRectStorageKey || typeof localStorage === "undefined") {
      return true;
    }
    try {
      const raw = localStorage.getItem(`${persistRectStorageKey}:open`);
      if (raw === "0") {
        return false;
      }
      if (raw === "1") {
        return true;
      }
    } catch {
      // ignore
    }
    return true;
  });

  useEffect(() => {
    if (!persistRectStorageKey || typeof localStorage === "undefined") {
      return;
    }
    try {
      localStorage.setItem(`${persistRectStorageKey}:open`, panelOpen ? "1" : "0");
    } catch {
      // ignore
    }
  }, [panelOpen, persistRectStorageKey]);

  /** Uniform row box + line-height so every metric row matches (section borders use `gap`, not extra padding). */
  const deckParamProps = {
    appearance: "divider" as const,
    nameColumnLayout: "auto" as const,
    valueColumnLayout: "auto" as const,
    valueTextColumnClassName: SENSOR_DECK_VALUE_TEXT_COL_CLASS,
    /** Same fixed unit gutter as sensor deck — keeps values right-aligned when a row has no unit label. */
    unitColumnClassName: SENSOR_DECK_UNIT_COL_CLASS,
    positiveSignMode: "omit" as const,
    /** Tighter stack + fixed rhythm vs default divider `py-1.5` / `leading-snug`. */
    className: "py-0! min-h-5 !leading-none",
  };

  const quatRowDeckProps = {
    ...deckParamProps,
    valueTruncate: false as const,
    valueTextColumnClassName: VIEWPORT_TELEMETRY_QUAT_VALUE_COL_CLASS,
  };

  const title =
    panelBadge != null && panelBadge.trim().length > 0
      ? panelBadge.trim()
      : "3D telemetry";

  return (
    <>
      {!panelOpen ? (
        <button
          type="button"
          className="pointer-events-auto absolute left-2 top-2 z-24 inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 px-2 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75 hover:text-zinc-100"
          onClick={() => {
            setPanelOpen(true);
          }}
          title="Open telemetry panel"
          aria-label="Open telemetry panel"
        >
          <Activity className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
      <TRNToolboxPanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
        }}
        defaultCollapsed
        title={title}
        prefixIcon={
          <Activity className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
        }
        boundsRef={positionBoundsRef}
        draggable
        resizable
        heightMode="auto"
        autoHeightMaxViewportFraction={0.92}
        minWidth={300}
        minHeight={120}
        initialRect={{
          x: 8,
          y: 8,
          width: VIEWPORT_TELEMETRY_PANEL_INITIAL_WIDTH_PX,
          height: 360,
        }}
        persistRectStorageKey={persistRectStorageKey}
        zIndex={25}
        reopenStrategy="normalize"
        glassBorderOpacity={0.7}
        className={twMerge(className, "border")}
        contentClassName="scrollbar-hide min-h-0 w-full min-w-0 overflow-y-auto border-0! bg-zinc-950/40! p-2"
        toolbarActions={
          <>
            <button
              type="button"
              className="h-6 min-w-6 rounded border-0 bg-transparent px-1 text-xs text-zinc-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={captureOrientationMark}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              disabled={!canCaptureMark}
              title={
                orientationMark != null
                  ? "Update mark to current wire/mesh orientation (Δ baseline)"
                  : "Set mark to current orientation (Δ rotation baseline)"
              }
              aria-label="Set orientation mark"
            >
              <Flag
                className={`h-3.5 w-3.5 ${orientationMark != null ? "text-amber-300" : "text-zinc-300"}`}
                strokeWidth={2.5}
                aria-hidden
              />
            </button>
            {orientationMark != null ? (
              <button
                type="button"
                className="h-6 min-w-6 rounded border-0 bg-transparent px-1 text-xs text-zinc-100 hover:bg-white/10"
                onClick={clearOrientationMark}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                title="Clear orientation mark"
                aria-label="Clear orientation mark"
              >
                <X className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2.5} aria-hidden />
              </button>
            ) : null}
          </>
        }
      >
        <div className="w-full min-w-0 flex flex-col gap-2">
          <TRNParameter
            name={telemetryRowLabel("Wire rate (gaps)")}
            value={fmtTelemetry2Hz(wireHzFromGaps)}
            unit="Hz"
            {...deckParamProps}
          />
          <TRNParameter
            name={telemetryRowLabel("Gap jitter (σ)")}
            value={fmtTelemetry2Ms(jitterStdMs)}
            unit="ms"
            {...deckParamProps}
          />
          <TRNParameter
            name={telemetryRowLabel("Packets per UI flush")}
            value={fmtTelemetry2Count(samplesCoalescedLastFlush)}
            unit=""
            {...deckParamProps}
          />
          <TRNParameter
            name={telemetryRowLabel("Sample rate (counter)")}
            value={fmtTelemetry2Hz(uiHzFromCounter)}
            unit="Hz"
            {...deckParamProps}
          />
          <TRNParameter
            name={telemetryRowLabel("Viewport render")}
            value={fmtTelemetry2Fps(renderFps)}
            unit="FPS"
            {...deckParamProps}
            className={`${deckParamProps.className} border-b-0`}
          />

          <div className="flex flex-col gap-2 border-t border-zinc-800/90">
            {orientationMappingMode != null ? (
              <div className="flex flex-col gap-0.5">
                <TRNParameter
                  name={telemetryRowLabel("Mesh mapping")}
                  value={orientationPreviewMappingModeLabel(orientationMappingMode)}
                  unit=""
                  hint="PCB↔GLB = X flip + Y/Z swap for PSoC mesh; wire-direct = raw BSX quat; firmware-full = Z-up + Ry(π)."
                  {...deckParamProps}
                />
                {onCycleOrientationMappingMode != null ? (
                  <button
                    type="button"
                    className="self-start px-2 text-[10px] text-sky-400 hover:text-sky-300"
                    onClick={onCycleOrientationMappingMode}
                  >
                    Cycle mapping mode
                  </button>
                ) : null}
              </div>
            ) : null}
            <TRNParameter
              name={telemetryRowLabel("Δ wire rotation since mark")}
              value={formatDeg1(deltaWireSinceMarkDeg)}
              unit=""
              hint={
                orientationMark == null
                  ? "Click the flag in the title bar to set the baseline pose."
                  : "Angle between marked wire quaternion and current wire fusion quaternion."
              }
              {...deckParamProps}
            />
            <TRNParameter
              name={telemetryRowLabel("Δ mesh rotation since mark")}
              value={formatDeg1(deltaMeshSinceMarkDeg)}
              unit=""
              hint={
                orientationMark == null
                  ? "Set mark first (flag button)."
                  : "Angle between marked mapped mesh quaternion and current mesh target."
              }
              {...deckParamProps}
            />
            {orientationMark != null &&
            deltaWireSinceMarkDeg != null &&
            deltaMeshSinceMarkDeg != null ? (
              <TRNParameter
                name={telemetryRowLabel("Δ wire − Δ mesh")}
                value={formatDeg1(
                  Math.abs(deltaWireSinceMarkDeg - deltaMeshSinceMarkDeg),
                )}
                unit=""
                hint={
                  Math.abs(deltaWireSinceMarkDeg - deltaMeshSinceMarkDeg) > 15
                    ? "Large gap: check Mesh mapping is Wire direct, or GLB axis vs PCB."
                    : "Should stay small in Wire direct mode when decode matches mesh."
                }
                {...deckParamProps}
              />
            ) : null}
            <TRNParameter
              name={telemetryRowLabel("Wire quat qx,qy,qz,qw")}
              value={
                wireFusionQuat != null
                  ? formatFusionQuat4Hud(wireFusionQuat)
                  : "—"
              }
              unit=""
              hint={
                wireFusionQuat != null
                  ? formatFusionQuat4Hud(wireFusionQuat)
                  : undefined
              }
              {...quatRowDeckProps}
            />
            <TRNParameter
              name={telemetryRowLabel("Wire angle (from identity)")}
              value={formatDeg1(wireAngleDeg)}
              unit=""
              {...deckParamProps}
            />
            {wireEulerDeg != null ? (
              <>
                <TRNParameter
                  name={telemetryRowLabel("Wire euler pitch (ZYX)")}
                  value={formatDeg1(wireEulerDeg.pitchDeg)}
                  unit=""
                  {...deckParamProps}
                />
                <TRNParameter
                  name={telemetryRowLabel("Wire euler roll (ZYX)")}
                  value={formatDeg1(wireEulerDeg.rollDeg)}
                  unit=""
                  {...deckParamProps}
                />
                <TRNParameter
                  name={telemetryRowLabel("Wire euler yaw (ZYX)")}
                  value={formatDeg1(wireEulerDeg.yawDeg)}
                  unit=""
                  {...deckParamProps}
                />
              </>
            ) : null}
            <TRNParameter
              name={telemetryRowLabel("Mesh quat (mapped)")}
              value={
                meshTargetQuat != null
                  ? formatFusionQuat4Hud(meshTargetQuat)
                  : "—"
              }
              unit=""
              hint={
                meshTargetQuat != null
                  ? formatFusionQuat4Hud(meshTargetQuat)
                  : undefined
              }
              {...quatRowDeckProps}
            />
            <TRNParameter
              name={telemetryRowLabel("Mesh angle (from identity)")}
              value={formatDeg1(meshAngleDeg)}
              unit=""
              {...deckParamProps}
            />
            <TRNParameter
              name={telemetryRowLabel("Angle wire → mesh (4-vector)")}
              value={formatDeg1(wireToMeshAngleDeg)}
              unit=""
              hint="Not a fixed mapping offset — compares raw wire vs mapped mesh components; changes with pose."
              {...deckParamProps}
            />
            {meshEulerDeg != null ? (
              <>
                <TRNParameter
                  name={telemetryRowLabel("Mesh euler pitch (ZYX)")}
                  value={formatDeg1(meshEulerDeg.pitchDeg)}
                  unit=""
                  {...deckParamProps}
                />
                <TRNParameter
                  name={telemetryRowLabel("Mesh euler roll (ZYX)")}
                  value={formatDeg1(meshEulerDeg.rollDeg)}
                  unit=""
                  {...deckParamProps}
                />
                <TRNParameter
                  name={telemetryRowLabel("Mesh euler yaw (ZYX)")}
                  value={formatDeg1(meshEulerDeg.yawDeg)}
                  unit=""
                  {...deckParamProps}
                />
              </>
            ) : null}
            <TRNParameter
              name={telemetryRowLabel("Quat spikes rejected (plot)")}
              value={
                spikeRejectedSinceReset > 0
                  ? String(Math.min(9999, spikeRejectedSinceReset))
                  : "0"
              }
              unit=""
              {...deckParamProps}
              className={`${deckParamProps.className} border-b-0`}
            />
          </div>
        </div>
      </TRNToolboxPanel>
    </>
  );
}
