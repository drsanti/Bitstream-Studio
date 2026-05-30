import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Gauge, Hash, Settings2, Timer, Waves } from "lucide-react";
import {
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "@/ui/TRN";
import {
  TELEMETRY_META_MENU_DESC_DISPLAY_BOTH,
  TELEMETRY_META_MENU_DESC_DISPLAY_COUNTER,
  TELEMETRY_META_MENU_DESC_DISPLAY_HZ,
  TELEMETRY_META_MENU_DESC_RATE_COUNTER,
  TELEMETRY_META_MENU_DESC_RATE_DEVICE,
  TELEMETRY_META_MENU_DESC_RATE_HOST,
  TELEMETRY_META_MENU_DESC_RATE_SMOOTHED,
} from "../../constants/telemetryMetaHints.js";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import type {
  TelemetryMetaDisplayMode,
  TelemetryMetaRateSource,
} from "../../utils/telemetryMetaDisplay.js";

const MENU_ITEM_ROW_CLASS =
  "flex w-full shrink-0 items-start justify-start gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-left text-sm font-normal text-zinc-100 shadow-none transition-colors hover:border-white/20 hover:bg-white/12";

type MenuOption = {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
};

const DISPLAY_OPTIONS: MenuOption[] = [
  {
    id: "counter",
    label: "Sample counter",
    description: TELEMETRY_META_MENU_DESC_DISPLAY_COUNTER,
    icon: <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "hz",
    label: "Stream rate (Hz)",
    description: TELEMETRY_META_MENU_DESC_DISPLAY_HZ,
    icon: <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "both",
    label: "Counter and rate",
    description: TELEMETRY_META_MENU_DESC_DISPLAY_BOTH,
    icon: <Waves className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
];

const RATE_SOURCE_OPTIONS: MenuOption[] = [
  {
    id: "device",
    label: "Device (tMs)",
    description: TELEMETRY_META_MENU_DESC_RATE_DEVICE,
    icon: <Timer className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "host",
    label: "Host receive",
    description: TELEMETRY_META_MENU_DESC_RATE_HOST,
    icon: <Waves className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "counter",
    label: "Counter slope",
    description: TELEMETRY_META_MENU_DESC_RATE_COUNTER,
    icon: <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
  {
    id: "smoothed",
    label: "Smoothed (recent gaps)",
    description: TELEMETRY_META_MENU_DESC_RATE_SMOOTHED,
    icon: <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />,
  },
];

type TelemetryMetaMenuItemProps = {
  description: string;
  label: string;
  icon: ReactNode;
  selected: boolean;
  onSelect: () => void;
};

/** Menu row with inline title + descriptive subtitle (no icon-button tooltips). */
function TelemetryMetaMenuItem(props: TelemetryMetaMenuItemProps) {
  const { description, label, icon, selected, onSelect } = props;

  return (
    <button
      type="button"
      role="menuitem"
      className={MENU_ITEM_ROW_CLASS}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onSelect}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate leading-snug">{label}</span>
        <span className="mt-0.5 block text-[10px] font-normal leading-snug text-zinc-400">
          {description}
        </span>
      </span>
      {selected ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
      ) : (
        <span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
    </button>
  );
}

/** Gear menu on Telemetry Meta card title — display mode and Hz rate source. */
export function TelemetryMetaSettingsMenu() {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const displayMode = useBitstreamConfigStore((s) => s.telemetryMetaDisplayMode);
  const rateSource = useBitstreamConfigStore((s) => s.telemetryMetaRateSource);
  const setDisplayMode = useBitstreamConfigStore((s) => s.setTelemetryMetaDisplayMode);
  const setRateSource = useBitstreamConfigStore((s) => s.setTelemetryMetaRateSource);

  useEffect(() => {
    if (!open)
    {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current;
      if (el != null && !el.contains(e.target as Node))
      {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  const showRateSource = displayMode === "hz" || displayMode === "both";

  return (
    <div ref={menuRef} className="relative flex shrink-0 items-center">
      <button
        type="button"
        aria-label="Telemetry Meta display options"
        title="Telemetry Meta display options"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm p-0 text-zinc-400 transition-colors hover:text-zinc-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
      >
        <Settings2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      </button>
      {open ? (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-[min(19rem,calc(100vw-1rem))] overflow-visible">
          <TRNMenuPanel tone="glass-dropdown" className="py-1">
            <div className="flex min-w-0 flex-col gap-0.5">
              <TRNMenuSectionTitle spacing="menuFirst">Show</TRNMenuSectionTitle>
              {DISPLAY_OPTIONS.map((opt) => (
                <TelemetryMetaMenuItem
                  key={opt.id}
                  description={opt.description}
                  label={opt.label}
                  icon={opt.icon}
                  selected={displayMode === opt.id}
                  onSelect={() => {
                    setDisplayMode(opt.id as TelemetryMetaDisplayMode);
                    if (opt.id === "counter")
                    {
                      setOpen(false);
                    }
                  }}
                />
              ))}
              {showRateSource ? (
                <>
                  <TRNMenuSectionTitle spacing="menuNext">Rate source</TRNMenuSectionTitle>
                  {RATE_SOURCE_OPTIONS.map((opt) => (
                    <TelemetryMetaMenuItem
                      key={opt.id}
                      description={opt.description}
                      label={opt.label}
                      icon={opt.icon}
                      selected={rateSource === opt.id}
                      onSelect={() => {
                        setRateSource(opt.id as TelemetryMetaRateSource);
                        setOpen(false);
                      }}
                    />
                  ))}
                </>
              ) : null}
            </div>
          </TRNMenuPanel>
        </div>
      ) : null}
    </div>
  );
}
