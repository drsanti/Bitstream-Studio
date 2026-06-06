export function machineWiredInputParts(flags: {
  isSpeedWired: boolean;
  isLoadWired: boolean;
  isGainWired: boolean;
  isTriggerWired?: boolean;
}): string[] {
  return [
    ...(flags.isSpeedWired ? ["Speed"] : []),
    ...(flags.isLoadWired ? ["Load"] : []),
    ...(flags.isGainWired ? ["Gain"] : []),
    ...(flags.isTriggerWired ? ["Trigger"] : []),
  ];
}
