import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store";

export function useBitstreamConnection() {
  return useBitstreamConnectionStore();
}
