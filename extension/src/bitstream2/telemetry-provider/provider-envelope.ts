import {
  BITSTREAM_TELEMETRY_PROVIDER_API_VERSION,
  type BitstreamTelemetryProviderEnvelope,
  type BitstreamTelemetryProviderEventType,
} from "./types";

export function providerEnvelope<TPayload>(
  type: BitstreamTelemetryProviderEventType,
  payload: TPayload,
): BitstreamTelemetryProviderEnvelope<TPayload> {
  return {
    type,
    v: BITSTREAM_TELEMETRY_PROVIDER_API_VERSION,
    payload,
  };
}
