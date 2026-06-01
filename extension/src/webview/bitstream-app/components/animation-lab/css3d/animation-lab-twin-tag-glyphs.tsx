import type { ReactNode } from "react";
import type { AnimationLabTwinCardIconId } from "../animation-lab-twin-tag-icons.js";

type GlyphProps = {
  size: number;
  className?: string;
};

function HudSvg(props: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      aria-hidden
    >
      {props.children}
    </svg>
  );
}

export function AnimationLabTwinTagHudGlyph(props: {
  iconId: AnimationLabTwinCardIconId;
  size: number;
  className?: string;
}) {
  const stroke = "currentColor";
  const sw = 1.35;

  switch (props.iconId) {
    case "motor":
      return (
        <HudSvg size={props.size} className={props.className}>
          <circle cx="8" cy="8" r="2.25" stroke={stroke} strokeWidth={sw} />
          <path
            d="M8 2.5v2M8 11.5v2M2.5 8h2M11.5 8h2M4.6 4.6l1.4 1.4M10 10l1.4 1.4M4.6 11.4l1.4-1.4M10 6l1.4-1.4"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="square"
          />
        </HudSvg>
      );
    case "gimbal":
      return (
        <HudSvg size={props.size} className={props.className}>
          <circle cx="8" cy="8" r="5.25" stroke={stroke} strokeWidth={sw} />
          <path d="M8 3v10M3 8h10" stroke={stroke} strokeWidth={sw} />
          <circle cx="8" cy="8" r="1.25" fill={stroke} />
        </HudSvg>
      );
    case "camera":
    case "payload":
      return (
        <HudSvg size={props.size} className={props.className}>
          <rect x="2.5" y="4.5" width="11" height="8" rx="1" stroke={stroke} strokeWidth={sw} />
          <circle cx="8" cy="8.5" r="2.25" stroke={stroke} strokeWidth={sw} />
          <path d="M5.5 4.5l1-2h3l1 2" stroke={stroke} strokeWidth={sw} />
        </HudSvg>
      );
    case "imu":
      return (
        <HudSvg size={props.size} className={props.className}>
          <path
            d="M8 2.5l4.5 2.6v5.2L8 12.9 3.5 10.3V5.1L8 2.5z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <path d="M8 5v4M6 8h4" stroke={stroke} strokeWidth={sw} />
        </HudSvg>
      );
    case "sensor":
      return (
        <HudSvg size={props.size} className={props.className}>
          <path
            d="M2.5 9.5c1.2-2.2 2.5-3 3.5-3s2.3.8 3.5 3 2.3 3 3.5 3 2.3-.8 3.5-3"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </HudSvg>
      );
    case "generic":
    default:
      return (
        <HudSvg size={props.size} className={props.className}>
          <path
            d="M8 2.5l4.5 4.5-4.5 4.5-4.5-4.5 4.5-4.5z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <circle cx="8" cy="8" r="1.25" fill={stroke} />
        </HudSvg>
      );
  }
}
