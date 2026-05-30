/*******************************************************************************
 * File Name : SimulatorNotRunningNotice.tsx
 *
 * Description : Simulator missing-data notice — uses shared BitstreamFloatingAlertNotice.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 2.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BitstreamFloatingAlertNotice } from "./BitstreamFloatingAlertNotice.js";
import { BITSTREAM_ALERT_PRESET_SIMULATOR } from "./bitstreamFloatingAlertNotice.presets.js";
import { simulatorMissingNoticeMessage } from "../utils/simulatorTelemetryMissingAlert.js";

export function SimulatorNotRunningNotice(props: {
  open: boolean;
  wsConnected: boolean;
  onOpenChange: (open: boolean) => void;
})
{
  const { open, wsConnected, onOpenChange } = props;

  return (
    <BitstreamFloatingAlertNotice
      open={open}
      message={simulatorMissingNoticeMessage(wsConnected)}
      config={BITSTREAM_ALERT_PRESET_SIMULATOR}
      onOpenChange={onOpenChange}
    />
  );
}
