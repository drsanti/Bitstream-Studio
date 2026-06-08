import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import {
  telemetrySourceDisplayLabel,
  useBitstreamTelemetrySourceStore,
} from "../../bitstream-app/state/bitstreamTelemetrySource.store";
import { useWsClientStore } from "../../ws-client-store";
import {
  buildPresentationSensorRows,
  type PresentationSensorRow,
} from "../display/sensor-summary";

export type PresentationBridgeStatus = {
  wsConnected: boolean;
  comConnected: boolean;
  linkLive: boolean;
  telemetryBackend: string;
  handshakeState: string;
  sampleCount: number;
  evtSensorRxCount: number;
  firmwareLiveness: string;
};

export function usePresentationBridgeStatus(): PresentationBridgeStatus {
  const comConnected = useBitstreamConnectionStore((s) => s.connected);
  const wsConnected = useWsClientStore((s) => s.connected);
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const sampleCount = useBitstreamLiveStore((s) => s.sampleCount);
  const evtSensorRxCount = useBitstreamLiveStore((s) => s.bs2EvtSensorRxCount);
  const firmwareLiveness = useBitstreamLiveStore((s) => s.firmwareLiveness);

  return {
    wsConnected,
    comConnected,
    linkLive: wsConnected && comConnected,
    telemetryBackend: telemetrySourceDisplayLabel(backend),
    handshakeState,
    sampleCount,
    evtSensorRxCount,
    firmwareLiveness,
  };
}

export function usePresentationSensorRows(): PresentationSensorRow[] {
  const latestByHint = useBitstreamLiveStore((s) => s.latestByHint);
  const lastAtByHint = useBitstreamLiveStore((s) => s.lastAtByHint);

  return buildPresentationSensorRows({
    latestByHint: {
      bmi270: latestByHint.bmi270,
      bmm350: latestByHint.bmm350,
      sht40: latestByHint.sht40,
      dps368: latestByHint.dps368,
    },
    lastAtByHint: {
      bmi270: lastAtByHint.bmi270,
      bmm350: lastAtByHint.bmm350,
      sht40: lastAtByHint.sht40,
      dps368: lastAtByHint.dps368,
    },
  });
}
