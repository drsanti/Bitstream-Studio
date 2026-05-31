/*******************************************************************************
 * Ref-counted session for BMI270 draft-until-Apply (stream mode + fusion feed).
 * Shared by Sensor Telemetry Configuration pane and Node Inspector Settings deck.
 ******************************************************************************/

import { useBmi270FirmwareExtrasDraftStore } from "../../bitstream-app/state/bmi270FirmwareExtrasDraft.store.js";

let deferFirmwareApplyRefCount = 0;

/** Enable defer-until-Apply while at least one draft sensor cfg surface is mounted. */
export function acquireBmi270DeferFirmwareApplySession(): () => void {
  deferFirmwareApplyRefCount += 1;
  if (deferFirmwareApplyRefCount === 1) {
    useBmi270FirmwareExtrasDraftStore.getState().setDeferFirmwareApply(true);
  }
  return () => {
    deferFirmwareApplyRefCount = Math.max(0, deferFirmwareApplyRefCount - 1);
    if (deferFirmwareApplyRefCount === 0) {
      const store = useBmi270FirmwareExtrasDraftStore.getState();
      store.setDeferFirmwareApply(false);
      store.resetBaselines();
    }
  };
}
