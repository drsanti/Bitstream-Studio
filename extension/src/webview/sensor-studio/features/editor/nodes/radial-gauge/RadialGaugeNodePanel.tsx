import { useLayoutEffect, useRef } from "react";
import {
  prepareHiDpiCanvas2d,
  resolveStudioCanvasDpr,
} from "../display/canvas-hi-dpi";
import { useStudioCanvasDisplayScale } from "../display/studio-canvas-display-scale";
import {
  beginGaugeCanvasHealthStyle,
  endGaugeCanvasHealthStyle,
} from "../display/gauge-canvas-health";
import type { SensorHealthStatus } from "../../store/flow-editor.store";
import {
  clampGaugeScalar,
  coerceRadialGaugeConfig,
  gaugeNeedleSmoothingSettled,
  gaugeZoneColor,
  radialGaugeArcGeometry,
  stepGaugeNeedleSmoothing,
  type RadialGaugeConfig,
} from "../display/gauge-display-config";

const DEG = Math.PI / 180;

function draw(
  ctx: CanvasRenderingContext2D,
  wCss: number,
  hCss: number,
  needleValue: number,
  readoutValue: number | null,
  cfg: RadialGaugeConfig,
  sensorHealth?: SensorHealthStatus,
): void {
  const {
    min,
    max,
    unit,
    decimals,
    zones,
    arcPreset,
    showFaceplate,
    showTrack,
    showTicks,
    showTickLabels,
    showNeedle,
    showDigitalValue,
    showUnit,
    showSetpoint,
    setpoint,
    setpointColor,
  } = cfg;
  const { startDeg, sweepDeg } = radialGaugeArcGeometry(arcPreset);
  const startRad = startDeg * DEG;
  const sweepRad = sweepDeg * DEG;
  const span = max - min;

  const cx = wCss / 2;
  const cy = hCss * 0.52;
  const r = Math.min(wCss, hCss) * 0.4;

  const healthTone = beginGaugeCanvasHealthStyle(ctx, sensorHealth);
  ctx.clearRect(0, 0, wCss, hCss);
  ctx.fillStyle = "rgba(9,9,11,0)";
  ctx.fillRect(0, 0, wCss, hCss);

  if (showFaceplate) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(24,24,27,0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(63,63,70,0.8)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (Math.abs(span) > Number.EPSILON) {
    for (const z of zones) {
      const t0 = (z.from - min) / span;
      const t1 = (z.to - min) / span;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.8, startRad + t0 * sweepRad, startRad + t1 * sweepRad);
      ctx.strokeStyle = z.color;
      ctx.lineWidth = r * 0.09;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  if (showTrack) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, startRad, startRad + sweepRad);
    ctx.strokeStyle = "rgba(63,63,70,0.5)";
    ctx.lineWidth = 1;
    ctx.lineCap = "butt";
    ctx.stroke();
  }

  if (
    showSetpoint &&
    Number.isFinite(setpoint) &&
    Math.abs(span) > Number.EPSILON
  ) {
    const spT = Math.max(0, Math.min(1, (setpoint - min) / span));
    const spAngle = startRad + spT * sweepRad;
    const spCos = Math.cos(spAngle);
    const spSin = Math.sin(spAngle);
    ctx.beginPath();
    ctx.moveTo(cx + spCos * r * 0.7, cy + spSin * r * 0.7);
    ctx.lineTo(cx + spCos * r * 0.95, cy + spSin * r * 0.95);
    ctx.strokeStyle = setpointColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + spCos * r * 0.95, cy + spSin * r * 0.95, r * 0.028, 0, 2 * Math.PI);
    ctx.fillStyle = setpointColor;
    ctx.fill();
  }

  const majorCount = 5;
  if (showTicks || showTickLabels) {
    ctx.font = `${Math.round(Math.min(r * 0.16, 10))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= majorCount; i++) {
      const angle = startRad + (i / majorCount) * sweepRad;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      if (showTicks) {
        ctx.beginPath();
        ctx.moveTo(cx + cos * r * 0.79, cy + sin * r * 0.79);
        ctx.lineTo(cx + cos * r * 0.92, cy + sin * r * 0.92);
        ctx.strokeStyle = "rgba(161,161,170,0.7)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      if (showTickLabels && Math.abs(span) > Number.EPSILON) {
        const tv = min + (i / majorCount) * span;
        ctx.fillStyle = "rgba(161,161,170,0.75)";
        ctx.fillText(
          Number.isInteger(tv) ? String(tv) : tv.toFixed(1),
          cx + cos * r * 0.63,
          cy + sin * r * 0.63,
        );
      }

      if (showTicks) {
        for (let j = 1; j <= 4; j++) {
          const mAngle = startRad + ((i + j / 5) / majorCount) * sweepRad;
          if (i === majorCount) {
            break;
          }
          const mc = Math.cos(mAngle);
          const ms = Math.sin(mAngle);
          ctx.beginPath();
          ctx.moveTo(cx + mc * r * 0.87, cy + ms * r * 0.87);
          ctx.lineTo(cx + mc * r * 0.92, cy + ms * r * 0.92);
          ctx.strokeStyle = "rgba(82,82,91,0.7)";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  const v = needleValue;
  const t = Math.abs(span) > Number.EPSILON ? (v - min) / span : 0;
  const needleAngle = startRad + t * sweepRad;
  const nColor = gaugeZoneColor(zones, v, "#22d3ee");

  if (showNeedle) {
    const nLen = r * 0.74;
    const nBack = r * 0.16;
    const nc = Math.cos(needleAngle);
    const ns = Math.sin(needleAngle);
    const bc = Math.cos(needleAngle + Math.PI);
    const bs = Math.sin(needleAngle + Math.PI);

    ctx.beginPath();
    ctx.moveTo(cx + bc * nBack, cy + bs * nBack);
    ctx.lineTo(cx + nc * nLen, cy + ns * nLen);
    ctx.strokeStyle = nColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineCap = "butt";

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.07, 0, 2 * Math.PI);
    ctx.fillStyle = nColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.035, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(24,24,27,1)";
    ctx.fill();
  }

  if (showDigitalValue || (showUnit && unit.length > 0)) {
    const valStr =
      readoutValue != null && Number.isFinite(readoutValue)
        ? readoutValue.toFixed(decimals)
        : "—";
    const valueY = cy - r * 0.3;
    const unitY = cy + r * 0.26;
    const maxReadoutWidth = wCss * 0.72;
    let valueFontSize = Math.round(r * 0.12);
    const unitFontSize = Math.round(r * 0.13);
    const valueColor = gaugeZoneColor(
      zones,
      readoutValue ?? v,
      "rgba(228,228,231,0.95)",
    );
    const unitColor = "rgba(161,161,170,0.85)";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (showDigitalValue) {
      ctx.font = `bold ${valueFontSize}px ui-monospace, monospace`;
      while (ctx.measureText(valStr).width > maxReadoutWidth && valueFontSize > 10) {
        valueFontSize = Math.max(10, Math.round(valueFontSize * 0.9));
        ctx.font = `bold ${valueFontSize}px ui-monospace, monospace`;
      }
      ctx.fillStyle = valueColor;
      ctx.fillText(valStr, cx, valueY);
    }

    if (showUnit && unit.length > 0) {
      ctx.font = `${unitFontSize}px ui-monospace, monospace`;
      ctx.fillStyle = unitColor;
      ctx.fillText(unit, cx, unitY);
    }
  }
  endGaugeCanvasHealthStyle(ctx, healthTone);
}

type Props = {
  className?: string;
  value: number | null;
  defaultConfig: Record<string, unknown>;
  sensorHealth?: SensorHealthStatus;
  /** React Flow viewport zoom on the canvas; omit (1) in the inspector preview. */
  displayScale?: number;
};

export function RadialGaugeNodePanel({
  className,
  value,
  defaultConfig,
  sensorHealth,
  displayScale: displayScaleOverride,
}: Props) {
  const displayScale = useStudioCanvasDisplayScale(displayScaleOverride);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef({ value, defaultConfig, displayScale, sensorHealth });
  dataRef.current = { value, defaultConfig, displayScale, sensorHealth };

  const smoothedRef = useRef<number | null>(null);
  const lastFrameMsRef = useRef(performance.now());
  const animRef = useRef<number>(0);

  const paintFrame = () => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) {
      return;
    }
    const cfg = coerceRadialGaugeConfig(dataRef.current.defaultConfig);
    const readout = clampGaugeScalar(dataRef.current.value, cfg.min, cfg.max);
    const lo = Math.min(cfg.min, cfg.max);
    const target = readout ?? lo;
    if (smoothedRef.current == null) {
      smoothedRef.current = target;
    }

    const now = performance.now();
    const dt = Math.max(0, now - lastFrameMsRef.current);
    lastFrameMsRef.current = now;
    if (cfg.needleSmoothingMs > 0) {
      smoothedRef.current = stepGaugeNeedleSmoothing(
        smoothedRef.current,
        target,
        dt,
        cfg.needleSmoothingMs,
      );
    } else {
      smoothedRef.current = target;
    }

    const wCss = Math.max(1, wrap.clientWidth);
    const hCss = Math.max(1, wrap.clientHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const dpr = resolveStudioCanvasDpr(dataRef.current.displayScale);
    prepareHiDpiCanvas2d(canvas, ctx, wCss, hCss, dpr);
    draw(ctx, wCss, hCss, smoothedRef.current, readout, cfg, dataRef.current.sensorHealth);

    const settled = gaugeNeedleSmoothingSettled(
      smoothedRef.current,
      target,
      cfg.min,
      cfg.max,
    );
    if (cfg.needleSmoothingMs > 0 && !settled) {
      animRef.current = requestAnimationFrame(paintFrame);
    }
  };

  const schedulePaintRef = useRef<() => void>(() => {});
  schedulePaintRef.current = () => {
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(paintFrame);
  };

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const ro = new ResizeObserver(() => schedulePaintRef.current());
    ro.observe(wrap);
    schedulePaintRef.current();
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    smoothedRef.current = null;
    lastFrameMsRef.current = performance.now();
    schedulePaintRef.current();
  }, [value, defaultConfig, displayScale, sensorHealth]);

  return (
    <div
      ref={wrapRef}
      className={
        className ??
        "relative box-border min-h-0 min-w-0 h-full w-full overflow-hidden"
      }
      style={className != null ? undefined : { minHeight: 120 }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full min-h-0 min-w-0"
        aria-hidden
      />
    </div>
  );
}
