import { useLayoutEffect, useRef } from "react";

type Zone = { from: number; to: number; color: string };

type BarMeterConfig = {
  min: number;
  max: number;
  unit: string;
  decimals: number;
  orientation: "vertical" | "horizontal";
  showPeakHold: boolean;
  zones: Zone[];
};

function coerceConfig(dc: Record<string, unknown>): BarMeterConfig {
  return {
    min: typeof dc.min === "number" ? dc.min : 0,
    max: typeof dc.max === "number" ? dc.max : 100,
    unit: typeof dc.unit === "string" ? dc.unit : "",
    decimals: typeof dc.decimals === "number" ? Math.max(0, Math.min(4, Math.round(dc.decimals))) : 1,
    orientation: dc.orientation === "horizontal" ? "horizontal" : "vertical",
    showPeakHold: dc.showPeakHold !== false,
    zones: Array.isArray(dc.zones)
      ? (dc.zones as Zone[]).filter(
          (z) => typeof z?.from === "number" && typeof z?.to === "number" && typeof z?.color === "string",
        )
      : [],
  };
}

function zoneColor(zones: Zone[], value: number, fallback: string): string {
  let c = fallback;
  for (const z of zones) {
    if (value >= z.from && value <= z.to) c = z.color;
  }
  return c;
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  value: number | null,
  peak: number,
  cfg: BarMeterConfig,
): void {
  const { min, max, unit, decimals, orientation, showPeakHold, zones } = cfg;
  ctx.clearRect(0, 0, w, h);

  const v = value != null && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
  const norm = (x: number) => Math.max(0, Math.min(1, (x - min) / (max - min)));
  const fillT = norm(v);
  const peakT = norm(peak);

  const valStr = value != null && Number.isFinite(value) ? `${v.toFixed(decimals)}${unit ? " " + unit : ""}` : "—";
  const labelH = 16;
  const pad = 5;

  const tx = pad;
  const ty = labelH + pad;
  const tw = w - pad * 2;
  const th = h - labelH - labelH - pad * 2;
  const barColor = zoneColor(zones, v, "#22d3ee");

  // track bg
  ctx.fillStyle = "rgba(39,39,42,0.9)";
  roundRect(ctx, tx, ty, tw, th, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(63,63,70,0.6)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // zone backgrounds
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

  // fill bar
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

  // peak hold marker
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

  // tick marks
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

  // value readout
  ctx.font = `bold ${Math.max(9, Math.round(Math.min(w, h) * 0.09))}px ui-monospace, monospace`;
  ctx.fillStyle = zoneColor(zones, v, "rgba(228,228,231,0.95)");
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(valStr, w / 2, h - 1);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

type Props = {
  className?: string;
  value: number | null;
  defaultConfig: Record<string, unknown>;
};

export function BarMeterNodePanel({ className, value, defaultConfig }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef({ value, defaultConfig });
  dataRef.current = { value, defaultConfig };

  const peakRef = useRef(coerceConfig(defaultConfig).min);
  const peakAgeRef = useRef(0);

  const rafRef = useRef<number>(0);
  const schedulePaintRef = useRef<() => void>(() => {});

  schedulePaintRef.current = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;
      const wCss = Math.max(1, wrap.clientWidth);
      const hCss = Math.max(1, wrap.clientHeight);
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(wCss * dpr);
      canvas.height = Math.round(hCss * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cfg = coerceConfig(dataRef.current.defaultConfig);
      const v = dataRef.current.value;
      const now = performance.now();

      if (v != null && Number.isFinite(v)) {
        const clamped = Math.max(cfg.min, Math.min(cfg.max, v));
        if (clamped >= peakRef.current) {
          peakRef.current = clamped;
          peakAgeRef.current = now;
        } else if (now - peakAgeRef.current > 2000) {
          const elapsed = (now - peakAgeRef.current - 2000) / 1000;
          peakRef.current = Math.max(clamped, peakRef.current - elapsed * (cfg.max - cfg.min) * 0.3);
        }
      }

      draw(ctx, wCss, hCss, v, peakRef.current, cfg);
    });
  };

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => schedulePaintRef.current());
    ro.observe(wrap);
    schedulePaintRef.current();
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  useLayoutEffect(() => { schedulePaintRef.current(); }, [value, defaultConfig]);

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
