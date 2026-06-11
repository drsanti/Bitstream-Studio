/**
 * Gauge.jsx — Reusable animated canvas gauge component
 *
 * Props:
 *   value   {number}  Current value to display
 *   config  {object}  Partial config — merged with DEFAULT_CONFIG
 *
 * Usage:
 *   import Gauge, { DEFAULT_CONFIG, PRESETS } from './Gauge';
 *   <Gauge value={12.5} config={{ unit: 'PSI', maxValue: 100 }} />
 */

import React, { useRef, useEffect } from 'react';

const DEG = Math.PI / 180;

/* ─────────────────────────────────────────────────────────────────
   DEFAULT CONFIG
───────────────────────────────────────────────────────────────── */
export const DEFAULT_CONFIG = {
  // ── Structure ──
  size:             300,    // canvas width (height auto = size + pipe)
  sweepAngle:       270,    // total arc sweep in degrees
  startAngle:       135,    // start angle in canvas degrees (0=right, CW)
  arcRadiusRatio:   0.72,   // arc radius as fraction of face radius
  arcThickness:     14,     // arc stroke width px

  // ── Scale ──
  minValue:         0,
  maxValue:         30,
  unit:             'kPa',
  majorTickInterval: 5,
  minorTickInterval: 1,
  decimalPlaces:    1,

  // ── Color zones ──
  zones: [
    { from:  0, to:  5, color: '#2255dd' },
    { from:  5, to: 10, color: '#1199cc' },
    { from: 10, to: 15, color: '#33bb55' },
    { from: 15, to: 20, color: '#99cc22' },
    { from: 20, to: 25, color: '#ffaa00' },
    { from: 25, to: 30, color: '#ee5500' },
  ],

  // ── Ticks ──
  showMajorTicks:   true,
  showMinorTicks:   true,
  majorTickLength:  16,
  minorTickLength:  8,
  majorTickWidth:   2,
  minorTickWidth:   0.9,
  tickColor:        '#1a1a1a',

  // ── Labels ──
  showLabels:       true,
  labelFontSize:    13,
  labelColor:       '#1a1a1a',
  labelOffset:      16,     // px inward from inner arc edge
  fontFamily:       'system-ui, -apple-system, sans-serif',

  // ── Needle ──
  needleStyle:      'tapered',  // 'tapered' | 'line' | 'arrow'
  needleColor:      '#1a1a1a',
  needleTailLength: 22,
  needleShadow:     true,

  // ── Center hub ──
  hubRadius:        12,
  hubOuterColor:    '#cccccc',
  hubInnerColor:    '#f5f5f5',
  hubDotColor:      '#444444',

  // ── Face & bezel ──
  faceColor:        '#f8f9fa',
  bezelColor:       '#111111',
  bezelWidth:       10,
  glare:            true,

  // ── Text ──
  title:            '',
  showValue:        false,
  unitColor:        '#444444',

  // ── Pipe fitting ──
  showPipe:         true,

  // ── Animation ──
  animated:         true,
  animDuration:     500,    // ms
};

