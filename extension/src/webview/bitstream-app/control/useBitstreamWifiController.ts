/*******************************************************************************
 * File Name        : useBitstreamWifiController.ts
 *
 * Description      : BS2 Wi‑Fi REQ helpers (bitstream2/req + RES).
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useRef } from "react";
import { BS2_WIFI_CMD } from "../../../bitstream2/domains/wifi/commands";
import {
  encodeWifiConnectBody,
  encodeWifiPolicySetBody,
  encodeWifiScanSsidBody,
} from "../../../bitstream2/domains/wifi/encode-req";
import { decodeWifiStatusSnapshot } from "../../../bitstream2/domains/wifi/decode-evt-status";
import { bytesToBase64 } from "../../../bitstream2/util/base64";
import { useBitstream2ReqAwait } from "../hooks/useBitstream2ReqAwait";
import { useBitstreamWifiStore } from "../state/bitstreamWifi.store";

export type BitstreamWifiController = {
  wifiScanAll: () => Promise<boolean>;
  wifiScanSsid: (ssidSubstring: string) => Promise<boolean>;
  wifiConnect: (ssid: string, password: string, security?: number) => Promise<boolean>;
  wifiDisconnect: () => Promise<boolean>;
  wifiStatusPoll: () => Promise<boolean>;
  wifiPolicyGet: () => Promise<boolean>;
  wifiPolicySet: (autoConnectEnabled: boolean) => Promise<boolean>;
  wifiSyncNow: (reason: string) => Promise<void>;
};

/**
 * BS2 Wi‑Fi control via broker REQ/RES; async EVT_STATUS handled by `useBitstreamWifiEvtBridge`.
 */
