/**
 * Fetches local network IPv4 addresses: from extension host (Node os.networkInterfaces)
 * when in VS Code webview, or via WebRTC ICE when extension is unavailable / returns empty.
 * Use to show "actual" IP instead of localhost.
 */

import { useCallback, useEffect, useRef, useState } from "react";

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface GetLocalIpsResponse {
  type: string;
  requestId?: string;
  localIps?: string[];
}

/** Discover local IPv4 via WebRTC ICE (works in browser and often in webview). */
function discoverLocalIpsViaWebRTC(): Promise<string[]> {
  return new Promise((resolve) => {
    const ips = new Set<string>();
    const done = () => resolve([...ips]);
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          pc.close();
          done();
          return;
        }
        const c = e.candidate;
        const addr =
          (c as { address?: string }).address ??
          c.candidate?.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/)?.[1];
        if (
          addr &&
          !addr.startsWith("127.") &&
          !c.candidate?.includes(".local")
        ) {
          ips.add(addr);
        }
      };
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(done);
      setTimeout(done, 2000);
    } catch {
      resolve([]);
    }
  });
}

export function useLocalNetworkIps(): {
  localIps: string[];
  primaryIp: string | null;
  fetchIps: () => void;
  isAvailable: boolean;
} {
  const vscodeApi =
    typeof window !== "undefined" ? (window as Window & { __VSCODE_API__?: { postMessage: (m: unknown) => void } }).__VSCODE_API__ : undefined;
  const isAvailable = vscodeApi != null;

  const [localIps, setLocalIps] = useState<string[]>([]);
  const pendingRef = useRef<Map<string, (ips: string[]) => void>>(new Map());

  const handleMessage = useCallback((event: MessageEvent<GetLocalIpsResponse>) => {
    const msg = event.data;
    if (msg?.type !== "get-local-ips-response") return;
    const reqId = msg.requestId;
    if (!reqId) return;
    const resolve = pendingRef.current.get(reqId);
    if (!resolve) return;
    pendingRef.current.delete(reqId);
    resolve(msg.localIps ?? []);
  }, []);

  const fetchIps = useCallback(() => {
    if (!vscodeApi) {
      discoverLocalIpsViaWebRTC().then(setLocalIps);
      return;
    }
    const requestId = nextRequestId();
    const promise = new Promise<string[]>((resolve) => {
      pendingRef.current.set(requestId, resolve);
    });
    promise.then((ips) => setLocalIps(ips));
    vscodeApi.postMessage({ type: "get-local-ips", requestId });
  }, [vscodeApi]);

  // Register listener first, then send request; also run WebRTC fallback when extension returns empty
  useEffect(() => {
    if (!isAvailable) {
      discoverLocalIpsViaWebRTC().then(setLocalIps);
      return;
    }
    window.addEventListener("message", handleMessage);
    const requestId = nextRequestId();
    pendingRef.current.set(
      requestId,
      (ips: string[]) => {
        setLocalIps(ips);
        if (ips.length === 0) discoverLocalIpsViaWebRTC().then(setLocalIps);
      }
    );
    vscodeApi?.postMessage({ type: "get-local-ips", requestId });
    return () => {
      window.removeEventListener("message", handleMessage);
      pendingRef.current.delete(requestId);
    };
  }, [isAvailable, handleMessage, vscodeApi]);

  const primaryIp = localIps.length > 0 ? localIps[0] : null;

  return { localIps, primaryIp, fetchIps, isAvailable };
}
