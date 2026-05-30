/*******************************************************************************
 * File Name : sendBitstream2ReqAwait.ts
 *
 * Description : Publish bitstream2/req and await bitstream2/res (non-React).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import {
  BITSTREAM2_TOPICS,
  type Bitstream2HostReqPayload,
  type Bitstream2HostResPayload,
} from "../../bitstream2/bridge/protocol";
import { base64ToBytes } from "../../bitstream2/util/base64";
import { useWsClientStore } from "../ws-client-store";

export type Bs2ReqAwaitResult = {
  ok: boolean;
  status: number;
  body: Uint8Array;
  error?: string;
};

/**
 * Publish `bitstream2/req` and wait for matching `bitstream2/res` by requestId.
 * Caller must subscribe to `BITSTREAM2_TOPICS.RES` on the WebSocket client first.
 */
export async function sendBitstream2ReqAwait(
  partial: Omit<Bitstream2HostReqPayload, "requestId"> & { requestId?: string },
  timeoutMs = 2000,
): Promise<Bs2ReqAwaitResult> {
  const publish = useWsClientStore.getState().publish;
  const addMessageListener = useWsClientStore.getState().addMessageListener;
  const removeMessageListener = useWsClientStore.getState().removeMessageListener;

  const requestId = partial.requestId ?? `bs2-req-${Date.now()}`;
  const req: Bitstream2HostReqPayload = {
    requestId,
    reqId: partial.reqId ?? 0,
    cmdId: partial.cmdId,
    flags: partial.flags,
    bodyB64: partial.bodyB64,
    timeoutMs: partial.timeoutMs ?? timeoutMs,
    retryCount: partial.retryCount ?? 0,
  };

  return await new Promise<Bs2ReqAwaitResult>((resolve) => {
    const listenerId = `bs2-req-await-${requestId}`;
    let settled = false;

    const finish = (result: Bs2ReqAwaitResult) => {
      if (settled)
      {
        return;
      }
      settled = true;
      clearTimeout(timer);
      removeMessageListener(listenerId);
      resolve(result);
    };

    addMessageListener(listenerId, (topic, payload) => {
      if (topic !== BITSTREAM2_TOPICS.RES)
      {
        return;
      }
      const hostRes = payload as Bitstream2HostResPayload;
      if (hostRes.requestId !== requestId)
      {
        return;
      }
      if (!hostRes.ok)
      {
        finish({
          ok: false,
          status: 0xff,
          body: new Uint8Array(0),
          error: hostRes.error ?? "BS2 request failed",
        });
        return;
      }
      const body =
        typeof hostRes.bodyB64 === "string" && hostRes.bodyB64.length > 0
          ? base64ToBytes(hostRes.bodyB64)
          : new Uint8Array(0);
      const status = hostRes.status ?? 0xff;
      finish({ ok: status === 0, status, body });
    });

    const timer = setTimeout(() => {
      finish({
        ok: false,
        status: 0xff,
        body: new Uint8Array(0),
        error: `BS2 request timed out (${timeoutMs}ms)`,
      });
    }, timeoutMs);

    void publish(BITSTREAM2_TOPICS.REQ, req, 0);
  });
}
