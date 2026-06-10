import { useEffect, useMemo, useRef, useState } from "react";
import type { BitstreamTelemetryProviderConfigPayload } from "../build-provider-config";
import type { BitstreamTelemetryProviderSamplePayload } from "../map-provider-sample";
import type { BitstreamTelemetrySensorCatalog } from "../types";
import {
  BitstreamTelemetryClient,
  type BitstreamTelemetryClientOptions,
  type BitstreamTelemetryConnectionPayload,
} from "./BitstreamTelemetryClient";

export type UseBitstreamTelemetryOptions = BitstreamTelemetryClientOptions & {
  /** When set, only update `sample` for this sensor id (e.g. `"dps368"`). */
  sensor?: string;
  autoConnect?: boolean;
};

export type UseBitstreamTelemetryResult = {
  client: BitstreamTelemetryClient;
  catalog: BitstreamTelemetrySensorCatalog | null;
  config: BitstreamTelemetryProviderConfigPayload | null;
  sample: BitstreamTelemetryProviderSamplePayload | null;
  connection: BitstreamTelemetryConnectionPayload | null;
  connected: boolean;
};

export function useBitstreamTelemetry(
  options: UseBitstreamTelemetryOptions = {},
): UseBitstreamTelemetryResult {
  const { sensor, autoConnect = true, url, reconnectMs } = options;
  const client = useMemo(
    () => new BitstreamTelemetryClient({ url, reconnectMs }),
    [url, reconnectMs],
  );

  const [catalog, setCatalog] = useState<BitstreamTelemetrySensorCatalog | null>(null);
  const [config, setConfig] = useState<BitstreamTelemetryProviderConfigPayload | null>(null);
  const [sample, setSample] = useState<BitstreamTelemetryProviderSamplePayload | null>(null);
  const [connection, setConnection] = useState<BitstreamTelemetryConnectionPayload | null>(null);

  const sensorRef = useRef(sensor);
  sensorRef.current = sensor;

  useEffect(() => {
    const unsubs = [
      client.on("catalog", setCatalog),
      client.on("config", setConfig),
      client.on("connection", setConnection),
      client.on("sample", (payload) => {
        const filter = sensorRef.current;
        if (filter != null && payload.sensor !== filter) {
          return;
        }
        setSample(payload);
      }),
    ];

    if (autoConnect) {
      void client.connect().catch(() => {
        // connection state event will follow on close/error
      });
    }

    return () => {
      for (const off of unsubs) {
        off();
      }
      client.disconnect();
    };
  }, [autoConnect, client]);

  const connected =
    connection?.state === "connected" && connection.providerReady === true;

  return { client, catalog, config, sample, connection, connected };
}
