/*******************************************************************************
 * File Name        : WifiNetworksTab.tsx
 *
 * Description      : Scan and pick nearby networks (Wi‑Fi panel Networks tab).
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.2
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { LoaderCircle, Radio, Search } from "lucide-react";
import { useMemo } from "react";
import {
  TRNButton,
  TRNHintText,
  TRNInput,
  TRNSortableSettingsCardList,
  type TRNSortableSettingsCardItem,
} from "@/ui/TRN";
import { WifiScanResultsCard } from "./WifiScanResultsCard";
import type { WifiScanUiOutcome } from "./useWifiScanSession";
import { BS2_WIFI_SCAN_SSID_MAX_LEN } from "./wifi-panel-utils";
import type { BitstreamWifiScanRow } from "../../../../bitstream2/domains/wifi/store-types";

const WIFI_NETWORKS_CARDS_KEY = "bitstream-app:wifi-networks-cards";

function WifiNearbyCardTitleTrailing(props: { isScanActive: boolean; networkCount: number }) {
  const { isScanActive, networkCount } = props;

  if (isScanActive) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-sky-200/90">
        <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
        Scanning…
      </span>
    );
  }

  if (networkCount > 0) {
    return (
      <span className="shrink-0 text-[10px] font-medium text-zinc-400">
        {networkCount} network{networkCount === 1 ? "" : "s"}
      </span>
    );
  }

  return null;
}

export function WifiNetworksTab(props: {
  blocked: boolean;
  isScanActive: boolean;
  scanOutcome: WifiScanUiOutcome;
  scanFilter: string;
  scanRows: BitstreamWifiScanRow[];
  lastScanTotalCount: number | null;
  onScanFilterChange: (value: string) => void;
  onScanAll: () => void;
  onScanFilter: () => void;
  onPickSsid: (ssid: string) => void;
}) {
  const {
    blocked,
    isScanActive,
    scanOutcome,
    scanFilter,
    scanRows,
    lastScanTotalCount,
    onScanFilterChange,
    onScanAll,
    onScanFilter,
    onPickSsid,
  } = props;

  const scanFilterTrim = scanFilter.trim();
  const scanControlsDisabled = blocked || isScanActive;

  const cards = useMemo((): TRNSortableSettingsCardItem[] => {
    const scanContent = (
      <div className="space-y-2">
        {!isScanActive ? (
          <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
            Scan for networks, then tap a name to use it on the Connect tab.
          </TRNHintText>
        ) : null}

        <TRNButton
          size="compact"
          className="w-full gap-1.5 text-[11px]"
          onClick={onScanAll}
          disabled={scanControlsDisabled}
        >
          {isScanActive ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Search className="h-3.5 w-3.5" aria-hidden />
          )}
          {isScanActive ? "Scanning…" : "Scan for networks"}
        </TRNButton>

        <div className="flex gap-1.5">
          <TRNInput
            className="min-w-0 flex-1"
            prefixIcon={Search}
            value={scanFilter}
            onChange={(e) =>
              onScanFilterChange(e.target.value.slice(0, BS2_WIFI_SCAN_SSID_MAX_LEN))
            }
            disabled={scanControlsDisabled}
            autoComplete="off"
            maxLength={BS2_WIFI_SCAN_SSID_MAX_LEN}
            placeholder="Filter by name (optional)"
            aria-label="Filter scan by network name"
          />
          <TRNButton
            size="compact"
            className="shrink-0 text-[11px]"
            onClick={onScanFilter}
            disabled={scanControlsDisabled || scanFilterTrim.length === 0}
          >
            Search
          </TRNButton>
        </div>
      </div>
    );

    const listContent = (
      <WifiScanResultsCard
        isScanActive={isScanActive}
        scanOutcome={scanOutcome}
        scanRows={scanRows}
        lastScanTotalCount={lastScanTotalCount}
        onPickSsid={onPickSsid}
      />
    );

    const networkCount =
      lastScanTotalCount != null && !isScanActive ? lastScanTotalCount : scanRows.length;

    return [
      {
        id: "scan",
        title: "Find networks",
        icon: <Search className="h-4 w-4 text-zinc-500" aria-hidden />,
        defaultExpanded: true,
        content: scanContent,
      },
      {
        id: "nearby",
        title: "Nearby networks",
        icon: <Radio className="h-4 w-4 text-zinc-500" aria-hidden />,
        titleTrailingSlot: (
          <WifiNearbyCardTitleTrailing isScanActive={isScanActive} networkCount={networkCount} />
        ),
        defaultExpanded: true,
        content: listContent,
      },
    ];
  }, [
    blocked,
    isScanActive,
    lastScanTotalCount,
    onPickSsid,
    onScanAll,
    onScanFilter,
    onScanFilterChange,
    scanControlsDisabled,
    scanFilter,
    scanFilterTrim,
    scanOutcome,
    scanRows,
  ]);

  return <TRNSortableSettingsCardList items={cards} panelId={WIFI_NETWORKS_CARDS_KEY} />;
}
