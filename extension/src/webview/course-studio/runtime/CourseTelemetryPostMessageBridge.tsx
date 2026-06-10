import { useCallback, useEffect, useRef } from "react";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2DevSimStatePayload,
  type Bitstream2HelloPayload,
  type Bitstream2HostResPayload,
  type Bitstream2SensorSamplePayload,
  type Bitstream2TelemetryRoutePayload,
} from "../../../bitstream2/bridge/protocol";
import type { Bs2SensorConfig } from "../../../bitstream2/domains/config/sensor-config";
import {
  buildProviderConfigFromBs2Configs,
  buildProviderConfigPayload,
} from "../../../bitstream2/telemetry-provider/build-provider-config";
import { createProviderStaleResolver } from "../../../bitstream2/telemetry-provider/catalog/provider-stale-ms";
import {
  buildSensorCatalog,
  buildStaleAfterMsBySensorId,
} from "../../../bitstream2/telemetry-provider/catalog/sensor-catalog-source";
import { mapBs2ToProviderSample } from "../../../bitstream2/telemetry-provider/map-provider-sample";
import { executeProviderCommand } from "../../../bitstream2/telemetry-provider/provider-command-handlers";
import { ProviderCommandService } from "../../../bitstream2/telemetry-provider/provider-command-service";
import { devSimConfigsToBs2, fetchLiveSensorConfigs } from "../../../bitstream2/telemetry-provider/provider-live-config";
import { providerEnvelope } from "../../../bitstream2/telemetry-provider/provider-envelope";
import {
  DEFAULT_PROVIDER_STALE_MS,
  ProviderStaleTracker,
} from "../../../bitstream2/telemetry-provider/provider-stale-tracker";
import { BITSTREAM_TELEMETRY_PROVIDER_EVENT } from "../../../bitstream2/telemetry-provider/types";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store";
import { useBitstreamTelemetrySourceStore } from "../../bitstream-app/state/bitstreamTelemetrySource.store";
import { useWsClientStore } from "../../ws-client-store";
import {
  type CourseTelemetryIframeClient,
  isRegisteredCourseTelemetryIframe,
  postTelemetryEnvelopeToIframe,
} from "./courseTelemetryIframeRegistry";

const LISTENER_ID = "course-studio-telemetry-postmessage-bridge";

type ProviderIframeMessage = {
  type?: string;
  v?: number;
  payload?: {
    clientId?: string;
    what?: string;
    requestId?: string;
    command?: string;
    args?: Record<string, unknown>;
  };
};

function isProviderEnvelope(msg: unknown): msg is { type: string; v: number; payload?: unknown } {
  if (msg == null || typeof msg !== "object") {
    return false;
  }
  const m = msg as { type?: unknown; v?: unknown };
  return typeof m.type === "string" && m.type.startsWith("bitstream:") && m.v === 1;
}

/**
 * Forwards decoded BS2 telemetry to Course HTML page iframes via `postMessage`.
 * Iframes handshake with `bitstream:ready`; parent pushes catalog, config, connection, samples.
 */
