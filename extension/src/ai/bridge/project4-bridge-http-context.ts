import { AsyncLocalStorage } from "node:async_hooks";
import type { Project4McuHttpPayload } from "../protocol/project4-mcu-http-payload";

/** Async context so **`project4_*`** MCP tool handlers resolve MCU URLs during **`runAnthropicToolLoop`** without threading **`ws`** through Anthropic SDK callbacks. */
const als = new AsyncLocalStorage<Project4McuHttpPayload>();

export async function runWithProject4BridgeHttp<T>(
  payload: Project4McuHttpPayload | null | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  if (payload == null) {
    return fn();
  }
  return als.run(payload, fn);
}

export function getProject4BridgeHttpOrThrow(): Project4McuHttpPayload {
  const s = als.getStore();
  if (s == null) {
    throw new Error(
      "Project 4 MCP tools require project4McuHttp on ai/request (MCU base URL and paths).",
    );
  }
  return s;
}
