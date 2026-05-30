/*******************************************************************************
 * File Name : UartFirmwareNotConnectedNotice.tsx
 *
 * Description : UART missing-handshake notice — uses shared BitstreamFloatingAlertNotice.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BitstreamFloatingAlertNotice } from "./BitstreamFloatingAlertNotice.js";
import { BITSTREAM_ALERT_PRESET_UART } from "./bitstreamFloatingAlertNotice.presets.js";

export function UartFirmwareNotConnectedNotice(props: {
  open: boolean;
  message: string;
  onOpenChange: (open: boolean) => void;
})
{
  const { open, message, onOpenChange } = props;

  return (
    <BitstreamFloatingAlertNotice
      open={open}
      message={message}
      config={BITSTREAM_ALERT_PRESET_UART}
      onOpenChange={onOpenChange}
    />
  );
}
