import { useEffect, useRef } from "react";
import type { Bmi270StreamModeUi } from "../state/bitstreamConfig.store.js";
import { consumeBmi270StreamModeRemoteFirmwareSendSkip } from "../bmi270/bmi270StreamModeBrokerSync.js";
import { consumeBmi270StreamModeColdSynced } from "../bmi270/bmi270StreamModeColdSync.js";
import { consumeBmi270StreamModeRetry } from "../bmi270/bmi270StreamModeRetryRequest.js";
import { useBitstreamConnection } from "../hooks/useBitstreamConnection.js";
import { useBitstreamTransportActions } from "../context/bitstreamTransportActions.context.js";
import { BMI270_MODE_COMMAND_TIMEOUT_MS } from "../constants/sensorConfigPipeline.js";
import { withTimeout } from "../utils/withTimeout.js";
import { usesBs2ControlPlane } from "../utils/bitstreamTelemetryTransport.js";
import { useBitstream2Bmi270Transport } from "../hooks/useBitstream2Bmi270Transport.js";
import { useBs2ControlReady } from "../hooks/useBs2ControlReady.js";
import { useLinkHandshakeSatisfied } from "../hooks/useLinkHandshakeSatisfied.js";
import { useBmi270FirmwareExtrasDraftStore } from "../state/bmi270FirmwareExtrasDraft.store.js";

/**
 * BMI270-only sync effect: once transport handshake passes and firmware truth is ready,
 * reconcile UI stream mode with firmware (BS2 `BMI270_MODE_SET`).
 * Renders nothing; keep under `BitstreamAppWrapper`.
 */
export type Bmi270StreamMode = Bmi270StreamModeUi;

export function Bmi270StreamModeSyncEffect(props: { mode?: Bmi270StreamModeUi }) {
  const mode = props.mode ?? "hybrid";
  const linkHandshakeOk = useLinkHandshakeSatisfied();
  const { pushLog } = useBitstreamConnection();
  const {
    runAction,
    publishBmi270StreamModeUpdated,
    firmwareSensorTruthReady,
    completeBmi270OutputModeApply,
  } = useBitstreamTransportActions();
  const { setStreamMode } = useBitstream2Bmi270Transport();
  const useBs2 = usesBs2ControlPlane();
  const bs2Ready = useBs2ControlReady();
  const deferFirmwareApply = useBmi270FirmwareExtrasDraftStore((s) => s.deferFirmwareApply);
  const modeCommandSentRef = useRef<Bmi270StreamModeUi | null>(null);

  useEffect(() => {
    if (!linkHandshakeOk) {
      modeCommandSentRef.current = null;
    }
  }, [linkHandshakeOk]);

  useEffect(() => {
    if (!linkHandshakeOk) {
      return;
    }
    if (!firmwareSensorTruthReady) {
      return;
    }
    if (consumeBmi270StreamModeRetry()) {
      modeCommandSentRef.current = null;
    }
    const coldSynced = consumeBmi270StreamModeColdSynced();
    if (coldSynced !== null) {
      modeCommandSentRef.current = coldSynced;
      if (coldSynced === mode) {
        completeBmi270OutputModeApply(true);
      }
      return;
    }
    if (consumeBmi270StreamModeRemoteFirmwareSendSkip()) {
      modeCommandSentRef.current = mode;
      completeBmi270OutputModeApply(true);
      return;
    }
    if (modeCommandSentRef.current === mode) {
      completeBmi270OutputModeApply(true);
      return;
    }

    /* Configuration pane defers BMI270_MODE_SET until Apply — cold-sync flags only. */
    if (deferFirmwareApply) {
      return;
    }

    if (useBs2) {
      if (!bs2Ready.ready) {
        completeBmi270OutputModeApply(false, bs2Ready.reason === "com_closed" ? "COM not open" : "Transport not connected");
        return;
      }
    }

    const modeCode = mode === "raw" ? 0 : mode === "fusion" ? 1 : 2;
    modeCommandSentRef.current = mode;

    const modeTimeoutMessage = "BMI270 mode command timed out";

    void runAction("Set BMI270 mode", async () => {
      try {
        if (useBs2) {
          const res = await withTimeout(
            setStreamMode(mode, BMI270_MODE_COMMAND_TIMEOUT_MS),
            BMI270_MODE_COMMAND_TIMEOUT_MS,
            modeTimeoutMessage,
          );
          if (!res.ok) {
            modeCommandSentRef.current = null;
            completeBmi270OutputModeApply(false, res.error ?? "BMI270 mode command failed");
            throw new Error(res.error ?? "BMI270 mode command failed");
          }
          pushLog(`BMI270 mode set (BS2): ${res.appliedMode} (mode=${modeCode})`);
          publishBmi270StreamModeUpdated({
            bmi270StreamMode: res.appliedMode,
            firmwareApplied: true,
            timestampMs: Date.now(),
          });
          completeBmi270OutputModeApply(true);
          return;
        }

        completeBmi270OutputModeApply(false, "BS2 control plane not active");
        throw new Error("BS2 control plane not active");
      }
      catch (err: unknown)
      {
        modeCommandSentRef.current = null;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === modeTimeoutMessage) {
          completeBmi270OutputModeApply(false, msg);
        }
        throw err instanceof Error ? err : new Error(msg);
      }
    });
  }, [
    mode,
    linkHandshakeOk,
    firmwareSensorTruthReady,
    completeBmi270OutputModeApply,
    pushLog,
    publishBmi270StreamModeUpdated,
    runAction,
    setStreamMode,
    useBs2,
    bs2Ready.ready,
    bs2Ready.reason,
    deferFirmwareApply,
  ]);

  return null;
}
