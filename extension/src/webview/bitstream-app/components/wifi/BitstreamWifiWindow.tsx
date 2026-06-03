/*******************************************************************************
 * File Name        : BitstreamWifiWindow.tsx
 *
 * Description      : Floating TRNWindow shell for the Device Wi‑Fi control panel.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Wifi } from "lucide-react";
import { useMemo } from "react";
import { TRNWindow } from "@/ui/TRN/TRNWindow";
import { useBitstreamWifiStore } from "../../state/bitstreamWifi.store";
import { BitstreamWifiPanel } from "./BitstreamWifiPanel";
import {
  formatWifiWindowHeaderRssi,
  formatWifiWindowTitle,
} from "./wifi-window-chrome";
import { statusPillClass } from "./wifi-panel-utils";

const WIFI_WINDOW_PREFIX_ICON = (
  <Wifi className="h-3.5 w-3.5 shrink-0 text-sky-300/90" aria-hidden />
);

/** Title-bar status pill (fixed width for alignment). */
function WifiWindowHeaderStatus(props: { state: number; rssi: number }) {
  const { state, rssi } = props;
  const stateLabel = state === 2 ? "On" : state === 1 || state === 3 ? "…" : "Off";
  const rssiLabel = formatWifiWindowHeaderRssi(rssi);

  return (
    <span
      className="pointer-events-none inline-flex min-w-[5.5rem] items-center justify-end gap-1.5"
      aria-hidden
    >
      <span
        className={`inline-flex w-[2.75rem] shrink-0 items-center justify-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium leading-none ${statusPillClass(state)}`}
      >
        {stateLabel}
      </span>
      {rssiLabel != null ? (
        <span className="w-[3.25rem] shrink-0 text-right text-[9px] tabular-nums text-zinc-400">
          {rssiLabel}
        </span>
      ) : (
        <span className="w-[3.25rem] shrink-0" aria-hidden />
      )}
    </span>
  );
}

export function BitstreamWifiWindow(props: { open: boolean; onClose: () => void }) {
  const { open, onClose } = props;
  const lastStatus = useBitstreamWifiStore((s) => s.lastStatus);

  const title = useMemo(
    () => formatWifiWindowTitle(lastStatus),
    [lastStatus?.state, lastStatus?.ssid, lastStatus],
  );

  const headerActions = useMemo(() => {
    if (lastStatus == null) {
      return null;
    }
    return <WifiWindowHeaderStatus state={lastStatus.state} rssi={lastStatus.rssi} />;
  }, [lastStatus?.rssi, lastStatus?.state, lastStatus]);

  return (
    <TRNWindow
      open={open}
      onClose={onClose}
      title={title}
      prefixIcon={WIFI_WINDOW_PREFIX_ICON}
      headerActions={headerActions}
      initialRect={{ x: 40, y: 96, width: 360, height: 320 }}
      minWidth={320}
      minHeight={120}
      heightMode="auto"
      autoHeightMaxViewportFraction={0.88}
      draggable
      resizable
      reopenStrategy="preserve"
      modal={false}
      zIndex={334}
      contentClassName="bg-black/30 p-2"
      persistRectStorageKey="bitstream-app:wifi-control-window:v2"
      showFooter={false}
      showMaximize={false}
    >
      <BitstreamWifiPanel />
    </TRNWindow>
  );
}
