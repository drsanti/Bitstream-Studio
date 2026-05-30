import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";
import type { BitstreamMcpRuntimeContext } from "./types";

export interface CreateBitstreamMcpRuntimeContextOptions {
  getSession: () => Bs2BrokerSession | null;
  isRuntimeReady?: () => boolean;
  getRuntimeSummary?: () => Record<string, unknown>;
}

export function createBitstreamMcpRuntimeContext(
  options: CreateBitstreamMcpRuntimeContextOptions,
): BitstreamMcpRuntimeContext {
  return {
    getSession: options.getSession,
    isRuntimeReady: options.isRuntimeReady,
    getRuntimeSummary: options.getRuntimeSummary,
  };
}