/* ─────────────────────────────────────────────────────────────────
   PRESET THEMES  (partial configs — merged over DEFAULT_CONFIG)
───────────────────────────────────────────────────────────────── */
export const PRESETS = {
  default: {
    faceColor: '#f8f9fa', bezelColor: '#111111',
    tickColor: '#1a1a1a', labelColor: '#1a1a1a', unitColor: '#444444',
    needleColor: '#1a1a1a', hubOuterColor: '#cccccc', hubInnerColor: '#f5f5f5', hubDotColor: '#444444',
    zones: [
      { from:  0, to:  5, color: '#2255dd' },
      { from:  5, to: 10, color: '#1199cc' },
      { from: 10, to: 15, color: '#33bb55' },
      { from: 15, to: 20, color: '#99cc22' },
      { from: 20, to: 25, color: '#ffaa00' },
      { from: 25, to: 30, color: '#ee5500' },
    ],
  },
  industrial: {
    faceColor: '#f2ede4', bezelColor: '#2e1e0e',
    tickColor: '#3a2810', labelColor: '#3a2810', unitColor: '#6a4828',
    needleColor: '#2e1e0e', hubOuterColor: '#b07040', hubInnerColor: '#e8d0b0', hubDotColor: '#3a2810',
    zones: [
      { from:  0, to: 10, color: '#ccaa44' },
      { from: 10, to: 18, color: '#dd8822' },
      { from: 18, to: 25, color: '#cc5511' },
      { from: 25, to: 30, color: '#992200' },
    ],
  },
  medical: {
    faceColor: '#eef6ff', bezelColor: '#1a3a5a',
    tickColor: '#1a3a5a', labelColor: '#1a3a5a', unitColor: '#2a5a8a',
    needleColor: '#1a3a5a', hubOuterColor: '#6699cc', hubInnerColor: '#ddeeff', hubDotColor: '#1a3a5a',
    zones: [
      { from:  0, to: 10, color: '#2299cc' },
      { from: 10, to: 22, color: '#22aa77' },
      { from: 22, to: 28, color: '#ffaa00' },
      { from: 28, to: 30, color: '#ee3333' },
    ],
  },
  dark: {
    faceColor: '#141820', bezelColor: '#0a0d12',
    tickColor: '#8899bb', labelColor: '#8899bb', unitColor: '#6677aa',
    needleColor: '#eef0f4', hubOuterColor: '#2a3040', hubInnerColor: '#1e2438', hubDotColor: '#8899bb',
    zones: [
      { from:  0, to:  8, color: '#1155ee' },
      { from:  8, to: 18, color: '#11aaaa' },
      { from: 18, to: 25, color: '#eeaa22' },
      { from: 25, to: 30, color: '#ee3311' },
    ],
  },
  minimal: {
    faceColor: '#ffffff', bezelColor: '#333333',
    tickColor: '#333333', labelColor: '#333333', unitColor: '#666666',
    needleColor: '#333333', hubOuterColor: '#999999', hubInnerColor: '#ffffff', hubDotColor: '#333333',
    zones: [
      { from: 0, to: 30, color: '#cccccc' },
    ],
  },
};