export function useBitstreamWifiController(pushLog: (msg: string) => void): BitstreamWifiController {
  const { sendReqAwait } = useBitstream2ReqAwait();
  const reqIdRef = useRef(1);

  const nextReqId = useCallback((): number => {
    const id = reqIdRef.current;
    reqIdRef.current = id >= 65535 ? 1 : id + 1;
    return id;
  }, []);

  const wifiScanAll = useCallback(async (): Promise<boolean> => {
    const reqId = nextReqId();
    useBitstreamWifiStore.getState().clearScanRows();
    useBitstreamWifiStore.getState().applyTx({ kind: "scan_all", reqId });
    const res = await sendReqAwait({ reqId, cmdId: BS2_WIFI_CMD.SCAN_ALL });
    if (!res.ok || res.status !== 0)
    {
      pushLog(`Wi‑Fi scan: RES status=${res.status}`);
      return false;
    }
    pushLog(`Wi‑Fi scan queued (reqId=${reqId})`);
    return true;
  }, [nextReqId, pushLog, sendReqAwait]);

  const wifiScanSsid = useCallback(
    async (ssidSubstring: string): Promise<boolean> => {
      const reqId = nextReqId();
      useBitstreamWifiStore.getState().clearScanRows();
      useBitstreamWifiStore.getState().applyTx({ kind: "scan_ssid", reqId });
      const res = await sendReqAwait({
        reqId,
        cmdId: BS2_WIFI_CMD.SCAN_SSID,
        bodyB64: bytesToBase64(encodeWifiScanSsidBody(ssidSubstring)),
      });
      if (!res.ok || res.status !== 0)
      {
        pushLog(`Wi‑Fi scan SSID: RES status=${res.status}`);
        return false;
      }
      pushLog(`Wi‑Fi scan SSID queued (reqId=${reqId})`);
      return true;
    },
    [nextReqId, pushLog, sendReqAwait],
  );

  const wifiConnect = useCallback(
    async (ssid: string, password: string, security = 0): Promise<boolean> => {
      const reqId = nextReqId();
      useBitstreamWifiStore.getState().applyTx({ kind: "connect", reqId });
      const res = await sendReqAwait({
        reqId,
        cmdId: BS2_WIFI_CMD.CONNECT,
        bodyB64: bytesToBase64(encodeWifiConnectBody(security, ssid, password)),
      });
      if (!res.ok || res.status !== 0)
      {
        pushLog(`Wi‑Fi connect: RES status=${res.status}`);
        return false;
      }
      pushLog(`Wi‑Fi connect queued (reqId=${reqId})`);
      return true;
    },
    [nextReqId, pushLog, sendReqAwait],
  );

  const wifiDisconnect = useCallback(async (): Promise<boolean> => {
    const reqId = nextReqId();
    useBitstreamWifiStore.getState().applyTx({ kind: "disconnect", reqId });
    const res = await sendReqAwait({ reqId, cmdId: BS2_WIFI_CMD.DISCONNECT });
    if (!res.ok || res.status !== 0)
    {
      pushLog(`Wi‑Fi disconnect: RES status=${res.status}`);
      return false;
    }
    return true;
  }, [nextReqId, pushLog, sendReqAwait]);

  const wifiStatusPoll = useCallback(async (): Promise<boolean> => {
    const reqId = nextReqId();
    useBitstreamWifiStore.getState().applyTx({ kind: "status_poll", reqId });
    const res = await sendReqAwait({ reqId, cmdId: BS2_WIFI_CMD.STATUS_GET });
    if (!res.ok || res.status !== 0)
    {
      pushLog(`Wi‑Fi status: RES status=${res.status}`);
      return false;
    }
    const snap = decodeWifiStatusSnapshot(res.body);
    if (snap == null)
    {
      pushLog("Wi‑Fi status: decode failed");
      return false;
    }
    useBitstreamWifiStore.getState().applyStatus(
      { reqId, ...snap },
      "status_get_res",
    );
    return true;
  }, [nextReqId, pushLog, sendReqAwait]);

  const wifiPolicyGet = useCallback(async (): Promise<boolean> => {
    const reqId = nextReqId();
    useBitstreamWifiStore.getState().applyTx({ kind: "policy_get", reqId });
    const res = await sendReqAwait({ reqId, cmdId: BS2_WIFI_CMD.POLICY_GET });
    if (!res.ok || res.status !== 0)
    {
      pushLog(`Wi‑Fi policy get: RES status=${res.status}`);
      return false;
    }
    if (res.body.byteLength >= 1)
    {
      useBitstreamWifiStore.getState().applyPolicy((res.body[0] ?? 0) !== 0);
    }
    return true;
  }, [nextReqId, pushLog, sendReqAwait]);

  const wifiPolicySet = useCallback(
    async (autoConnectEnabled: boolean): Promise<boolean> => {
      const reqId = nextReqId();
      useBitstreamWifiStore.getState().applyTx({ kind: "policy_set", reqId });
      const res = await sendReqAwait({
        reqId,
        cmdId: BS2_WIFI_CMD.POLICY_SET,
        bodyB64: bytesToBase64(encodeWifiPolicySetBody(autoConnectEnabled)),
      });
      if (!res.ok || res.status !== 0)
      {
        pushLog(`Wi‑Fi policy set: RES status=${res.status}`);
        return false;
      }
      useBitstreamWifiStore.getState().applyPolicy(autoConnectEnabled);
      return true;
    },
    [nextReqId, pushLog, sendReqAwait],
  );

  const wifiSyncNow = useCallback(
    async (reason: string): Promise<void> => {
      const store = useBitstreamWifiStore.getState();
      store.setWifiSync({ state: "syncing", lastAttemptAtMs: Date.now(), lastError: null });
      const ok = await wifiStatusPoll();
      if (ok)
      {
        store.setWifiSync({ state: "ok", lastOkAtMs: Date.now(), lastError: null });
      }
      else
      {
        store.setWifiSync({
          state: "error",
          lastError: reason || "status poll failed",
        });
      }
    },
    [wifiStatusPoll],
  );

  return {
    wifiScanAll,
    wifiScanSsid,
    wifiConnect,
    wifiDisconnect,
    wifiStatusPoll,
    wifiPolicyGet,
    wifiPolicySet,
    wifiSyncNow,
  };
}
