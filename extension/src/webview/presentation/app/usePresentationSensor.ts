import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import {
  presentationBmi270FromSample,
  presentationBmm350FromSample,
  presentationDps368FromSample,
  presentationSht40FromSample,
  type PresentationBmi270Frame,
  type PresentationBmm350Frame,
  type PresentationDps368Frame,
  type PresentationSht40Frame,
} from "../display/selectors";

/** Live BMI270 frame from Bitstream Studio store — no separate WebSocket. */
export function usePresentationBmi270(): PresentationBmi270Frame {
  const sample = useBitstreamLiveStore((s) => s.latestByHint.bmi270);
  return presentationBmi270FromSample(sample);
}

/** Live BMM350 frame from Bitstream Studio store — no separate WebSocket. */
export function usePresentationBmm350(): PresentationBmm350Frame {
  const sample = useBitstreamLiveStore((s) => s.latestByHint.bmm350);
  return presentationBmm350FromSample(sample);
}

/** Live DPS368 frame from Bitstream Studio store — no separate WebSocket. */
export function usePresentationDps368(seaLevelHpa = 1013.25): PresentationDps368Frame {
  const sample = useBitstreamLiveStore((s) => s.latestByHint.dps368);
  return presentationDps368FromSample(sample, seaLevelHpa);
}

/** Live SHT40 frame from Bitstream Studio store — no separate WebSocket. */
export function usePresentationSht40(): PresentationSht40Frame {
  const sample = useBitstreamLiveStore((s) => s.latestByHint.sht40);
  return presentationSht40FromSample(sample);
}
