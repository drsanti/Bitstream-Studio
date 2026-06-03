/*******************************************************************************
 * File Name        : useBitstreamWifiEvtBridge.ts
 *
 * Description      : Subscribe bitstream2/evt/status and update Wi‑Fi store (BS2).
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect } from "react";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2WifiEvtPayload,
} from "../../../bitstream2/bridge/protocol";
import { BS2_WIFI_EVT_KIND } from "../../../bitstream2/domains/wifi/commands";
import { decodeWifiEvtStatus } from "../../../bitstream2/domains/wifi/decode-evt-status";
import { base64ToBytes } from "../../../bitstream2/util/base64";
import { useWsClientStore } from "../../ws-client-store";
import { useBitstreamWifiStore } from "../state/bitstreamWifi.store";

const LISTENER_ID = "bitstream-app-wifi-evt-bridge";

/**
 * Maps BS2 Wi‑Fi EVT_STATUS broker payloads into `useBitstreamWifiStore`.
 */
export function useBitstreamWifiEvtBridge(): void {
  const isConnected = useWsClientStore((s) => s.isConnected);
  const subscribeTopic = useWsClientStore((s) => s.subscribeTopic);
  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);

  useEffect(() => {
    if (!isConnected)
    {
      return;
    }

    let cancelled = false;
    void (async () => {
      try
      {
        await subscribeTopic(BITSTREAM2_TOPICS.EVT_STATUS, 0, "json");
      }
      catch
      {
        // Retry on next connect cycle.
      }
      if (cancelled)
      {
        return;
      }
    })();

    const onMessage = (topic: string, payload: unknown) => {
      if (topic !== BITSTREAM2_TOPICS.EVT_STATUS)
      {
        return;
      }

      const evt = payload as Bitstream2WifiEvtPayload;
      const inner = base64ToBytes(evt.innerB64);
      const decoded = decodeWifiEvtStatus(inner);
      if (decoded == null)
      {
        return;
      }

      const store = useBitstreamWifiStore.getState();
      store.applyRx({ kind: decoded.kind, reqId: decoded.reqId });

      if (decoded.kind === BS2_WIFI_EVT_KIND.LINK)
      {
        store.applyStatus(
          {
            reqId: decoded.reqId,
            state: decoded.state,
            rssi: decoded.rssi,
            reason: decoded.reason,
            ssid: decoded.ssid,
          },
          "evt_status",
        );
        return;
      }

      if (decoded.kind === BS2_WIFI_EVT_KIND.SCAN_ROW)
      {
        store.appendScanRow({
          index: decoded.index,
          total: decoded.total,
          rssi: decoded.rssi,
          channel: decoded.channel,
          security: decoded.security,
          ssid: decoded.ssid,
          bssid: decoded.bssid,
        });
        return;
      }

      if (decoded.kind === BS2_WIFI_EVT_KIND.SCAN_DONE)
      {
        store.applyScanComplete({
          reqId: decoded.reqId,
          totalCount: decoded.totalCount,
          status: decoded.status,
        });
        return;
      }

      if (decoded.kind === BS2_WIFI_EVT_KIND.POLICY)
      {
        store.applyPolicy((decoded.flags & 0x01) !== 0);
      }
    };

    addMessageListener(LISTENER_ID, onMessage);
    return () => {
      cancelled = true;
      removeMessageListener(LISTENER_ID);
    };
  }, [addMessageListener, isConnected, removeMessageListener, subscribeTopic]);
}
