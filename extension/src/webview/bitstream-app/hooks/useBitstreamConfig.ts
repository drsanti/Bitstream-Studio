import { useBitstreamConfigStore } from "../state/bitstreamConfig.store";

export function useBitstreamConfig() {
  return useBitstreamConfigStore();
}