export function CourseTelemetryPostMessageBridge() {
  const isConnected = useWsClientStore((s) => s.isConnected);
  const transportConnected = useBitstreamConnectionStore((s) => s.connected);
  const serialOpen = useBitstreamConnectionStore((s) => s.serialBridgeStatus?.isOpen === true);
  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);

  const iframeClientsRef = useRef<Map<string, CourseTelemetryIframeClient>>(new Map());
  const routeRef = useRef<"uart" | "simulator">(
    telemetryBackend === "simulator" ? "simulator" : "uart",
  );
  const lastHelloRef = useRef<Bitstream2HelloPayload | null>(null);
  const lastConfigJsonRef = useRef<string | null>(null);
  const liveConfigsRef = useRef<Bs2SensorConfig[]>([]);
  const commandServiceRef = useRef<ProviderCommandService | null>(null);
  const staleTrackerRef = useRef<ProviderStaleTracker | null>(null);

  const configSource = useCallback((): "firmware" | "simulator" => {
    return routeRef.current === "uart" ? "firmware" : "simulator";
  }, []);

  const buildConfig = useCallback(() => {
    if (liveConfigsRef.current.length > 0) {
      return buildProviderConfigFromBs2Configs(liveConfigsRef.current, configSource());
    }
    return buildProviderConfigPayload(configSource());
  }, [configSource]);

  const broadcast = useCallback((envelope: ReturnType<typeof providerEnvelope>) => {
    for (const client of iframeClientsRef.current.values()) {
      postTelemetryEnvelopeToIframe(client, envelope);
    }
  }, []);

  const sendConnection = useCallback(() => {
    const route = routeRef.current;
    broadcast(providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONNECTION, {
      state: isConnected && transportConnected ? "connected" : "disconnected",
      route,
      comOpen: route === "uart" && serialOpen,
      providerReady: true,
    }));
  }, [broadcast, isConnected, serialOpen, transportConnected]);

  const pushConfig = useCallback(() => {
    const config = buildConfig();
    const envelope = providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONFIG, config);
    const json = JSON.stringify(envelope);
    if (json === lastConfigJsonRef.current) {
      return;
    }
    lastConfigJsonRef.current = json;
    broadcast(envelope);
  }, [broadcast, buildConfig]);

  const sendInitialToTarget = useCallback(
    (client: CourseTelemetryIframeClient) => {
      postTelemetryEnvelopeToIframe(
        client,
        providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CATALOG, buildSensorCatalog()),
      );
      postTelemetryEnvelopeToIframe(
        client,
        providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONFIG, buildConfig()),
      );
      postTelemetryEnvelopeToIframe(
        client,
        providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONNECTION, {
          state: isConnected && transportConnected ? "connected" : "disconnected",
          route: routeRef.current,
          comOpen: routeRef.current === "uart" && serialOpen,
          providerReady: true,
        }),
      );
      const hello = lastHelloRef.current;
      if (hello != null) {
        postTelemetryEnvelopeToIframe(
          client,
          providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.HELLO, {
            version: hello.version,
            caps: hello.caps,
            mtuSensor: hello.mtuSensor,
            mtuCtrl: hello.mtuCtrl,
            fwTag: hello.fwTag,
            hostMs: Date.now(),
          }),
        );
      }
    },
    [buildConfig, isConnected, serialOpen, transportConnected],
  );

  useEffect(() => {
    routeRef.current = telemetryBackend === "simulator" ? "simulator" : "uart";
    pushConfig();
    sendConnection();
  }, [pushConfig, sendConnection, telemetryBackend]);

  useEffect(() => {
    sendConnection();
  }, [isConnected, transportConnected, serialOpen, sendConnection]);

  useEffect(() => {
    const publish = useWsClientStore.getState().publish;
    const service = new ProviderCommandService({
      publishReq: async (req) => {
        await publish(BITSTREAM2_TOPICS.REQ, req, 0);
      },
      onRes: () => () => {},
    });
    commandServiceRef.current = service;

    const staleTracker = new ProviderStaleTracker(
      createProviderStaleResolver(buildStaleAfterMsBySensorId(), DEFAULT_PROVIDER_STALE_MS),
      (payload) => {
        broadcast(providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.STALE, payload));
      },
    );
    staleTracker.start();
    staleTrackerRef.current = staleTracker;

    return () => {
      staleTracker.stop();
      staleTrackerRef.current = null;
      service.dispose();
      commandServiceRef.current = null;
    };
  }, [broadcast]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = event.data as ProviderIframeMessage;
      if (!isProviderEnvelope(msg)) {
        return;
      }

      if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.READY) {
        const clientId = msg.payload?.clientId ?? `iframe-${iframeClientsRef.current.size}`;
        if (event.source != null) {
          const client: CourseTelemetryIframeClient = {
            source: event.source,
            targetOrigin: event.origin,
          };
          iframeClientsRef.current.set(clientId, client);
          sendInitialToTarget(client);
        }
        return;
      }

      if (!isRegisteredCourseTelemetryIframe(event.source, iframeClientsRef.current)) {
        return;
      }

      const client = [...iframeClientsRef.current.values()].find((c) => c.source === event.source);
      if (client == null) {
        return;
      }

      if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.REQUEST) {
        const what = msg.payload?.what;
        if (what === "catalog") {
          postTelemetryEnvelopeToIframe(
            client,
            providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CATALOG, buildSensorCatalog()),
          );
        } else if (what === "config") {
          postTelemetryEnvelopeToIframe(
            client,
            providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONFIG, buildConfig()),
          );
        } else if (what === "connection") {
          postTelemetryEnvelopeToIframe(
            client,
            providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.CONNECTION, {
              state: isConnected && transportConnected ? "connected" : "disconnected",
              route: routeRef.current,
              comOpen: routeRef.current === "uart" && serialOpen,
              providerReady: true,
            }),
          );
        }
        return;
      }

      if (msg.type === BITSTREAM_TELEMETRY_PROVIDER_EVENT.COMMAND) {
        const service = commandServiceRef.current;
        const requestId = msg.payload?.requestId ?? `cmd-${Date.now()}`;
        const command = msg.payload?.command ?? "";
        const args = msg.payload?.args ?? {};
        if (service == null) {
          postTelemetryEnvelopeToIframe(
            client,
            providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.RESPONSE, {
              requestId,
              ok: false,
              command,
              data: null,
              error: "shell not ready",
              hostMs: Date.now(),
            }),
          );
          return;
        }
        void executeProviderCommand(service, command, args).then(async (result) => {
          postTelemetryEnvelopeToIframe(
            client,
            providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.RESPONSE, {
              requestId,
              ...result,
            }),
          );
          if (
            result.ok &&
            (command === "sensor.cfg.set" || command === "bmi270.mode.set")
          ) {
            const configs = await fetchLiveSensorConfigs(service);
            if (configs.length > 0) {
              liveConfigsRef.current = configs;
            }
            pushConfig();
          }
        });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [buildConfig, isConnected, pushConfig, sendInitialToTarget, serialOpen, transportConnected]);

  useEffect(() => {
    const addMessageListener = useWsClientStore.getState().addMessageListener;
    const removeMessageListener = useWsClientStore.getState().removeMessageListener;

    const onBrokerMessage = (topic: string, payload: unknown) => {
      if (topic === BITSTREAM2_TOPICS.RES) {
        commandServiceRef.current?.noteRes(payload as Bitstream2HostResPayload);
        return;
      }

      if (topic === BITSTREAM2_TOPICS.DEV_SIM_STATE) {
        const sim = payload as Bitstream2DevSimStatePayload;
        liveConfigsRef.current = devSimConfigsToBs2(sim.configs);
        pushConfig();
        return;
      }

      if (topic === BITSTREAM2_TOPICS.HELLO) {
        const hello = payload as Bitstream2HelloPayload;
        lastHelloRef.current = hello;
        const service = commandServiceRef.current;
        if (service != null) {
          void fetchLiveSensorConfigs(service).then((configs) => {
            if (configs.length > 0) {
              liveConfigsRef.current = configs;
              pushConfig();
            }
          });
        } else {
          pushConfig();
        }
        broadcast(providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.HELLO, {
          version: hello.version,
          caps: hello.caps,
          mtuSensor: hello.mtuSensor,
          mtuCtrl: hello.mtuCtrl,
          fwTag: hello.fwTag,
          hostMs: Date.now(),
        }));
        sendConnection();
        return;
      }

      if (topic === BITSTREAM2_TOPICS.TELEMETRY_ROUTE) {
        const route = payload as Bitstream2TelemetryRoutePayload;
        routeRef.current = route.mode === "uart" ? "uart" : "simulator";
        pushConfig();
        sendConnection();
        return;
      }

      if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
        const sample = mapBs2ToProviderSample(payload as Bitstream2SensorSamplePayload);
        if (sample != null) {
          staleTrackerRef.current?.noteSample(sample);
          broadcast(providerEnvelope(BITSTREAM_TELEMETRY_PROVIDER_EVENT.SAMPLE, sample));
        }
      }
    };

    addMessageListener(LISTENER_ID, onBrokerMessage);
    return () => removeMessageListener(LISTENER_ID);
  }, [broadcast, pushConfig, sendConnection]);

  return null;
}
