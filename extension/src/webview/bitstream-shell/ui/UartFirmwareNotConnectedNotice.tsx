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

import { Usb } from "lucide-react";
import { useCallback } from "react";
import { usePortAdminStore } from "../../serialport/port-admin.store.js";
import { TRNButton } from "../../ui/TRN/TRNButton.js";
import { BitstreamFloatingAlertNotice } from "./BitstreamFloatingAlertNotice.js";
import { BITSTREAM_ALERT_PRESET_UART } from "./bitstreamFloatingAlertNotice.presets.js";

export function UartFirmwareNotConnectedNotice(props: {
  open: boolean;
  message: string;
  onOpenChange: (open: boolean) => void;
})
{
  const { open, message, onOpenChange } = props;
  const openPortAdmin = usePortAdminStore((s) => s.open);

  const handleOpenPortAdmin = useCallback(() => {
    openPortAdmin();
    onOpenChange(false);
  }, [onOpenChange, openPortAdmin]);

  return (
    <BitstreamFloatingAlertNotice
      open={open}
      message={message}
      config={BITSTREAM_ALERT_PRESET_UART}
      onOpenChange={onOpenChange}
      actions={
        <TRNButton
          size="compact"
          className="w-full justify-center"
          prefixIcon={<Usb className="h-3.5 w-3.5" aria-hidden />}
          onClick={handleOpenPortAdmin}
        >
          Port Admin
        </TRNButton>
      }
    />
  );
}
