import { Check, Pipette, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { TRNMenuPanel } from "./TRNMenu.js";

function wrapHueDegrees(value: number): number {
  const n = value % 360;
  return n < 0 ? n + 360 : n;
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = wrapHueDegrees(h) / 360;
  const sat = Math.max(0, Math.min(1, s / 100));
  const light = Math.max(0, Math.min(1, l / 100));
  if (sat <= 0) {
    const gray = Math.round(light * 255);
    const g = gray.toString(16).padStart(2, "0");
    return `#${g}${g}${g}`;
  }
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const hue2rgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const r = Math.round(hue2rgb(hue + 1 / 3) * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(hue2rgb(hue) * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(hue2rgb(hue - 1 / 3) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`.toLowerCase();
}

function hexToHueDegrees(hexColor: string): number {
  const hex = hexColor.replace("#", "").trim();
  if (hex.length !== 6) {
    return 0;
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return 0;
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta <= Number.EPSILON) {
    return 0;
  }
  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  return wrapHueDegrees(hue * 60);
}

function normalizeHexColor(value: string, fallback: string): string {
  const s = value.trim();
  const hex = s.startsWith("#") ? s : `#${s}`;
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  return fallback;
}

const DEFAULT_S = 88;
const DEFAULT_L = 56;

export type TRNColorRingPickerProps = {
  valueHex: string;
  onValueHexChange: (nextHex: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  /** Trigger label; defaults to the hex string. */
  label?: ReactNode;
  /** Trigger size; `sm` uses `py-1`. */
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function TRNColorRingPicker(props: TRNColorRingPickerProps) {
  const {
    valueHex,
    onValueHexChange,
    ariaLabel,
    disabled = false,
    label,
    size = "sm",
    className,
  } = props;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [draftHex, setDraftHex] = useState(valueHex);

  const hue = useMemo(() => hexToHueDegrees(valueHex), [valueHex]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraftHex(valueHex);
  }, [open, valueHex]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (evt: PointerEvent) => {
      const root = rootRef.current;
      if (root == null) return;
      const t = evt.target;
      if (t instanceof Node && !root.contains(t)) {
        setOpen(false);
      }
    };
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        evt.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const setHueFromPointer = (clientX: number, clientY: number) => {
    const el = ringRef.current;
    if (el == null) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const angle = Math.atan2(dy, dx); // -pi..pi
    const deg = wrapHueDegrees((angle * 180) / Math.PI);
    const nextHex = hslToHex(deg, DEFAULT_S, DEFAULT_L);
    onValueHexChange(nextHex);
  };

  const triggerPad =
    size === "sm" ? "py-1" : size === "lg" ? "py-2 text-sm" : "py-1.5";

  return (
    <div ref={rootRef} className={twMerge("relative w-full", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        className={twMerge(
          "inline-flex w-full items-center justify-between gap-2 rounded-md border border-white/15 " +
            "bg-black/55 px-2.5 text-xs font-medium text-zinc-100 " +
            "shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-xl " +
            "transition-colors hover:bg-black/65 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 " +
            "disabled:cursor-not-allowed disabled:opacity-50",
          triggerPad,
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <span
            className="inline-flex h-3.5 w-3.5 shrink-0 rounded-sm border border-zinc-700/80"
            style={{ backgroundColor: valueHex }}
            aria-hidden
          />
          <span className="min-w-0 truncate">{label ?? valueHex}</span>
        </span>
        <Pipette className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2.25} aria-hidden />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1">
          <TRNMenuPanel tone="glass-dropdown" className="p-2">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-2">
                <div
                  ref={ringRef}
                  role="application"
                  aria-label="Hue ring"
                  className="relative h-28 w-28 rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 90deg, #ff0033, #ff8a00, #ffe600, #21d07a, #22d3ee, #3b82f6, #d946ef, #ff0033)",
                  }}
                  onPointerDown={(evt) => {
                    evt.preventDefault();
                    setHueFromPointer(evt.clientX, evt.clientY);
                    (evt.currentTarget as HTMLDivElement).setPointerCapture(evt.pointerId);
                  }}
                  onPointerMove={(evt) => {
                    if ((evt.buttons & 1) === 0) return;
                    setHueFromPointer(evt.clientX, evt.clientY);
                  }}
                >
                  {/* inner cutout (ring effect) */}
                  <div className="absolute inset-[10px] rounded-full border border-white/10 bg-black/75 backdrop-blur-xl" />
                  {/* selection dot */}
                  <div
                    className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1 -translate-y-1 rounded-full border border-white/70 bg-white/90 shadow"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${hue}deg) translate(48px)`,
                    }}
                    aria-hidden
                  />
                </div>
                <div className="text-[10px] tabular-nums text-zinc-300">{valueHex}</div>
              </div>

              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-[11px] font-medium text-zinc-200">Hex</label>
                <input
                  type="text"
                  value={draftHex}
                  onChange={(e) => setDraftHex(e.target.value)}
                  className="w-full rounded border border-white/12 bg-black/55 px-2 py-1 text-xs text-zinc-100 outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                  placeholder="#22c55e"
                  spellCheck={false}
                />
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1 rounded border border-white/12 bg-white/6 px-2 py-1 text-[11px] text-zinc-100 hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden /> Close
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1 rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/15"
                    onClick={() => {
                      const next = normalizeHexColor(draftHex, valueHex);
                      onValueHexChange(next);
                      setOpen(false);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden /> Apply
                  </button>
                </div>
              </div>
            </div>
          </TRNMenuPanel>
        </div>
      ) : null}
    </div>
  );
}

