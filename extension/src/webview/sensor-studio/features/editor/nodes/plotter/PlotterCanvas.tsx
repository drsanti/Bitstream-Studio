import { useLayoutEffect, useRef } from "react";
import type { PlotterChannelStyle, PlotterConfig } from "./plotter-config";

export type PlotterCanvasProps = {
  className?: string;
  histories: Record<string, number[]>;
  channelOrder: readonly string[];
  config: PlotterConfig;
};

function lineDash(style: PlotterChannelStyle["lineStyle"], lineWidth: number): number[] {
  switch (style) {
    case "dashed":
      return [Math.max(4, lineWidth * 4), Math.max(3, lineWidth * 3)];
    case "dotted":
      return [lineWidth, Math.max(3, lineWidth * 2)];
    default:
      return [];
  }
}

function drawMarkers(
  ctx: CanvasRenderingContext2D,
  xs: number[],
  ys: number[],
  style: PlotterChannelStyle["marker"],
  color: string,
  lineWidth: number,
): void {
  if (style === "none" || xs.length === 0) {
    return;
  }
  const r = Math.max(2, lineWidth * 1.6);
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, lineWidth * 0.75);
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i]!;
    const y = ys[i]!;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }
    if (style === "dots") {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const s = r * 0.9;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s);
      ctx.lineTo(x + s, y + s);
      ctx.moveTo(x - s, y + s);
      ctx.lineTo(x + s, y - s);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function legendBandPx(
  showLegend: boolean,
  channelOrder: readonly string[],
  channels: PlotterConfig["channels"],
  hCss: number,
): number {
  if (!showLegend) {
    return 0;
  }
  const anyVisible = channelOrder.some((id) => channels[id]?.visible === true);
  if (!anyVisible) {
    return 0;
  }
  return Math.min(28, Math.max(16, Math.round(hCss * 0.12)));
}

