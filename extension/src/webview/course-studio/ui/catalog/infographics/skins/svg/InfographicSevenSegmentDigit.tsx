import { sevenSegmentMaskForChar } from "./sevenSegmentGlyphs";

const SEGMENTS: Array<{
  bit: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  rx: number;
}> = [
  { bit: 0b1000000, x1: 4, y1: 2, x2: 16, y2: 2, rx: 1 },
  { bit: 0b0100000, x1: 17, y1: 3, x2: 17, y2: 11, rx: 1 },
  { bit: 0b0010000, x1: 17, y1: 13, x2: 17, y2: 21, rx: 1 },
  { bit: 0b0001000, x1: 4, y1: 22, x2: 16, y2: 22, rx: 1 },
  { bit: 0b0000100, x1: 3, y1: 13, x2: 3, y2: 21, rx: 1 },
  { bit: 0b0000010, x1: 3, y1: 3, x2: 3, y2: 11, rx: 1 },
  { bit: 0b0000001, x1: 4, y1: 12, x2: 16, y2: 12, rx: 1 },
];

export function InfographicSevenSegmentDigit({
  char,
  onColor,
  offColor,
}: {
  char: string;
  onColor: string;
  offColor: string;
}) {
  const mask = sevenSegmentMaskForChar(char);

  return (
    <svg viewBox="0 0 20 24" className="h-full w-auto" aria-hidden>
      {SEGMENTS.map((segment) => {
        const on = (mask & segment.bit) !== 0;
        return (
          <rect
            key={segment.bit}
            x={Math.min(segment.x1, segment.x2) - segment.rx}
            y={Math.min(segment.y1, segment.y2) - segment.rx}
            width={Math.abs(segment.x2 - segment.x1) + segment.rx * 2}
            height={Math.abs(segment.y2 - segment.y1) + segment.rx * 2}
            rx={segment.rx}
            fill={on ? onColor : offColor}
            opacity={on ? 1 : 0.35}
          />
        );
      })}
    </svg>
  );
}
