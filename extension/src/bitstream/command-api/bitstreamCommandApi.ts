import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";
import { executeBs2BitstreamCommand } from "./bs2CommandExecutor";
import type {
  BitstreamCommandEnvelope,
  BitstreamCommandRequest,
  BitstreamCommandType,
} from "./bitstreamCommandTypes";

/** Observes every successful **`execute()`** path (including **`executeRaw`** after validation). Not invoked for invalid **`executeRaw`** payloads. */
export interface BitstreamCommandApiOutcomeContext<T extends BitstreamCommandType = BitstreamCommandType> {
  session: Bs2BrokerSession | null;
  command: Extract<BitstreamCommandRequest, { type: T }>;
  envelope: BitstreamCommandEnvelope<T>;
}

const SUPPORTED_COMMAND_TYPES: BitstreamCommandType[] = [
  "handshake.run",
  "sensor.cfg.set",
  "sensor.cfg.get",
  "sensor.reinit",
  "sensor.bmi270.mode.set",
  "sensor.bmi270.mode.get",
  "sensor.bmi270.fusion.feed.set",
  "sensor.bmi270.fusion.feed.get",
  "stream.pause",
  "stream.resume",
  "diag.stream.start",
  "diag.stream.stop",
  "diag.snapshot.get",
  "diag.task.table.get",
  "diag.task.priority.set",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isBitstreamCommandType(value: unknown): value is BitstreamCommandType {
  return typeof value === "string" && SUPPORTED_COMMAND_TYPES.includes(value as BitstreamCommandType);
}

export function isBitstreamCommandRequest(value: unknown): value is BitstreamCommandRequest {
  if (!isObject(value)) {
    return false;
  }
  if (!isBitstreamCommandType(value.type)) {
    return false;
  }
  // Keep validation lightweight here; command-specific payload validation
  // can be enhanced as MCP schemas are introduced.
  return true;
}

export interface BitstreamCommandApiOptions {
  getSession: () => Bs2BrokerSession | null;
  /**
   * Optional hook for MCP hosts / tests — central place to react to command outcomes (e.g. future
   * diag broker fan-out). Same semantics as {@link executeBitstreamCommand} **`onOutcome`** but
   * also notified when **`session`** is null (no UART stack).
   */
  onCommandOutcome?: <T extends BitstreamCommandType>(
    ctx: BitstreamCommandApiOutcomeContext<T>,
  ) => void | Promise<void>;
}

export class BitstreamCommandApi {
  private readonly getSession: () => Bs2BrokerSession | null;
  private readonly onCommandOutcome?: BitstreamCommandApiOptions["onCommandOutcome"];

  constructor(options: BitstreamCommandApiOptions) {
    this.getSession = options.getSession;
    this.onCommandOutcome = options.onCommandOutcome;
  }

  private async safeNotifyOutcome<T extends BitstreamCommandType>(
    ctx: BitstreamCommandApiOutcomeContext<T>,
  ): Promise<void> {
    if (!this.onCommandOutcome) {
      return;
    }
    try {
      await this.onCommandOutcome(ctx);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[BitstreamCommandApi] onCommandOutcome error: ${message}`);
    }
  }

  listSupportedCommands(): BitstreamCommandType[] {
    return [...SUPPORTED_COMMAND_TYPES];
  }

  async executeRaw(payload: unknown): Promise<BitstreamCommandEnvelope> {
    if (!isBitstreamCommandRequest(payload)) {
      return {
        ok: false,
        type: "handshake.run",
        error: "Invalid Bitstream command payload",
      };
    }
    return this.execute(payload);
  }

  async execute<T extends BitstreamCommandType>(
    command: Extract<BitstreamCommandRequest, { type: T }>,
  ): Promise<BitstreamCommandEnvelope<T>> {
    const session = this.getSession();
    if (!session) {
      const envelope: BitstreamCommandEnvelope<T> = {
        ok: false,
        type: command.type,
        error: "Bitstream session not available",
      };
      await this.safeNotifyOutcome({ session: null, command, envelope });
      return envelope;
    }
    return executeBs2BitstreamCommand(session, command, {
      onOutcome: (ctx) =>
        this.safeNotifyOutcome({
          session: ctx.session,
          command: ctx.command,
          envelope: ctx.envelope,
        }),
    });
  }
}
