export type CourseTelemetryIframeClient = {
  source: MessageEventSource;
  /** `event.origin` from the iframe `bitstream:ready` handshake. */
  targetOrigin: string;
};

/** PostMessage target for srcdoc / opaque iframe origins. */
export function resolveTelemetryPostMessageTargetOrigin(handshakeOrigin: string): string {
  if (handshakeOrigin === "null" || handshakeOrigin.length === 0) {
    return "*";
  }
  return handshakeOrigin;
}

export function isRegisteredCourseTelemetryIframe(
  source: MessageEventSource | null,
  clients: ReadonlyMap<string, CourseTelemetryIframeClient>,
): boolean {
  if (source == null) {
    return false;
  }
  for (const client of clients.values()) {
    if (client.source === source) {
      return true;
    }
  }
  return false;
}

export function postTelemetryEnvelopeToIframe(
  client: CourseTelemetryIframeClient,
  envelope: unknown,
): void {
  if (!("postMessage" in client.source) || typeof client.source.postMessage !== "function") {
    return;
  }
  client.source.postMessage(envelope, resolveTelemetryPostMessageTargetOrigin(client.targetOrigin));
}
