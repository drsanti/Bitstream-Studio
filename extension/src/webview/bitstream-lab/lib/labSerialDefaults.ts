/*******************************************************************************
 * File Name : labSerialDefaults.ts
 *
 * Description : Default UART settings for Bitstream Lab (BS2 firmware).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/** BS2 wire default on PSoC Edge bring-up. */
export const LAB_DEFAULT_BAUD = 921600;

export const LAB_BAUD_OPTIONS: readonly number[] = [
  921600, 460800, 230400, 115200, 57600, 38400, 9600,
] as const;
