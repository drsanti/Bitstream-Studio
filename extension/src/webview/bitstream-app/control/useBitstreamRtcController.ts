/*******************************************************************************
 * File Name        : useBitstreamRtcController.ts
 *
 * Description      : BS2 TIME_SET / TIME_GET / TIME_SYNC via bitstream2/req.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useRef } from "react";
import { BS2_TIME_CMD } from "../../../bitstream2/domains/time/commands";
import { encodeTimeSetBody } from "../../../bitstream2/domains/time/encode-req";
import {
  decodeRtcOpResultBody,
  decodeRtcStatusBody,
} from "../../../bitstream2/domains/time/decode-res";
import { bytesToBase64 } from "../../../bitstream2/util/base64";
import { useBitstream2ReqAwait } from "../hooks/useBitstream2ReqAwait";
import { useBitstreamRtcStore } from "../state/bitstreamRtc.store";

export type BitstreamRtcController = {
  rtcGet: () => Promise<boolean>;
  rtcSetFromHost: (unixSec?: number, tzOffsetMin?: number) => Promise<boolean>;
  rtcSyncNtp: () => Promise<boolean>;
};

/**
 * BS2 wall-clock control; updates `useBitstreamRtcStore` on successful TIME_GET / TIME_SET.
 */
export function useBitstreamRtcController(pushLog: (msg: string) => void): BitstreamRtcController {
  const { sendReqAwait } = useBitstream2ReqAwait();
  const reqIdRef = useRef(1);

  const nextReqId = useCallback((): number => {
    const id = reqIdRef.current;
    reqIdRef.current = id >= 65535 ? 1 : id + 1;
    return id;
  }, []);

  const rtcGet = useCallback(async (): Promise<boolean> => {
    const reqId = nextReqId();
    useBitstreamRtcStore.getState().applyTx({ kind: "time_get", reqId });
    const res = await sendReqAwait({ reqId, cmdId: BS2_TIME_CMD.GET });
    if (!res.ok || res.status !== 0)
    {
      pushLog(`RTC get: RES status=${res.status}`);
      return false;
    }
    const status = decodeRtcStatusBody(res.body);
    if (!status)
    {
      pushLog("RTC get: bad RES body");
      return false;
    }
    useBitstreamRtcStore.getState().applyStatus(status);
    pushLog(`RTC: unix=${status.unixSec} flags=0x${status.flags.toString(16)}`);
    return true;
  }, [nextReqId, pushLog, sendReqAwait]);

  const rtcSetFromHost = useCallback(
    async (unixSec = Math.floor(Date.now() / 1000), tzOffsetMin = -new Date().getTimezoneOffset()): Promise<boolean> => {
      const reqId = nextReqId();
      useBitstreamRtcStore.getState().applyTx({ kind: "time_set", reqId });
      const res = await sendReqAwait({
        reqId,
        cmdId: BS2_TIME_CMD.SET,
        bodyB64: bytesToBase64(encodeTimeSetBody(unixSec, tzOffsetMin)),
      });
      if (!res.ok || res.status !== 0)
      {
        const op = decodeRtcOpResultBody(res.body);
        pushLog(`RTC set: RES status=${res.status} error=${op?.error ?? "?"}`);
        return false;
      }
      pushLog(`RTC set OK (unix=${unixSec})`);
      await rtcGet();
      return true;
    },
    [nextReqId, pushLog, rtcGet, sendReqAwait],
  );

  const rtcSyncNtp = useCallback(async (): Promise<boolean> => {
    const reqId = nextReqId();
    useBitstreamRtcStore.getState().applyTx({ kind: "time_sync", reqId });
    const res = await sendReqAwait({ reqId, cmdId: BS2_TIME_CMD.SYNC });
    if (!res.ok || res.status !== 0)
    {
      const op = decodeRtcOpResultBody(res.body);
      pushLog(`RTC NTP sync: status=${res.status} error=${op?.error ?? "?"}`);
      return false;
    }
    pushLog("RTC NTP sync OK");
    await rtcGet();
    return true;
  }, [nextReqId, pushLog, rtcGet, sendReqAwait]);

  return { rtcGet, rtcSetFromHost, rtcSyncNtp };
}
