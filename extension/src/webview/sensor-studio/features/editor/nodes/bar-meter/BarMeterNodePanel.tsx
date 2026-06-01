import { useLayoutEffect, useRef } from "react";
import {
  beginGaugeCanvasHealthStyle,
  endGaugeCanvasHealthStyle,
} from "../display/gauge-canvas-health";
import {
  prepareHiDpiCanvas2d,
  resolveStudioCanvasDpr,
} from "../display/canvas-hi-dpi";
import { useStudioCanvasDisplayScale } from "../display/studio-canvas-display-scale";
import type { SensorHealthStatus } from "../../store/flow-editor.store";
import {
  clampGaugeScalar,
  coerceBarMeterConfig,
  gaugeNeedleSmoothingSettled,
  gaugeZoneColor,
  stepGaugeNeedleSmoothing,
  type BarMeterConfig,
} from "../display/gauge-display-config";

function coerceConfig(dc: Record<string, unknown>): BarMeterConfig {
  return coerceBarMeterConfig(dc);
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  readoutValue: number | null,
  fillValue: number,
  peak: number,
  cfg: BarMeterConfig,
  sensorHealth?: SensorHealthStatus,
): void {
  const { min, max, unit, decimals, orientation, showPeakHold, zones } = cfg;
  const healthTone = beginGaugeCanvasHealthStyle(ctx, sensorHealth);
  ctx.clearRect(0, 0, w, h);

  const readoutClamped =
    readoutValue != null && Number.isFinite(readoutValue)
      ? Math.max(min, Math.min(max, readoutValue))
      : null;
  const fillClamped = Math.max(min, Math.min(max, fillValue));
  const norm = (x: number) => Math.max(0, Math.min(1, (x - min) / (max - min)));
  const fillT = norm(fillClamped);
  const peakT = norm(peak);

  const valStr =
    readoutClamped != null
      ? `${readoutClamped.toFixed(decimals)}${unit ? " " + unit : ""}`
      : "—";
  const labelH = 16;
  const pad = 5;

  const tx = pad;
  const ty = labelH + pad;
  const tw = w - pad * 2;
  const th = h - labelH - labelH - pad * 2;
  const barColor = gaugeZoneColor(zones, fillClamped, "#22d3ee");

  ctx.fillStyle = "rgba(39,39,42,0.9)";
  roundRect(ctx, tx, ty, tw, th, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(63,63,70,0.6)";
  ctx.lineWidth = 1;
  ctx.stroke();

  for (const z of zones) {
    const z0 = norm(z.from);
    const z1 = norm(z.to);
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, tx, ty, tw, th, 3);
    ctx.clip();
    ctx.fillStyle = z.color + "22";
    if (orientation === "vertical") {
      const zTop = ty + th * (1 - z1);
      const zBot = ty + th * (1 - z0);
      ctx.fillRect(tx, zTop, tw, zBot - zTop);
    } else {
      const zLeft = tx + tw * z0;
      const zRight = tx + tw * z1;
      ctx.fillRect(zLeft, ty, zRight - zLeft, th);
    }
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, tx, ty, tw, th, 3);
  ctx.clip();
  ctx.fillStyle = barColor;
  if (orientation === "vertical") {
    const fillH = th * fillT;
    ctx.fillRect(tx, ty + th - fillH, tw, fillH);
  } else {
    ctx.fillRect(tx, ty, tw * fillT, th);
  }
  ctx.restore();

  if (showPeakHold && peakT > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    if (orientation === "vertical") {
      const py = ty + th - th * peakT;
      ctx.fillRect(tx + 2, py - 1, tw - 4, 2);
    } else {
      const px = tx + tw * peakT;
      ctx.fillRect(px - 1, ty + 2, 2, th - 4);
    }
  }

  const majorCount = 4;
  ctx.strokeStyle = "rgba(82,82,91,0.7)";
  ctx.lineWidth = 0.8;
  ctx.font = `${Math.max(7, Math.round(Math.min(w, h) * 0.08))}px ui-monospace, monospace`;
  ctx.fillStyle = "rgba(113,113,122,0.9)";

  for (let i = 0; i <= majorCount; i++) {
    const frac = i / majorCount;
    const tv2 = min + frac * (max - min);
    const label = Number.isInteger(tv2) ? String(tv2) : tv2.toFixed(1);
    ctx.textAlign = orientation === "vertical" ? "right" : "center";
    ctx.textBaseline = orientation === "vertical" ? "middle" : "top";

    if (orientation === "vertical") {
      const tickY = ty + th - th * frac;
      ctx.beginPath();
      ctx.moveTo(tx + tw - 3, tickY);
      ctx.lineTo(tx + tw, tickY);
      ctx.stroke();
      ctx.fillText(label, tx + tw - 5, tickY);
    } else {
      const tickX = tx + tw * frac;
      ctx.beginPath();
      ctx.moveTo(tickX, ty + th);
      ctx.lineTo(tickX, ty + th + 3);
      ctx.stroke();
      ctx.fillText(label, tickX, ty + th + 4);
    }
  }

  ctx.font = `bold ${Math.max(9, Math.round(Math.min(w, h) * 0.09))}px ui-monospace, monospace`;
  ctx.fillStyle = gaugeZoneColor(
    zones,
    readoutClamped ?? fillClamped,
    "rgba(228,228,231,0.95)",
  );
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(valStr, w / 2, h - 1);
  endGaugeCanvasHealthStyle(ctx, healthTone);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

type Props = {
  className?: string;
  value: number | null;
  defaultConfig: Record<string, unknown>;
  sensorHealth?: SensorHealthStatus;
  displayScale?: number;
};

export function BarMeterNodePanel({
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

  const peakRef = useRef(coerceConfig(defaultConfig).min);
  const peakAgeRef = useRef(0);
  const smoothedRef = useRef<number | null>(null);
  const lastFrameMsRef = useRef(performance.now());
  const animRef = useRef<number>(0);

  const paintFrame = () => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) {
      return;
    }

    const cfg = coerceConfig(dataRef.current.defaultConfig);
    const readout = clampGaugeScalar(dataRef.current.value, cfg.min, cfg.max);
    const lo = Math.min(cfg.min, cfg.max);
    const target = readout ?? lo;
    if (smoothedRef.current == null) {
      smoothedRef.current = target;
    }

    const now = performance.now();
    const dt = Math.max(0, now - lastFrameMsRef.current);
    lastFrameMsRef.current = now;
    if (cfg.fillSmoothingMs > 0) {
      smoothedRef.current = stepGaugeNeedleSmoothing(
        smoothedRef.current,
        target,
        dt,
        cfg.fillSmoothingMs,
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

    const v = dataRef.current.value;
    if (v != null && Number.isFinite(v)) {
      const clamped = Math.max(cfg.min, Math.min(cfg.max, v));
      if (clamped >= peakRef.current) {
        peakRef.current = clamped;
        peakAgeRef.current = now;
      } else if (now - peakAgeRef.current > 2000) {
        const elapsed = (now - peakAgeRef.current - 2000) / 1000;
        peakRef.current = Math.max(
          clamped,
          peakRef.current - elapsed * (cfg.max - cfg.min) * 0.3,
        );
      }
    }

    draw(
      ctx,
      wCss,
      hCss,
      readout,
      smoothedRef.current,
      peakRef.current,
      cfg,
      dataRef.current.sensorHealth,
    );

    const settled = gaugeNeedleSmoothingSettled(
      smoothedRef.current,
      target,
      cfg.min,
      cfg.max,
    );
    if (cfg.fillSmoothingMs > 0 && !settled) {
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
      className={className ?? "relative box-border min-h-0 min-w-0 h-full w-full overflow-hidden"}
      style={{ minHeight: 80 }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full min-h-0 min-w-0"
        aria-hidden
      />
    </div>
  );
}
