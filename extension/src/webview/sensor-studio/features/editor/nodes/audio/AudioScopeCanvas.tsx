import { useLayoutEffect, useMemo, useRef } from "react";
import { studioAudioRuntime } from "../../../../core/audio/studio-audio-runtime";
import {
  prepareHiDpiCanvas2d,
  resolveStudioCanvasDpr,
} from "../display/canvas-hi-dpi";
import { useStudioCanvasDisplayScale } from "../display/studio-canvas-display-scale";
import {
  coerceAudioScopeDisplayConfig,
  hexColorWithAlpha,
  type AudioScopeDisplayConfig,
} from "./audio-scope-display-config";

export type AudioScopeCanvasProps = {
  className?: string;
  enabled: boolean;
  mode: string;
  fps: number;
  fftSize: number;
  smoothing: number;
  sourceNodeId: string | null;
  sourceKind: "mic" | "osc" | "file" | "sfx" | "machine" | "unknown";
  display?: AudioScopeDisplayConfig;
  displayConfig?: Record<string, unknown>;
  displayScale?: number;
};

type ScopePaintState = Omit<AudioScopeCanvasProps, "display" | "displayConfig"> & {
  display: AudioScopeDisplayConfig;
  displayScale: number;
};

function drawScopeGrid(
  ctx: CanvasRenderingContext2D,
  plotX: number,
  plotY: number,
  plotW: number,
  plotH: number,
  timeDivisions: number,
): void {
  ctx.strokeStyle = "rgba(63, 63, 70, 0.55)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  const tx = Math.max(2, Math.round(timeDivisions));
  for (let i = 0; i <= tx; i += 1) {
    const x = plotX + (plotW * i) / tx;
    ctx.beginPath();
    ctx.moveTo(x, plotY);
    ctx.lineTo(x, plotY + plotH);
    ctx.stroke();
  }
  const ty = 4;
  for (let j = 0; j <= ty; j += 1) {
    const y = plotY + (plotH * j) / ty;
    ctx.beginPath();
    ctx.moveTo(plotX, y);
    ctx.lineTo(plotX + plotW, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawScopeFrame(ctx: CanvasRenderingContext2D, wCss: number, hCss: number, state: ScopePaintState): void {
  const display = state.display;
  ctx.fillStyle = hexColorWithAlpha(display.plotBackgroundHex, 1);
  ctx.fillRect(0, 0, wCss, hCss);

  if (!state.enabled) {
    ctx.fillStyle = "rgba(161,161,170,0.65)";
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("Display off", 8, 14);
    return;
  }

  if (state.sourceNodeId == null) {
    ctx.fillStyle = "rgba(161,161,170,0.65)";
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("Wire Audio or enable Monitor mode", 8, 14);
    return;
  }

  const buffers =
    state.sourceKind === "mic"
      ? (studioAudioRuntime.setMicAnalyserSettings(state.sourceNodeId, {
          fftSize: state.fftSize,
          smoothing: state.smoothing,
        }),
        studioAudioRuntime.readMicBuffers(state.sourceNodeId))
      : state.sourceKind === "osc"
        ? (studioAudioRuntime.setOscillatorAnalyserSettings(state.sourceNodeId, {
            fftSize: state.fftSize,
            smoothing: state.smoothing,
          }),
          studioAudioRuntime.readOscillatorBuffers(state.sourceNodeId))
        : state.sourceKind === "file"
          ? (studioAudioRuntime.setFilePlayerAnalyserSettings(state.sourceNodeId, {
              fftSize: state.fftSize,
              smoothing: state.smoothing,
            }),
            studioAudioRuntime.readFilePlayerBuffers(state.sourceNodeId))
          : state.sourceKind === "sfx"
            ? (studioAudioRuntime.setSfxAnalyserSettings(state.sourceNodeId, {
                fftSize: state.fftSize,
                smoothing: state.smoothing,
              }),
              studioAudioRuntime.readSfxBuffers(state.sourceNodeId))
            : state.sourceKind === "machine"
              ? (studioAudioRuntime.setMachineAnalyserSettings(state.sourceNodeId, {
                  fftSize: state.fftSize,
                  smoothing: state.smoothing,
                }),
                studioAudioRuntime.readMachineBuffers(state.sourceNodeId))
              : (studioAudioRuntime.setMasterAnalyserSettings({
              fftSize: state.fftSize,
              smoothing: state.smoothing,
            }),
            studioAudioRuntime.readMasterBuffers());

  if (buffers == null) {
    ctx.fillStyle = "rgba(161,161,170,0.65)";
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(
      state.sourceKind === "mic"
        ? "Mic inactive"
        : state.sourceKind === "osc"
          ? "Osc inactive"
          : state.sourceKind === "file"
            ? "File inactive"
            : state.sourceKind === "sfx"
              ? "SFX idle — fire Trigger"
              : state.sourceKind === "machine"
                ? "Machine inactive"
                : "Audio inactive",
      8,
      14,
    );
    return;
  }

  const plotX = 0;
  const plotY = 0;
  const plotW = Math.max(1, wCss);
  const plotH = Math.max(1, hCss);

  if (display.showGrid) {
    drawScopeGrid(ctx, plotX, plotY, plotW, plotH, display.timeDivisions);
  }

  if (display.showCenterLine) {
    ctx.strokeStyle = "rgba(82, 82, 91, 0.65)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX, plotY + plotH / 2);
    ctx.lineTo(plotX + plotW, plotY + plotH / 2);
    ctx.stroke();
  }

  if (display.showFrame) {
    ctx.strokeStyle = "rgba(82, 82, 91, 0.85)";
    ctx.lineWidth = 1;
    ctx.strokeRect(plotX + 0.5, plotY + 0.5, plotW - 1, plotH - 1);
  }

  const barCount = Math.max(16, Math.min(128, Math.round(display.freqBarCount)));

  if (state.mode === "spectrum" || state.mode === "both") {
    const data = buffers.freq;
    const n = data.length;
    const barW = Math.max(1, Math.floor(plotW / Math.max(1, Math.min(n, barCount))));
    const fill = hexColorWithAlpha(display.spectrumColorHex, display.spectrumFillOpacity);
    for (let i = 0; i < barCount; i += 1) {
      const idx = Math.floor((i / barCount) * n);
      const v = (data[idx] / 255) * display.spectrumGain;
      const bh = Math.max(1, Math.round(Math.min(1, v) * (plotH - 6)));
      const x = plotX + i * barW;
      ctx.fillStyle = fill;
      ctx.fillRect(x, plotY + plotH - bh, Math.max(1, barW - 1), bh);
    }
  }

  if (state.mode === "waveform" || state.mode === "both") {
    const data = buffers.time;
    ctx.lineWidth = display.waveformLineWidthPx;
    ctx.strokeStyle = hexColorWithAlpha(
      display.waveformColorHex,
      display.waveformStrokeOpacity,
    );
    ctx.beginPath();
    for (let i = 0; i < data.length; i += 1) {
      const x = plotX + (plotW * i) / Math.max(1, data.length - 1);
      const v = ((data[i] - 128) / 128) * display.waveformGain;
      const clamped = Math.max(-1.2, Math.min(1.2, v));
      const y = plotY + plotH / 2 - clamped * (plotH * 0.42);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
}

export function AudioScopeCanvas(props: AudioScopeCanvasProps) {
  const {
    className,
    enabled,
    mode,
    fps,
    fftSize,
    smoothing,
    sourceNodeId,
    sourceKind,
    display,
    displayConfig,
    displayScale: displayScaleOverride,
  } = props;
  const displayScale = useStudioCanvasDisplayScale(displayScaleOverride);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolvedDisplay = useMemo(
    () => display ?? coerceAudioScopeDisplayConfig(displayConfig),
    [display, displayConfig],
  );
  const dataRef = useRef<ScopePaintState>({
    enabled,
    mode,
    fps,
    fftSize,
    smoothing,
    sourceNodeId,
    sourceKind,
    display: resolvedDisplay,
    displayScale,
  });
  dataRef.current = {
    enabled,
    mode,
    fps,
    fftSize,
    smoothing,
    sourceNodeId,
    sourceKind,
    display: resolvedDisplay,
    displayScale,
  };

  const rafRef = useRef(0);
  const lastPaintRef = useRef(0);
  const paintRef = useRef<() => void>(() => {});

  paintRef.current = () => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (wrap == null || canvas == null) {
      return;
    }
    const wCss = Math.max(1, wrap.clientWidth);
    const hCss = Math.max(1, wrap.clientHeight);
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      return;
    }
    const dpr = resolveStudioCanvasDpr(dataRef.current.displayScale);
    prepareHiDpiCanvas2d(canvas, ctx, wCss, hCss, dpr);
    drawScopeFrame(ctx, wCss, hCss, dataRef.current);
  };

  useLayoutEffect(() => {
    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const { enabled: on, fps: rate } = dataRef.current;
      if (!on) {
        paintRef.current();
        return;
      }
      if (ts - (lastPaintRef.current || 0) < 1000 / rate) {
        return;
      }
      lastPaintRef.current = ts;
      paintRef.current();
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (wrap == null) {
      return;
    }
    const ro = new ResizeObserver(() => {
      paintRef.current();
    });
    ro.observe(wrap);
    paintRef.current();
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    paintRef.current();
  }, [
    enabled,
    mode,
    fps,
    fftSize,
    smoothing,
    sourceNodeId,
    sourceKind,
    resolvedDisplay,
    displayScale,
  ]);

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
