export function machineWiredInputParts(flags: {
  isSpeedWired: boolean;
  isLoadWired: boolean;
  isGainWired: boolean;
}): string[] {
  return [
    ...(flags.isSpeedWired ? ["Speed"] : []),
    ...(flags.isLoadWired ? ["Load"] : []),
    ...(flags.isGainWired ? ["Gain"] : []),
  ];
}
