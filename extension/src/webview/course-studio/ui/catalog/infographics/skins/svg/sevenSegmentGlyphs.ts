/** Classic 7-segment map: a b c d e f g */
const SEGMENT_MASK: Record<string, number> = {
  "0": 0b1111110,
  "1": 0b0110000,
  "2": 0b1101101,
  "3": 0b1111001,
  "4": 0b0110011,
  "5": 0b1011011,
  "6": 0b1011111,
  "7": 0b1110000,
  "8": 0b1111111,
  "9": 0b1111011,
  "-": 0b0000001,
  " ": 0b0000000,
};

export function sevenSegmentMaskForChar(char: string): number {
  return SEGMENT_MASK[char] ?? SEGMENT_MASK[" "] ?? 0;
}

export function sevenSegmentCharsForValue(value: number | null, decimals: number): string[] {
  if (value == null || !Number.isFinite(value)) {
    return ["-", "-", "-"];
  }
  const text = value.toFixed(decimals);
  return text.split("");
}
