/*******************************************************************************
 * File Name : SensorCfgApplySuccessDialog.tsx
 *
 * Description : SENSOR_CFG apply success — thin wrapper over TRNFloatingNotice.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 2.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { TRNFloatingNotice } from "../../../ui/TRN";

export function SensorCfgApplySuccessDialog(props: {
  open: boolean;
  title?: string;
  message?: string;
})
{
  const {
    open,
    title = "Config applied",
    message = "Sensor configuration was written to the board.",
  } = props;

  return (
    <TRNFloatingNotice
      open={open}
      variant="success"
      title={title}
      message={message}
      autoDismissMs={3200}
    />
  );
}
