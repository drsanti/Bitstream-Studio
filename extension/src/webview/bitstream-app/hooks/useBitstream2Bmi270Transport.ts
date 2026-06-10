import { useCallback, useMemo } from "react";
import { BS2_CMD } from "../../../bitstream2/domains/config/commands";
import {
  bmi270StreamModeCodeToUi,
  bmi270StreamModeUiToCode,
  decodeBmi270FusionFeedResBody,
  decodeBmi270ModeResBody,
  encodeBmi270FusionFeedSetBody,
  encodeBmi270ModeSetBody,
  type Bs2Bmi270StreamMode,
} from "../../../bitstream2/domains/bmi270/bmi270-control";
import { bytesToBase64 } from "../../../bitstream2/util/base64";
import type { Bmi270StreamModeUi } from "../state/bitstreamConfig.store";
import { useBitstream2ReqAwait } from "./useBitstream2ReqAwait";

/** BMI270 output mode + fusion feed over `bitstream2/req` (BS2 UART or simulator). */
export function useBitstream2Bmi270Transport() {
  const { sendReqAwait } = useBitstream2ReqAwait();

  const setStreamMode = useCallback(
    async (mode: Bmi270StreamModeUi, timeoutMs = 2000) => {
      const code = bmi270StreamModeUiToCode(mode);
      const res = await sendReqAwait(
        {
          requestId: `app-bmi270-mode-${Date.now()}`,
          cmdId: BS2_CMD.BMI270_MODE_SET,
          bodyB64: bytesToBase64(encodeBmi270ModeSetBody(code)),
          timeoutMs,
        },
        timeoutMs,
      );
      const applied = decodeBmi270ModeResBody(res.body);
      return {
        ...res,
        appliedMode: applied != null ? bmi270StreamModeCodeToUi(applied) : mode,
      };
    },
    [sendReqAwait],
  );

  const getStreamMode = useCallback(
    async (timeoutMs = 2000) => {
      const res = await sendReqAwait(
        {
          requestId: `app-bmi270-mode-get-${Date.now()}`,
          cmdId: BS2_CMD.BMI270_MODE_GET,
          timeoutMs,
        },
        timeoutMs,
      );
      const mode = decodeBmi270ModeResBody(res.body);
      return {
        ...res,
        mode: mode != null ? bmi270StreamModeCodeToUi(mode) : null,
      };
    },
    [sendReqAwait],
  );

  const setFusionFeedIntervalMs = useCallback(
    async (intervalMs: number, timeoutMs = 2000) => {
      const res = await sendReqAwait(
        {
          requestId: `app-bmi270-fusion-feed-${Date.now()}`,
          cmdId: BS2_CMD.BMI270_FUSION_FEED_SET,
          bodyB64: bytesToBase64(encodeBmi270FusionFeedSetBody(intervalMs)),
          timeoutMs,
        },
        timeoutMs,
      );
      const appliedMs = decodeBmi270FusionFeedResBody(res.body);
      return { ...res, appliedIntervalMs: appliedMs ?? intervalMs };
    },
    [sendReqAwait],
  );

  const getFusionFeedIntervalMs = useCallback(
    async (timeoutMs = 2000) => {
      const res = await sendReqAwait(
        {
          requestId: `app-bmi270-fusion-feed-get-${Date.now()}`,
          cmdId: BS2_CMD.BMI270_FUSION_FEED_GET,
          timeoutMs,
        },
        timeoutMs,
      );
      const intervalMs = decodeBmi270FusionFeedResBody(res.body);
      return { ...res, intervalMs };
    },
    [sendReqAwait],
  );

  /* Stable identity — consumers use this object in effect deps. */
  return useMemo(
    () => ({
      setStreamMode,
      getStreamMode,
      setFusionFeedIntervalMs,
      getFusionFeedIntervalMs,
    }),
    [setStreamMode, getStreamMode, setFusionFeedIntervalMs, getFusionFeedIntervalMs],
  );
}

export type { Bs2Bmi270StreamMode };
