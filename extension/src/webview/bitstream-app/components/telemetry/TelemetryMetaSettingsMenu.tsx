import type { ReactNode } from "react";
import { Check, Gauge, Hash, Timer, Waves } from "lucide-react";
import { TRNMenuSectionTitle } from "@/ui/TRN";
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
import {
  TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS,
  TelemetryCardSettingsMenuShell,
} from "./TelemetryCardSettingsMenuShell.js";

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
      className={TELEMETRY_CARD_SETTINGS_MENU_ITEM_ROW_CLASS}
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
  const displayMode = useBitstreamConfigStore((s) => s.telemetryMetaDisplayMode);
  const rateSource = useBitstreamConfigStore((s) => s.telemetryMetaRateSource);
  const setDisplayMode = useBitstreamConfigStore((s) => s.setTelemetryMetaDisplayMode);
  const setRateSource = useBitstreamConfigStore((s) => s.setTelemetryMetaRateSource);

  return (
    <TelemetryCardSettingsMenuShell ariaLabel="Telemetry Meta display options">
      {({ close }) => {
        const showRateSource = displayMode === "hz" || displayMode === "both";

        return (
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
                  if (opt.id === "counter") {
                    close();
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
                      close();
                    }}
                  />
                ))}
              </>
            ) : null}
          </div>
        );
      }}
    </TelemetryCardSettingsMenuShell>
  );
}