export function PlotterCanvas(props: PlotterCanvasProps) {
  const { className, histories, channelOrder, config } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef({ histories, channelOrder, config });
  dataRef.current = { histories, channelOrder, config };

  const rafRef = useRef<number>(0);

  const schedulePaintRef = useRef<() => void>(() => {});

  schedulePaintRef.current = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (wrap == null || canvas == null) {
        return;
      }

      const wCss = Math.max(1, wrap.clientWidth);
      const hCss = Math.max(1, wrap.clientHeight);
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(wCss * dpr);
      canvas.height = Math.round(hCss * dpr);
      canvas.style.removeProperty("width");
      canvas.style.removeProperty("height");

      const ctx = canvas.getContext("2d");
      if (ctx == null) {
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { histories: h, channelOrder: order, config: cfg } = dataRef.current;

      ctx.fillStyle = "rgba(9, 9, 11, 0.92)";
      ctx.fillRect(0, 0, wCss, hCss);

      const historyCap = cfg.historyLength;
      const series: { id: string; pts: number[]; sty: PlotterChannelStyle }[] = [];
      for (const id of order) {
        const sty = cfg.channels[id];
        if (sty == null || sty.visible !== true) {
          continue;
        }
        const raw = h[id] ?? [];
        const slice = raw.slice(-historyCap);
        series.push({ id, pts: slice, sty });
      }

      const legendBand = legendBandPx(cfg.showLegend, order, cfg.channels, hCss);
      const plotX = 0;
      const plotY = 0;
      const plotW = Math.max(1, wCss);
      const plotH = Math.max(1, hCss - legendBand);

      let y0 = cfg.yMin;
      let y1 = cfg.yMax;
      if (cfg.autoScale && series.length > 0) {
        let lo = Infinity;
        let hi = -Infinity;
        for (const s of series) {
          for (const v of s.pts) {
            if (!Number.isFinite(v)) {
              continue;
            }
            const t = v * cfg.verticalGain + cfg.verticalOffset;
            lo = Math.min(lo, t);
            hi = Math.max(hi, t);
          }
        }
        if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
          lo = -1;
          hi = 1;
        }
        if (Math.abs(hi - lo) < 1e-9) {
          lo -= 0.5;
          hi += 0.5;
        }
        const padY = (hi - lo) * 0.08;
        y0 = lo - padY;
        y1 = hi + padY;
      }

      if (cfg.showGrid) {
        ctx.strokeStyle = "rgba(63, 63, 70, 0.55)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        const tx = Math.max(2, Math.round(cfg.timeDivisions));
        const ay = Math.max(2, Math.round(cfg.ampDivisions));
        for (let i = 0; i <= tx; i++) {
          const x = plotX + (plotW * i) / tx;
          ctx.beginPath();
          ctx.moveTo(x, plotY);
          ctx.lineTo(x, plotY + plotH);
          ctx.stroke();
        }
        for (let j = 0; j <= ay; j++) {
          const y = plotY + (plotH * j) / ay;
          ctx.beginPath();
          ctx.moveTo(plotX, y);
          ctx.lineTo(plotX + plotW, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = "rgba(82, 82, 91, 0.85)";
      ctx.lineWidth = 1;
      ctx.strokeRect(plotX + 0.5, plotY + 0.5, plotW - 1, plotH - 1);

      const mapX = (i: number, len: number): number => {
        if (len <= 1) {
          return plotX + plotW / 2;
        }
        return plotX + (plotW * i) / (len - 1);
      };
      const mapY = (val: number): number => {
        const t = val * cfg.verticalGain + cfg.verticalOffset;
        const u = (t - y0) / (y1 - y0);
        return plotY + plotH * (1 - clamp01(u));
      };

      for (const s of series) {
        const pts = s.pts;
        const len = pts.length;
        if (len === 0) {
          continue;
        }
        const lw = s.sty.lineWidthPx;
        ctx.strokeStyle = s.sty.colorHex;
        ctx.lineWidth = lw;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.setLineDash(lineDash(s.sty.lineStyle, lw));

        let started = false;
        const mx: number[] = [];
        const my: number[] = [];
        const every = Math.max(1, Math.round(s.sty.markerEvery));

        for (let i = 0; i < len; i++) {
          const v = pts[i]!;
          if (!Number.isFinite(v)) {
            started = false;
            continue;
          }
          const x = mapX(i, len);
          const y = mapY(v);
          if (!started) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
          if (s.sty.marker !== "none" && i % every === 0) {
            mx.push(x);
            my.push(y);
          }
        }
        if (started) {
          ctx.stroke();
        }
        ctx.setLineDash([]);
        drawMarkers(ctx, mx, my, s.sty.marker, s.sty.colorHex, lw);
      }

      if (cfg.showLegend && series.length > 0 && legendBand > 0) {
        ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
        ctx.textBaseline = "middle";
        let lx = plotX + 4;
        const ly = plotH + legendBand / 2;
        for (const s of series) {
          const label = s.sty.label.trim().length > 0 ? s.sty.label : s.id;
          ctx.fillStyle = s.sty.colorHex;
          ctx.fillRect(lx, ly - 4, 10, 4);
          lx += 14;
          ctx.fillStyle = "rgba(228, 228, 231, 0.92)";
          const tw = ctx.measureText(label).width;
          ctx.fillText(label, lx, ly);
          lx += tw + 14;
          if (lx > plotX + plotW - 8) {
            break;
          }
        }
      }
    });
  };

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (wrap == null) {
      return;
    }
    const ro = new ResizeObserver(() => {
      schedulePaintRef.current();
    });
    ro.observe(wrap);
    schedulePaintRef.current();
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    schedulePaintRef.current();
  }, [histories, channelOrder, config]);

  const wrapClass =
    className ??
    "relative box-border min-h-0 min-w-0 h-full w-full flex-1 basis-0 overflow-hidden self-stretch";

  return (
    <div ref={wrapRef} className={wrapClass}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 box-border block h-full w-full min-h-0 min-w-0"
        aria-hidden
      />
    </div>
  );
}

function clamp01(u: number): number {
  return Math.min(1, Math.max(0, u));
}
