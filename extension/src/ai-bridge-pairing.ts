import { randomUUID } from "node:crypto";

let aiBridgePairingToken: string | null = null;

export function ensureAiBridgePairingToken(): string {
  if (!aiBridgePairingToken) {
    aiBridgePairingToken = randomUUID();
  }
  return aiBridgePairingToken;
}

export function getAiBridgePairingToken(): string {
  return ensureAiBridgePairingToken();
}

