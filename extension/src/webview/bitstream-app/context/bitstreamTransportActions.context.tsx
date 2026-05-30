import { createContext, useContext, type ReactNode } from "react";
import type {
  Bmi270FusionFeedUpdatedPayload,
  Bmi270StreamModeUpdatedPayload,
} from "../../../serialport-bridge/protocol.js";

/**
 * Low-level session command bridge (used by optional sensor setup effects that run
 * under `BitstreamAppWrapper`, e.g. BMI270 stream-mode sync effect).
 * Multi-sensor config and UI should keep using `useBitstreamAppControl`.
 */
export type BitstreamTransportActions = {
  /** Legacy v1 `HostSession` removed; always returns `null` until BS2 command session is modeled. */
  requireConnectedSession: (actionName: string) => null;
  runAction: (name: string, action: () => Promise<void>) => Promise<void>;
  /** Fan-out verified BMI270 stream mode to other webview instances on the same broker. */
  publishBmi270StreamModeUpdated: (
    payload: Omit<Bmi270StreamModeUpdatedPayload, "instanceToken">,
  ) => void;
  /** Fan-out verified BMI270 fusion feed interval to other webview instances on the same broker. */
  publishBmi270FusionFeedUpdated: (
    payload: Omit<Bmi270FusionFeedUpdatedPayload, "instanceToken">,
  ) => void;
  /**
   * True after post-handshake SENSOR_CFG cold sync (GET × 4). Gates BMI270 stream-mode sync.
   */
  firmwareSensorTruthReady: boolean;
  /** BMI270 output mode (raw/fusion/hybrid): pending badge before `sensor.bmi270.mode.set` completes. */
  declareBmi270OutputModePending: () => void;
  /** Finish BMI270 output-mode apply — only updates ack when BMI270 `sensorConfigAck` is pending (no stale ok/error). */
  completeBmi270OutputModeApply: (ok: boolean, message?: string) => void;
  /** Same as Telemetry link diagnostics → Reconnect telemetry (BS2 UART transport recycle). */
  reconnectTelemetry: () => void;
};

const BitstreamTransportActionsContext =
  createContext<BitstreamTransportActions | null>(null);

export function useBitstreamTransportActions(): BitstreamTransportActions {
  const ctx = useContext(BitstreamTransportActionsContext);
  if (!ctx) {
    throw new Error(
      "useBitstreamTransportActions must be used under BitstreamAppWrapper",
    );
  }
  return ctx;
}

/** Same as {@link useBitstreamTransportActions}, but returns null when no provider (e.g. Sensor Studio mounted standalone). */
export function useBitstreamTransportActionsOptional(): BitstreamTransportActions | null {
  return useContext(BitstreamTransportActionsContext);
}

export function BitstreamTransportActionsProvider(props: {
  value: BitstreamTransportActions;
  children: ReactNode;
}) {
  const { value, children } = props;
  return (
    <BitstreamTransportActionsContext.Provider value={value}>
      {children}
    </BitstreamTransportActionsContext.Provider>
  );
}
