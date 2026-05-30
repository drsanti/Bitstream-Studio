/*******************************************************************************
 * File Name : bitstream-host-session-attach.ts
 *
 * Description : Deprecated v1 HostSession attach — re-exports BS2 attach for compatibility.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/**
 * @deprecated MCP and AI bridge use {@link openBitstreamBs2SessionFromCliOptions} and
 * {@link Bs2BrokerSession}. This module re-exports CLI parsing and maps the old open helper name.
 */
export {
  getArgFromArgv,
  parseBitstreamAttachCliOptions,
  type BitstreamAttachCliOptions,
} from "./bitstream-attach-cli";

export {
  openBitstreamBs2SessionFromCliOptions,
  openBitstreamBs2SessionFromCliOptions as openBitstreamHostSessionFromCliOptions,
  type OpenBitstreamBs2SessionResult,
  type OpenBitstreamBs2SessionResult as OpenBitstreamHostSessionResult,
} from "./bitstream-bs2-session-attach";
