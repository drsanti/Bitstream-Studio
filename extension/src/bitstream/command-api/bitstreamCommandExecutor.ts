import type { HostSession } from "../session/host-session";
import { bitstreamCommandRegistry } from "./bitstreamCommandRegistry";
import type {
  BitstreamCommandEnvelope,
  BitstreamCommandRequest,
  BitstreamCommandResultMap,
  BitstreamCommandType,
} from "./bitstreamCommandTypes";

/** Context for {@link executeBitstreamCommand} observers (diag fan-out, telemetry, tests). */
export interface BitstreamCommandOutcomeContext<T extends BitstreamCommandType = BitstreamCommandType> {
  session: HostSession;
  command: Extract<BitstreamCommandRequest, { type: T }>;
  envelope: BitstreamCommandEnvelope<T>;
}

export interface ExecuteBitstreamCommandOptions<T extends BitstreamCommandType = BitstreamCommandType> {
  /** Called after the handler finishes (success or caught failure). Must not throw — errors are logged. */
  onOutcome?: (ctx: BitstreamCommandOutcomeContext<T>) => void | Promise<void>;
}

async function safeInvokeOutcome<T extends BitstreamCommandType>(
  ctx: BitstreamCommandOutcomeContext<T>,
  onOutcome: NonNullable<ExecuteBitstreamCommandOptions<T>["onOutcome"]>,
): Promise<void> {
  try {
    await onOutcome(ctx);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[executeBitstreamCommand] onOutcome error: ${message}`);
  }
}

export async function executeBitstreamCommand<T extends BitstreamCommandType>(
  session: HostSession,
  command: Extract<BitstreamCommandRequest, { type: T }>,
  options?: ExecuteBitstreamCommandOptions<T>,
): Promise<BitstreamCommandEnvelope<T>> {
  const handler = bitstreamCommandRegistry[command.type] as (
    sessionArg: HostSession,
    commandArg: Extract<BitstreamCommandRequest, { type: T }>,
  ) => Promise<BitstreamCommandResultMap[T]>;

  try {
    const data = await handler(session, command);
    const requestId =
      "payload" in command &&
      command.payload &&
      typeof command.payload === "object" &&
      "requestId" in command.payload &&
      typeof command.payload.requestId === "string"
        ? command.payload.requestId
        : undefined;
    const envelope: BitstreamCommandEnvelope<T> = {
      ok: true,
      type: command.type,
      requestId,
      data,
    };
    if (options?.onOutcome) {
      await safeInvokeOutcome({ session, command, envelope }, options.onOutcome);
    }
    return envelope;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    // UI currently runs in "no-ACK" mode. If the bridge responds without `ackFrameB64` (because it
    // intentionally executed the command as fire-and-forget), do not treat it as a fatal runtime error
    // and do not spam console/UI overlays.
    if (/WriteAwaitAck missing ackFrameB64/i.test(msg)) {
      const requestId =
        "payload" in command &&
        command.payload &&
        typeof command.payload === "object" &&
        "requestId" in command.payload &&
        typeof command.payload.requestId === "string"
          ? command.payload.requestId
          : undefined;
      const envelope: BitstreamCommandEnvelope<T> = {
        ok: false,
        type: command.type,
        requestId,
        error: msg,
      };
      if (options?.onOutcome) {
        await safeInvokeOutcome({ session, command, envelope }, options.onOutcome);
      }
      return envelope;
    }
    // UI currently runs in "fire-and-forget" mode for interactive controls. ACK timeouts can happen
    // under load or when rapidly toggling controls; keep the signal but avoid console spam.
    if (
      command.type === "sensor.bmi270.mode.set" &&
      /ACK timeout/i.test(msg)
    ) {
      const requestId =
        "payload" in command &&
        command.payload &&
        typeof command.payload === "object" &&
        "requestId" in command.payload &&
        typeof command.payload.requestId === "string"
          ? command.payload.requestId
          : undefined;
      const envelope: BitstreamCommandEnvelope<T> = {
        ok: false,
        type: command.type,
        requestId,
        error: msg,
      };
      if (options?.onOutcome) {
        await safeInvokeOutcome({ session, command, envelope }, options.onOutcome);
      }
      return envelope;
    }
    // When controls are moved rapidly, the bridge can coalesce requests and explicitly supersede older ones.
    // This is expected and should not be treated as a real error (otherwise it spams console and UI).
    if (/Superseded by newer sensor configuration request/i.test(msg)) {
      const requestId =
        "payload" in command &&
        command.payload &&
        typeof command.payload === "object" &&
        "requestId" in command.payload &&
        typeof command.payload.requestId === "string"
          ? command.payload.requestId
          : undefined;
      const envelope: BitstreamCommandEnvelope<T> = {
        ok: false,
        type: command.type,
        requestId,
        // Keep this as a non-fatal signal; callers that want strictness can still inspect `error`.
        error: msg,
      };
      if (options?.onOutcome) {
        await safeInvokeOutcome({ session, command, envelope }, options.onOutcome);
      }
      return envelope;
    }
    if (error instanceof Error) {
      // Always log unexpected runtime stacks; otherwise UI may only see `message` and lose the origin.
      console.error(`[executeBitstreamCommand] ${command.type} failed: ${error.message}`, error);
    } else {
      console.error(`[executeBitstreamCommand] ${command.type} failed: ${String(error)}`);
    }
    const requestId =
      "payload" in command &&
      command.payload &&
      typeof command.payload === "object" &&
      "requestId" in command.payload &&
      typeof command.payload.requestId === "string"
        ? command.payload.requestId
        : undefined;
    const envelope: BitstreamCommandEnvelope<T> = {
      ok: false,
      type: command.type,
      requestId,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    };
    if (options?.onOutcome) {
      await safeInvokeOutcome({ session, command, envelope }, options.onOutcome);
    }
    return envelope;
  }
}
