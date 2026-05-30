import {
  normalizeBmi270StreamMode,
  useBitstreamConfigStore,
  type Bmi270StreamModeUi,
} from "../state/bitstreamConfig.store.js";
import { markBmi270StreamModeColdSynced } from "./bmi270StreamModeColdSync.js";
import {
  isBmi270FusionFeedDraftDirty,
  useBmi270FirmwareExtrasDraftStore,
} from "../state/bmi270FirmwareExtrasDraft.store.js";

/**
 * When another client publishes BMI270 stream mode, we merge into the store and set this flag so
 * the BMI270 stream-mode sync effect does **not** send a duplicate `sensor.bmi270.mode.set`.
 */
let pendingRemoteSkipFirmwareSend = false;

export function applyBmi270StreamModeFromBroker(
  mode: Bmi270StreamModeUi,
  options?: { firmwareApplied?: boolean },
): void {
  const current = useBitstreamConfigStore.getState().bmi270StreamMode;
  if (current === mode && !options?.firmwareApplied) {
    pendingRemoteSkipFirmwareSend = false;
    return;
  }
  pendingRemoteSkipFirmwareSend = true;
  useBitstreamConfigStore.getState().setBmi270StreamMode(mode);

  const draftStore = useBmi270FirmwareExtrasDraftStore.getState();
  if (options?.firmwareApplied) {
    draftStore.commitStreamModeBaseline(mode);
    markBmi270StreamModeColdSynced(mode);
    if (!isBmi270FusionFeedDraftDirty()) {
      draftStore.clearExtrasUserEdited();
    }
    return;
  }

  if (draftStore.deferFirmwareApply) {
    draftStore.markExtrasUserEdited();
  }
}

export function applyBmi270StreamModeFromBrokerUnknown(raw: unknown): void {
  if (raw == null || typeof raw !== "object") {
    return;
  }
  const o = raw as { bmi270StreamMode?: unknown; firmwareApplied?: unknown };
  applyBmi270StreamModeFromBroker(normalizeBmi270StreamMode(o.bmi270StreamMode), {
    firmwareApplied: o.firmwareApplied === true,
  });
}

export function consumeBmi270StreamModeRemoteFirmwareSendSkip(): boolean {
  if (!pendingRemoteSkipFirmwareSend) {
    return false;
  }
  pendingRemoteSkipFirmwareSend = false;
  return true;
}
