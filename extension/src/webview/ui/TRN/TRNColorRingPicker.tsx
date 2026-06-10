import { Check, Pipette, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { TRNMenuPanel } from "./TRNMenu.js";
import {
  resolveTrnFloatingMenuHorizontal,
  resolveTrnFloatingMenuPlacement,
} from "./trn-floating-menu-placement.js";
import { isEyeDropperSupported, sampleScreenColorHex } from "./trn-eyedropper.js";
import {
  clamp,
  formatTrnColorHex,
  hexToHsla,
  hslToHex,
  normalizeTrnColorHex,
  trnColorCssBackground,
  type TrnHsla,
} from "./trn-color-utils.js";

const COLOR_PANEL_MIN_WIDTH_PX = 272;
const COLOR_PANEL_ESTIMATE_HEIGHT_PX = 320;

const DEFAULT_HSLA: TrnHsla = { h: 188, s: 72, l: 56, a: 100 };

type ColorPanelBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export type TRNColorRingPickerTriggerVariant = "field" | "swatch";

export type TRNColorRingPickerProps = {
  valueHex: string;
  onValueHexChange: (nextHex: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  /** When true, output may include `#rrggbbaa` and an opacity slider is shown. Default false. */
  enableAlpha?: boolean;
  /** Trigger label; defaults to the hex string (field variant only). */
  label?: ReactNode;
  /** Trigger size; `sm` uses `py-1`. */
  size?: "sm" | "md" | "lg";
  /** `field` = full-width row with swatch + label; `swatch` = compact square only. */
  triggerVariant?: TRNColorRingPickerTriggerVariant;
  className?: string;
};

function ColorSlider({
  ariaLabel,
  valuePercent,
  onChange,
  style,
  thumbClassName,
}: {
  ariaLabel: string;
  valuePercent: number;
  onChange: (next: number) => void;
  style: CSSProperties;
  thumbClassName?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const setFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (track == null) {
      return;
    }
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    onChange(ratio * 100);
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(valuePercent)}
      tabIndex={0}
      className="relative h-3 w-full cursor-pointer rounded-md border border-white/10"
      style={style}
      onPointerDown={(evt) => {
        evt.preventDefault();
        setFromClientX(evt.clientX);
        (evt.currentTarget as HTMLDivElement).setPointerCapture(evt.pointerId);
      }}
      onPointerMove={(evt) => {
        if ((evt.buttons & 1) === 0) {
          return;
        }
        setFromClientX(evt.clientX);
      }}
      onKeyDown={(evt) => {
        const step = evt.shiftKey ? 5 : 1;
        if (evt.key === "ArrowLeft" || evt.key === "ArrowDown") {
          evt.preventDefault();
          onChange(clamp(valuePercent - step, 0, 100));
        } else if (evt.key === "ArrowRight" || evt.key === "ArrowUp") {
          evt.preventDefault();
          onChange(clamp(valuePercent + step, 0, 100));
        }
      }}
    >
      <div
        className={twMerge(
          "pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]",
          thumbClassName,
        )}
        style={{ left: `${valuePercent}%` }}
        aria-hidden
      />
    </div>
  );
}

export function TRNColorRingPicker(props: TRNColorRingPickerProps) {
  const {
    valueHex,
    onValueHexChange,
    ariaLabel,
    disabled = false,
    enableAlpha = false,
    label,
    size = "sm",
    triggerVariant = "field",
    className,
  } = props;

  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<ColorPanelBox | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const svRef = useRef<HTMLDivElement | null>(null);
  const [draftHsla, setDraftHsla] = useState<TrnHsla>(() => hexToHsla(valueHex, DEFAULT_HSLA));
  const [draftHex, setDraftHex] = useState(valueHex);
  const [eyedropperBusy, setEyedropperBusy] = useState(false);
  const eyedropperSupported = isEyeDropperSupported();

  const normalizedHex = normalizeTrnColorHex(valueHex, "#22d3ee", enableAlpha);

  const previewHex = useMemo(
    () => formatTrnColorHex(draftHsla, enableAlpha),
    [draftHsla, enableAlpha],
  );

  const commitDraft = useCallback(
    (patch: Partial<TrnHsla> | ((prev: TrnHsla) => TrnHsla)) => {
      setDraftHsla((prev) => {
        const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
        const formatted = formatTrnColorHex(next, enableAlpha);
        setDraftHex(formatted);
        onValueHexChange(formatted);
        return next;
      });
    },
    [enableAlpha, onValueHexChange],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const parsed = hexToHsla(valueHex, DEFAULT_HSLA);
    setDraftHsla(parsed);
    setDraftHex(normalizeTrnColorHex(valueHex, normalizedHex, enableAlpha));
  }, [enableAlpha, normalizedHex, open, valueHex]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuBox(null);
      return;
    }

    const updateMenuBox = () => {
      const root = rootRef.current;
      if (root == null) {
        return;
      }
      const rect = root.getBoundingClientRect();
      const measuredHeight = menuRef.current?.offsetHeight ?? COLOR_PANEL_ESTIMATE_HEIGHT_PX;
      const placement = resolveTrnFloatingMenuPlacement({
        triggerRect: rect,
        menuHeightPx: measuredHeight,
        maxHeightCapPx: Math.max(measuredHeight, window.innerHeight * 0.55),
      });
      const horizontal = resolveTrnFloatingMenuHorizontal({
        triggerRect: rect,
        panelWidthPx: Math.max(rect.width, COLOR_PANEL_MIN_WIDTH_PX),
      });
      setMenuBox({
        ...horizontal,
        top: placement.top,
        maxHeight: placement.maxHeight,
      });
    };

    updateMenuBox();
    const raf = window.requestAnimationFrame(updateMenuBox);
    window.addEventListener("resize", updateMenuBox);
    window.addEventListener("scroll", updateMenuBox, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateMenuBox);
      window.removeEventListener("scroll", updateMenuBox, true);
    };
  }, [open, enableAlpha]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (evt: PointerEvent) => {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (root == null) {
        return;
      }
      const t = evt.target;
      if (t instanceof Node && !root.contains(t) && !(menu?.contains(t) ?? false)) {
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

  const setSvFromPointer = (clientX: number, clientY: number) => {
    const el = svRef.current;
    if (el == null) {
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    const s = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const l = clamp(100 - ((clientY - rect.top) / rect.height) * 100, 0, 100);
    commitDraft({ s, l });
  };

  const handleEyedropperPick = useCallback(async () => {
    if (!eyedropperSupported || eyedropperBusy || disabled) {
      return;
    }
    setEyedropperBusy(true);
    setOpen(false);
    try {
      const sampled = await sampleScreenColorHex();
      if (sampled != null) {
        const parsed = hexToHsla(sampled, DEFAULT_HSLA);
        const next = enableAlpha ? parsed : { ...parsed, a: 100 };
        const formatted = formatTrnColorHex(next, enableAlpha);
        onValueHexChange(formatted);
        setDraftHsla(next);
        setDraftHex(formatted);
      }
    } finally {
      setEyedropperBusy(false);
    }
  }, [disabled, enableAlpha, eyedropperBusy, eyedropperSupported, onValueHexChange]);

  const applyHexDraft = () => {
    const nextHex = normalizeTrnColorHex(draftHex, normalizedHex, enableAlpha);
    const parsed = hexToHsla(nextHex, draftHsla);
    const nextHsla = enableAlpha ? parsed : { ...parsed, a: 100 };
    const formatted = formatTrnColorHex(nextHsla, enableAlpha);
    onValueHexChange(formatted);
    setDraftHsla(nextHsla);
    setDraftHex(formatted);
    setOpen(false);
  };

  const triggerPad =
    size === "sm" ? "py-1" : size === "lg" ? "py-2 text-sm" : "py-1.5";

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const hueStroke = hslToHex(draftHsla.h, 100, 50);
  const opaquePreview = hslToHex(draftHsla.h, draftHsla.s, draftHsla.l, 100);

  const menuPanel =
    open && menuBox != null && portalTarget != null ? (
      <div
        ref={menuRef}
        role="dialog"
        aria-label={`${ariaLabel} picker`}
        className="fixed z-10000 outline-none"
        style={{
          top: menuBox.top,
          left: menuBox.left,
          width: menuBox.width,
          maxHeight: menuBox.maxHeight,
        }}
      >
        <TRNMenuPanel tone="glass-dropdown" className="max-h-full overflow-y-auto p-2.5 scrollbar-hide">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/12"
                style={{ background: trnColorCssBackground(previewHex) }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  Hex
                </label>
                <input
                  type="text"
                  value={draftHex}
                  onChange={(e) => setDraftHex(e.target.value)}
                  className="w-full rounded border border-white/12 bg-black/55 px-2 py-1 text-xs text-zinc-100 outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                  placeholder={enableAlpha ? "#22c55e80" : "#22c55e"}
                  spellCheck={false}
                />
              </div>
              {enableAlpha ? (
                <div className="w-14 shrink-0">
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Opacity
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={`${Math.round(draftHsla.a)}%`}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^\d.]/g, "");
                      if (digits.length === 0) {
                        return;
                      }
                      const nextAlpha = clamp(Number(digits), 0, 100);
                      if (!Number.isFinite(nextAlpha)) {
                        return;
                      }
                      commitDraft({ a: nextAlpha });
                    }}
                    className="w-full rounded border border-white/12 bg-black/55 px-1.5 py-1 text-center text-xs text-zinc-100 outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                    aria-label="Opacity percent"
                  />
                </div>
              ) : null}
            </div>

            <div
              ref={svRef}
              role="application"
              aria-label="Saturation and brightness"
              className="relative h-[120px] w-full cursor-crosshair overflow-hidden rounded-md border border-white/10"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueStroke})`,
              }}
              onPointerDown={(evt) => {
                evt.preventDefault();
                setSvFromPointer(evt.clientX, evt.clientY);
                (evt.currentTarget as HTMLDivElement).setPointerCapture(evt.pointerId);
              }}
              onPointerMove={(evt) => {
                if ((evt.buttons & 1) === 0) {
                  return;
                }
                setSvFromPointer(evt.clientX, evt.clientY);
              }}
            >
              <div
                className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
                style={{
                  left: `${draftHsla.s}%`,
                  top: `${100 - draftHsla.l}%`,
                  backgroundColor: opaquePreview,
                }}
                aria-hidden
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Hue</label>
              <ColorSlider
                ariaLabel="Hue"
                valuePercent={(draftHsla.h / 360) * 100}
                style={{
                  background:
                    "linear-gradient(to right, #ff0033, #ff8a00, #ffe600, #21d07a, #22d3ee, #3b82f6, #d946ef, #ff0033)",
                }}
                onChange={(percent) => {
                  commitDraft({ h: (percent / 100) * 360 });
                }}
              />
            </div>

            {enableAlpha ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  Opacity
                </label>
                <ColorSlider
                  ariaLabel="Opacity"
                  valuePercent={draftHsla.a}
                  style={{
                    background: `${trnColorCssBackground(opaquePreview)}`,
                  }}
                  onChange={(alpha) => {
                    commitDraft({ a: alpha });
                  }}
                />
              </div>
            ) : null}

            {eyedropperSupported ? (
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded border border-white/12 bg-white/6 px-2 py-1.5 text-[11px] text-zinc-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={eyedropperBusy || disabled}
                aria-label="Pick color from screen"
                onClick={() => {
                  void handleEyedropperPick();
                }}
              >
                <Pipette className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Pick from screen
              </button>
            ) : null}

            <div className="flex items-center justify-end gap-2 border-t border-white/8 pt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1 rounded border border-white/12 bg-white/6 px-2.5 py-1 text-[11px] text-zinc-100 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <X className="h-3.5 w-3.5" aria-hidden /> Close
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1 rounded border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/15"
                onClick={applyHexDraft}
              >
                <Check className="h-3.5 w-3.5" aria-hidden /> Apply
              </button>
            </div>
          </div>
        </TRNMenuPanel>
      </div>
    ) : null;

  const triggerSwatchStyle: CSSProperties = enableAlpha
    ? { background: trnColorCssBackground(normalizedHex) }
    : { backgroundColor: normalizedHex.slice(0, 7) };

  const swatchTrigger =
    triggerVariant === "swatch" ? (
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
          "nodrag inline-flex h-[22px] w-[22px] shrink-0 cursor-pointer overflow-hidden rounded-sm border border-zinc-600/80 " +
            "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)] transition-opacity " +
            "hover:opacity-90 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25 " +
            "disabled:cursor-not-allowed disabled:opacity-50",
          open ? "ring-1 ring-white/20" : "",
        )}
        style={triggerSwatchStyle}
      />
    ) : null;

  const fieldTrigger =
    triggerVariant === "field" ? (
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
            className="inline-flex h-3.5 w-3.5 shrink-0 overflow-hidden rounded-sm border border-zinc-700/80"
            style={triggerSwatchStyle}
            aria-hidden
          />
          <span className="min-w-0 truncate">{label ?? normalizedHex}</span>
        </span>
        <Pipette className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2.25} aria-hidden />
      </button>
    ) : null;

  return (
    <div
      ref={rootRef}
      className={twMerge(
        triggerVariant === "swatch" ? "relative inline-flex" : "relative w-full",
        className,
      )}
    >
      {swatchTrigger ?? fieldTrigger}

      {menuPanel != null && portalTarget != null ? createPortal(menuPanel, portalTarget) : null}
    </div>
  );
}