/* ─────────────────────────────────────────────────────────────────
   DRAW — pure function, no React
───────────────────────────────────────────────────────────────── */
function draw(canvas, displayValue, cfg) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const { size, showPipe, bezelWidth } = cfg;
  const pipeH = showPipe ? Math.round(size * 0.22) : 0;
  const W = size;
  const H = size + pipeH;

  // Sync canvas resolution to device pixel ratio
  if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const CX  = W / 2;
  const CY  = W / 2;
  const FR  = W * 0.46;                        // face radius
  const AR  = FR * cfg.arcRadiusRatio;          // arc centerline radius
  const AW  = cfg.arcThickness;
  const startRad = cfg.startAngle * DEG;
  const sweepRad = cfg.sweepAngle * DEG;

  const valToAngle = v =>
    startRad + ((v - cfg.minValue) / (cfg.maxValue - cfg.minValue)) * sweepRad;

  const polar = (r, a) => [CX + Math.cos(a) * r, CY + Math.sin(a) * r];

  /* ── Pipe fitting ── */
  if (showPipe) {
    const pw  = size * 0.155;
    const ph  = pipeH;
    const nh  = ph * 0.38;
    const nw  = size * 0.24;
    const py0 = CY + FR - bezelWidth * 0.5;

    // Shaft
    ctx.fillStyle = '#b8b8b8';
    ctx.fillRect(CX - pw / 2, py0, pw, ph - nh);

    // Hex nut
    const ny = py0 + ph - nh;
    ctx.beginPath();
    ctx.moveTo(CX - pw / 2, ny);
    ctx.lineTo(CX - nw / 2, ny + nh * 0.28);
    ctx.lineTo(CX - nw / 2, ny + nh * 0.72);
    ctx.lineTo(CX - pw / 2, ny + nh);
    ctx.lineTo(CX + pw / 2, ny + nh);
    ctx.lineTo(CX + nw / 2, ny + nh * 0.72);
    ctx.lineTo(CX + nw / 2, ny + nh * 0.28);
    ctx.lineTo(CX + pw / 2, ny);
    ctx.closePath();
    ctx.fillStyle = '#c8c8c8';
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Nut groove lines
    for (let i = 1; i < 5; i++) {
      const gx = CX - nw / 2 + i * (nw / 5);
      ctx.beginPath();
      ctx.moveTo(gx, ny + 3);
      ctx.lineTo(gx, ny + nh - 3);
      ctx.strokeStyle = 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }

  /* ── Bezel ── */
  ctx.beginPath();
  ctx.arc(CX, CY, FR, 0, Math.PI * 2);
  ctx.fillStyle = cfg.bezelColor;
  ctx.fill();

  /* ── Face ── */
  ctx.beginPath();
  ctx.arc(CX, CY, FR - bezelWidth, 0, Math.PI * 2);
  ctx.fillStyle = cfg.faceColor;
  ctx.fill();

  /* ── Color zones ── */
  ctx.lineCap = 'butt';
  cfg.zones.forEach(z => {
    const a1 = valToAngle(Math.max(cfg.minValue, z.from));
    const a2 = valToAngle(Math.min(cfg.maxValue, z.to));
    if (a2 <= a1) return;
    ctx.beginPath();
    ctx.arc(CX, CY, AR, a1, a2, false);
    ctx.strokeStyle = z.color;
    ctx.lineWidth   = AW;
    ctx.stroke();
  });

  /* ── Ticks ── */
  const outerR = AR + AW / 2 + 4;

  if (cfg.showMinorTicks) {
    const steps = Math.round((cfg.maxValue - cfg.minValue) / cfg.minorTickInterval);
    for (let i = 0; i <= steps; i++) {
      const v = cfg.minValue + i * cfg.minorTickInterval;
      if ((v - cfg.minValue) % cfg.majorTickInterval === 0) continue;
      const a = valToAngle(v);
      ctx.beginPath();
      ctx.moveTo(...polar(outerR, a));
      ctx.lineTo(...polar(outerR - cfg.minorTickLength, a));
      ctx.strokeStyle = cfg.tickColor;
      ctx.lineWidth   = cfg.minorTickWidth;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }
  }

  if (cfg.showMajorTicks) {
    const steps = Math.round((cfg.maxValue - cfg.minValue) / cfg.majorTickInterval);
    for (let i = 0; i <= steps; i++) {
      const v = cfg.minValue + i * cfg.majorTickInterval;
      const a = valToAngle(v);
      ctx.beginPath();
      ctx.moveTo(...polar(outerR, a));
      ctx.lineTo(...polar(outerR - cfg.majorTickLength, a));
      ctx.strokeStyle = cfg.tickColor;
      ctx.lineWidth   = cfg.majorTickWidth;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }
  }

  /* ── Labels ── */
  if (cfg.showLabels) {
    const labelR = AR - AW / 2 - cfg.labelOffset;
    const steps  = Math.round((cfg.maxValue - cfg.minValue) / cfg.majorTickInterval);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = cfg.labelColor;
    ctx.font         = `bold ${cfg.labelFontSize}px ${cfg.fontFamily}`;
    for (let i = 0; i <= steps; i++) {
      const v = cfg.minValue + i * cfg.majorTickInterval;
      ctx.fillText(v, ...polar(labelR, valToAngle(v)));
    }
  }

  /* ── Unit label ── */
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = cfg.unitColor;
  ctx.font         = `bold ${cfg.labelFontSize + 2}px ${cfg.fontFamily}`;
  ctx.fillText(cfg.unit, CX, CY + AR * 0.44);

  /* ── Title ── */
  if (cfg.title) {
    ctx.fillStyle = cfg.unitColor;
    ctx.font      = `${cfg.labelFontSize}px ${cfg.fontFamily}`;
    ctx.fillText(cfg.title, CX, CY - AR * 0.55);
  }

  /* ── Value on face ── */
  if (cfg.showValue) {
    ctx.fillStyle = cfg.labelColor;
    ctx.font      = `bold ${cfg.labelFontSize + 3}px ${cfg.fontFamily}`;
    ctx.fillText(displayValue.toFixed(cfg.decimalPlaces), CX, CY + AR * 0.18);
  }

  /* ── Needle ── */
  const clamped     = Math.max(cfg.minValue, Math.min(cfg.maxValue, displayValue));
  const needleAngle = valToAngle(clamped);
  const tipR        = AR - AW / 2 - 4;
  const tail        = cfg.needleTailLength;

  // Shadow
  if (cfg.needleShadow) {
    ctx.save();
    ctx.translate(CX + 2.5, CY + 2.5);
    ctx.rotate(needleAngle);
    ctx.beginPath();
    ctx.moveTo(-tail, 0);
    ctx.lineTo(tipR, 0);
    ctx.strokeStyle = 'rgba(0,0,0,0.13)';
    ctx.lineWidth   = 4;
    ctx.lineCap     = 'round';
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(needleAngle);

  if (cfg.needleStyle === 'tapered') {
    ctx.beginPath();
    ctx.moveTo(-tail,      2.5);
    ctx.lineTo(tipR - 10,  1.2);
    ctx.lineTo(tipR,       0);
    ctx.lineTo(tipR - 10, -1.2);
    ctx.lineTo(-tail,     -2.5);
    ctx.closePath();
    ctx.fillStyle = cfg.needleColor;
    ctx.fill();
  } else if (cfg.needleStyle === 'line') {
    ctx.beginPath();
    ctx.moveTo(-tail, 0);
    ctx.lineTo(tipR,  0);
    ctx.strokeStyle = cfg.needleColor;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.stroke();
  } else if (cfg.needleStyle === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(-tail,       1.5);
    ctx.lineTo(tipR - 12,   1.5);
    ctx.lineTo(tipR - 12,   4.5);
    ctx.lineTo(tipR,        0);
    ctx.lineTo(tipR - 12,  -4.5);
    ctx.lineTo(tipR - 12,  -1.5);
    ctx.lineTo(-tail,      -1.5);
    ctx.closePath();
    ctx.fillStyle = cfg.needleColor;
    ctx.fill();
  }

  ctx.restore();

  /* ── Center hub ── */
  const hr = cfg.hubRadius;
  ctx.beginPath(); ctx.arc(CX, CY, hr,        0, Math.PI * 2);
  ctx.fillStyle = cfg.hubOuterColor; ctx.fill();
  ctx.beginPath(); ctx.arc(CX, CY, hr * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = cfg.hubInnerColor; ctx.fill();
  ctx.beginPath(); ctx.arc(CX, CY, hr * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = cfg.hubDotColor;   ctx.fill();

  /* ── Bezel glare ── */
  if (cfg.glare) {
    ctx.beginPath();
    ctx.arc(CX, CY, FR - 1, Math.PI * 1.08, Math.PI * 1.92);
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.lineWidth   = 9;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }
}

/* ─────────────────────────────────────────────────────────────────
   GAUGE COMPONENT
───────────────────────────────────────────────────────────────── */
export default function Gauge({ value = 0, config = {} }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ displayed: value, raf: null });

  useEffect(() => {
    const merged = { ...DEFAULT_CONFIG, ...config };
    const s      = stateRef.current;
    cancelAnimationFrame(s.raf);

    const target = Math.max(merged.minValue, Math.min(merged.maxValue, value));

    if (!merged.animated || merged.animDuration <= 0) {
      s.displayed = target;
      draw(canvasRef.current, target, merged);
      return;
    }

    const startVal = s.displayed;
    const t0       = performance.now();
    const dur      = merged.animDuration;

    function tick(now) {
      const p    = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);          // ease-out cubic
      s.displayed = startVal + (target - startVal) * ease;
      draw(canvasRef.current, s.displayed, merged);
      if (p < 1) s.raf = requestAnimationFrame(tick);
      else       s.displayed = target;
    }

    s.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(s.raf);
  }, [value, config]); // eslint-disable-line react-hooks/exhaustive-deps

  const merged = { ...DEFAULT_CONFIG, ...config };
  const pipeH  = merged.showPipe ? Math.round(merged.size * 0.22) : 0;

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block' }}
      width={merged.size}
      height={merged.size + pipeH}
      aria-label={`Gauge showing ${value.toFixed(merged.decimalPlaces)} ${merged.unit}`}
      role="img"
    />
  );
}
