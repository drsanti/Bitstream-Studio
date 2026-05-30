/*******************************************************************************
 * File Name : bs2CommandExecutor.ts
 *
 * Description : Execute typed BitstreamCommandRequest over Bs2BrokerSession (BS2 wire).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";
import { bs2CommandRegistry } from "./bs2CommandRegistry";
import type {
  BitstreamCommandEnvelope,
  BitstreamCommandRequest,
  BitstreamCommandResultMap,
  BitstreamCommandType,
} from "./bitstreamCommandTypes";

export interface Bs2CommandOutcomeContext<T extends BitstreamCommandType = BitstreamCommandType>
{
  session: Bs2BrokerSession;
  command: Extract<BitstreamCommandRequest, { type: T }>;
  envelope: BitstreamCommandEnvelope<T>;
}

export interface ExecuteBs2BitstreamCommandOptions<T extends BitstreamCommandType = BitstreamCommandType>
{
  onOutcome?: (ctx: Bs2CommandOutcomeContext<T>) => void | Promise<void>;
}

async function safeInvokeOutcome<T extends BitstreamCommandType>(
  ctx: Bs2CommandOutcomeContext<T>,
  onOutcome: NonNullable<ExecuteBs2BitstreamCommandOptions<T>["onOutcome"]>,
): Promise<void>
{
  try
  {
    await onOutcome(ctx);
  }
  catch (error: unknown)
  {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[executeBs2BitstreamCommand] onOutcome error: ${message}`);
  }
}

export async function executeBs2BitstreamCommand<T extends BitstreamCommandType>(
  session: Bs2BrokerSession,
  command: Extract<BitstreamCommandRequest, { type: T }>,
  options?: ExecuteBs2BitstreamCommandOptions<T>,
): Promise<BitstreamCommandEnvelope<T>>
{
  const handler = bs2CommandRegistry[command.type] as (
    sessionArg: Bs2BrokerSession,
    commandArg: Extract<BitstreamCommandRequest, { type: T }>,
  ) => Promise<BitstreamCommandResultMap[T]>;

  try
  {
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
    if (options?.onOutcome)
    {
      await safeInvokeOutcome({ session, command, envelope }, options.onOutcome);
    }
    return envelope;
  }
  catch (error: unknown)
  {
    const msg = error instanceof Error ? error.message : String(error);
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
      errorStack: error instanceof Error ? error.stack : undefined,
    };
    if (options?.onOutcome)
    {
      await safeInvokeOutcome({ session, command, envelope }, options.onOutcome);
    }
    return envelope;
  }
}
