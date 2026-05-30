import type { Project4TelemetrySnapshot } from "../../lib/project4-telemetry-types";

/** Normalize bar fill; matches PROJECT_INFO § Overlay — sensible HUD scale for ultrasonic cm. */
export const PROJECT4_DISTANCE_BAR_MAX_CM = 200;

/** Forward obstacle — amber bar when at or below this distance (cm). */
const DF_NEAR_WARNING_CM = 35;

function fmtMs(v: number): string {
  return v.toFixed(2);
}

function fmtDeg(v: number): string {
  return `${Math.round(v)}°`;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function fmtAccel(v: number): string {
  if (!Number.isFinite(v)) {
    return "—";
  }
  return v.toFixed(3);
}

type DistanceBarRowProps = {
  label: string;
  cm: number | null;
  variant: "front" | "rear";
  reverseSafetyStopCmDisplay: number;
};

function DistanceBarRow(props: DistanceBarRowProps) {
  const pct =
    props.cm == null ? 0 : clamp01(props.cm / PROJECT4_DISTANCE_BAR_MAX_CM) * 100;

  const rearWarn =
    props.variant === "rear" &&
    props.cm != null &&
    props.reverseSafetyStopCmDisplay > 0 &&
    props.cm > 0 &&
    props.cm <= props.reverseSafetyStopCmDisplay;

  const frontWarn =
    props.variant === "front" &&
    props.cm != null &&
    props.cm > 0 &&
    props.cm <= DF_NEAR_WARNING_CM;

  const barFill =
    rearWarn
      ? "bg-rose-500/85"
      : frontWarn
        ? "bg-amber-400/85"
        : props.variant === "front"
          ? "bg-emerald-500/78"
          : "bg-sky-500/78";

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-1.5 text-[9px] leading-none">
        <span className="shrink-0 text-zinc-500">{props.label}</span>
        <span className="tabular-nums text-zinc-100">{props.cm != null ? `${props.cm} cm` : "—"}</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/95 ring-1 ring-white/[0.06]"
        aria-hidden
      >
        <div
          className={`h-full rounded-full transition-[width] duration-150 ease-out ${barFill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export type TelemetryStripProps = {
  snapshot: Project4TelemetrySnapshot | null;
  scannerFrontMinDeg: number;
  scannerFrontMaxDeg: number;
  scannerRearMinDeg: number;
  scannerRearMaxDeg: number;
  scannerTelemetrySweepMinDeg: number;
  scannerTelemetrySweepMaxDeg: number;
  /** HUD parity with firmware reverse stop hint — tints **rear** (`db`) bar when inside this distance. */
  reverseSafetyStopCmDisplay: number;
};

export function TelemetryStrip(props: TelemetryStripProps) {
  const s = props.snapshot;

  return (
    <div className="flex max-w-[14rem] flex-col gap-2 px-0.5 py-0.5 font-mono text-[10px] text-zinc-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
      <div className="border-b border-white/10 pb-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
        Telemetry
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        <span className="text-zinc-500">FL</span>
        <span className="text-right text-zinc-100">{s != null ? fmtMs(s.vFL) : "—"}</span>
        <span className="text-zinc-500">FR</span>
        <span className="text-right text-zinc-100">{s != null ? fmtMs(s.vFR) : "—"}</span>
        <span className="text-zinc-500">RL</span>
        <span className="text-right text-zinc-100">{s != null ? fmtMs(s.vRL) : "—"}</span>
        <span className="text-zinc-500">RR</span>
        <span className="text-right text-zinc-100">{s != null ? fmtMs(s.vRR) : "—"}</span>
      </div>
      <div className="border-t border-white/10 pt-1 text-zinc-300">
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-col gap-0.5">
            <div>
              <span className="text-zinc-500">aF </span>
              <span className="text-zinc-200">{s != null ? fmtDeg(s.aFront) : "—"}</span>
            </div>
            <div className="pl-3 text-[8px] leading-snug text-zinc-600">
              twin {props.scannerFrontMinDeg}–{props.scannerFrontMaxDeg}° · MCU{" "}
              {props.scannerTelemetrySweepMinDeg}–{props.scannerTelemetrySweepMaxDeg}°
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div>
              <span className="text-zinc-500">aR </span>
              <span className="text-zinc-200">{s != null ? fmtDeg(s.aRear) : "—"}</span>
            </div>
            <div className="pl-3 text-[8px] leading-snug text-zinc-600">
              twin {props.scannerRearMinDeg}–{props.scannerRearMaxDeg}° · MCU{" "}
              {props.scannerTelemetrySweepMinDeg}–{props.scannerTelemetrySweepMaxDeg}°
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-white/10 pt-1.5">
        <DistanceBarRow
          label="df"
          cm={s?.df ?? null}
          variant="front"
          reverseSafetyStopCmDisplay={props.reverseSafetyStopCmDisplay}
        />
        <DistanceBarRow
          label="db"
          cm={s?.db ?? null}
          variant="rear"
          reverseSafetyStopCmDisplay={props.reverseSafetyStopCmDisplay}
        />
        <p className="text-[8px] leading-snug text-zinc-600">
          Bars 0–{PROJECT4_DISTANCE_BAR_MAX_CM} cm
          {props.reverseSafetyStopCmDisplay > 0 ? (
            <>
              {" "}
              · rear warn ≤ {props.reverseSafetyStopCmDisplay} cm
            </>
          ) : null}
        </p>
      </div>
      <details className="group border-t border-white/10 pt-1.5">
        <summary className="cursor-pointer select-none list-none text-[9px] font-semibold uppercase tracking-wide text-zinc-500 outline-none hover:text-zinc-400 [&::-webkit-details-marker]:hidden">
          <span className="mr-1 inline-block text-zinc-600 transition-transform group-open:rotate-90">
            ▸
          </span>
          IMU (m/s²)
        </summary>
        <div className="mt-1.5 grid grid-cols-[min-content_1fr] gap-x-2 gap-y-0.5 text-[10px] tabular-nums">
          <span className="text-zinc-500">ax</span>
          <span className="text-right text-zinc-100">{s != null ? fmtAccel(s.ax) : "—"}</span>
          <span className="text-zinc-500">ay</span>
          <span className="text-right text-zinc-100">{s != null ? fmtAccel(s.ay) : "—"}</span>
          <span className="text-zinc-500">az</span>
          <span className="text-right text-zinc-100">{s != null ? fmtAccel(s.az) : "—"}</span>
        </div>
      </details>
    </div>
  );
}
