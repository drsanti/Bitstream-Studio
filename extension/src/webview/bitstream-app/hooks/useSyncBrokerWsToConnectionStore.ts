/*******************************************************************************
 * File Name : useSyncBrokerWsToConnectionStore.ts
 *
 * Description : Mirror ws-client-store connection state into bitstreamConnection
 *               (Server icon + toolbar) on refresh and reconnect.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect } from "react";
import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store";
import { useWsClientStore } from "../../ws-client-store";

/**
 * Keep `backendWsState` aligned with the real WebSocket client (also updated by connectSession).
 */
export function useSyncBrokerWsToConnectionStore(): void {
  useEffect(() => {
    const apply = () => {
      const { connectionState } = useWsClientStore.getState();
      useBitstreamConnectionStore.getState().setBackendWsState(connectionState);
    };

    apply();

    return useWsClientStore.subscribe((state, prev) => {
      if (state.connectionState !== prev.connectionState) {
        useBitstreamConnectionStore.getState().setBackendWsState(state.connectionState);
      }
    });
  }, []);
}
