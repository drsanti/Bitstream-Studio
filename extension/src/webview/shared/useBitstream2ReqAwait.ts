import { useCallback } from "react";
import type { Bitstream2HostReqPayload } from "../../bitstream2/bridge/protocol";
import {
  sendBitstream2ReqAwait,
  type Bs2ReqAwaitResult,
} from "./sendBitstream2ReqAwait";

export type { Bs2ReqAwaitResult };

/**
 * Publish `bitstream2/req` and wait for matching `bitstream2/res` by requestId.
 * Shared by Bitstream App, simulator dashboard, and standalone BS2 monitor.
 */
export function useBitstream2ReqAwait() {
  const sendReqAwait = useCallback(
    async (
      partial: Omit<Bitstream2HostReqPayload, "requestId"> & { requestId?: string },
      timeoutMs = 2000,
    ): Promise<Bs2ReqAwaitResult> => {
      return sendBitstream2ReqAwait(partial, timeoutMs);
    },
    [],
  );

  return { sendReqAwait };
}
