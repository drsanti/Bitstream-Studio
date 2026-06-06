import type { FlowNodeHeaderBadgeTone } from "../flow-node/FlowNodeHeaderBadge";

export type SfxHeaderBadgeView = {
  label: string;
  tone: FlowNodeHeaderBadgeTone;
  pulseDot: boolean;
};

export function resolveSfxHeaderBadge(playing: boolean): SfxHeaderBadgeView | null {
  if (!playing) {
    return null;
  }
  return { label: "Playing", tone: "live", pulseDot: true };
}

export function sfxWiredInputParts(flags: {
  isTriggerWired: boolean;
  isGainWired: boolean;
}): string[] {
  return [
    ...(flags.isTriggerWired ? ["Trigger"] : []),
    ...(flags.isGainWired ? ["Gain"] : []),
  ];
}
