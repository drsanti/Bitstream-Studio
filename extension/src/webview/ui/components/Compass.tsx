import { gsap } from "gsap";
import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

export interface CompassProps {
  /** Heading in degrees 0–360 (null when no data). */
  headingDeg: number | null;
  /** SVG size in pixels. */
  size?: number;
  className?: string;
}

const DEFAULT_SIZE = 200;
const NEEDLE_LENGTH_RATIO = 0.72;
const NEEDLE_WIDTH_RATIO = 0.08;
const CARDINALS = [
  { label: "N", deg: 0 },
  { label: "E", deg: 90 },
  { label: "S", deg: 180 },
  { label: "W", deg: 270 },
] as const;
const INTERCARDINALS = [
  { label: "NE", deg: 45 },
  { label: "SE", deg: 135 },
  { label: "SW", deg: 225 },
  { label: "NW", deg: 315 },
] as const;

export const Compass: React.FC<CompassProps> = ({
  headingDeg,
  size = DEFAULT_SIZE,
  className,
}) => {
  const id = React.useId().replace(/:/g, "-");
  const targetRotation = headingDeg != null ? headingDeg : 0;
  const [smoothedRotation, setSmoothedRotation] = useState(targetRotation);
  const proxyRef = useRef({ r: targetRotation });

  useEffect(() => {
    const proxy = proxyRef.current;
    gsap.to(proxy, {
      r: targetRotation,
      duration: 0.7,
      ease: "sine.inOut",
      overwrite: true,
      onUpdate: () => setSmoothedRotation(proxy.r),
    });
  }, [targetRotation]);

  const r = size / 2;
  const cx = r;
  const cy = r;
  const casingWidth = Math.max(4, r * 0.06);
  const dialR = r - casingWidth;
  const tickR = dialR - 2;
  const tickLengthShort = 3;
  const tickLengthLong = 6;
  const needleLength = r * NEEDLE_LENGTH_RATIO;
  const needleSouthLength = needleLength * 0.4;
  const needleW = needleLength * NEEDLE_WIDTH_RATIO;
  const pivotR = Math.max(5, r * 0.04);
  const labelR = dialR - 42;
  const intercardinalR = dialR - 28;

  const casingGrad = `compass-casing-${id}`;
  const dialGrad = `compass-dial-${id}`;
  const pivotGrad = `compass-pivot-${id}`;
  const shadowId = `compass-shadow-${id}`;

  return (
    <div
      className={clsx("flex flex-col items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full"
        aria-label={headingDeg != null ? `Compass heading ${Math.round(headingDeg)}°` : "Compass, no data"}
        filter={`url(#${shadowId})`}
      >
        <defs>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
          </filter>
          <linearGradient id={casingGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="30%" stopColor="#9ca3af" />
            <stop offset="70%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
          <radialGradient id={dialGrad} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </radialGradient>
          <radialGradient id={pivotGrad} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#9ca3af" />
          </radialGradient>
        </defs>

        {/* Casing: outer metallic ring */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${casingGrad})`} />
        <circle cx={cx} cy={cy} r={r - casingWidth / 2} fill="none" stroke="#6b7280" strokeWidth="1" opacity={0.4} />

        {/* Dial face (recessed) */}
        <circle cx={cx} cy={cy} r={dialR} fill={`url(#${dialGrad})`} />

        {/* Compass rose: 8-point star */}
        <g stroke="#6b7280" strokeWidth="0.5" fill="none" opacity={0.25}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = cx + (dialR * 0.3) * Math.sin(rad);
            const y1 = cy - (dialR * 0.3) * Math.cos(rad);
            const x2 = cx + dialR * 0.9 * Math.sin(rad);
            const y2 = cy - dialR * 0.9 * Math.cos(rad);
            return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>

        {/* Degree scale: ticks every 10°, long every 30° */}
        {Array.from({ length: 36 }, (_, i) => i * 10).map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const isLong = deg % 30 === 0;
          const tickLen = isLong ? tickLengthLong : tickLengthShort;
          const x1 = cx + tickR * Math.sin(rad);
          const y1 = cy - tickR * Math.cos(rad);
          const x2 = cx + (tickR - tickLen) * Math.sin(rad);
          const y2 = cy - (tickR - tickLen) * Math.cos(rad);
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#9ca3af"
              strokeWidth={isLong ? 1.5 : 1}
              opacity={0.9}
            />
          );
        })}

        {/* Degree labels every 20° */}
        {Array.from({ length: 18 }, (_, i) => i * 20).map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const labelRim = tickR - tickLengthLong - 10;
          const x = cx + labelRim * Math.sin(rad);
          const y = cy - labelRim * Math.cos(rad);
          const rotate = deg >= 180 ? deg - 180 : deg + 180;
          return (
            <text
              key={deg}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#9ca3af"
              fontSize={size * 0.04}
              transform={`rotate(${rotate}, ${x}, ${y})`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {deg}
            </text>
          );
        })}

        {/* Cardinal labels */}
        {CARDINALS.map(({ label, deg }) => {
          const rad = (deg * Math.PI) / 180;
          const x = cx + labelR * Math.sin(rad);
          const y = cy - labelR * Math.cos(rad);
          const isNorth = label === "N";
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isNorth ? "#ef4444" : "#e5e7eb"}
              fontWeight={isNorth ? "700" : "600"}
              fontSize={size * 0.065}
            >
              {label}
            </text>
          );
        })}

        {/* Intercardinal labels */}
        {INTERCARDINALS.map(({ label, deg }) => {
          const rad = (deg * Math.PI) / 180;
          const x = cx + intercardinalR * Math.sin(rad);
          const y = cy - intercardinalR * Math.cos(rad);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#d1d5db"
              fontSize={size * 0.04}
              opacity={0.9}
            >
              {label}
            </text>
          );
        })}

        {/* Needle: arrow shape, pivot at center */}
        <g transform={`translate(${cx},${cy}) rotate(${smoothedRotation})`}>
          {/* North (red) triangle: tip at (0,-needleLength), base at y=0 */}
          <polygon
            points={`0,${-needleLength} ${needleW},0 ${-needleW},0`}
            fill="#dc2626"
            stroke="#b91c1c"
            strokeWidth="0.5"
          />
          {/* South (gray) triangle: tip at (0, needleSouthLength), base at y=0 */}
          <polygon
            points={`0,${needleSouthLength} ${needleW},0 ${-needleW},0`}
            fill="#94a3b8"
            stroke="#64748b"
            strokeWidth="0.5"
          />
        </g>

        {/* Pivot cap (on top of needle, at center) */}
        <circle cx={cx} cy={cy} r={pivotR} fill={`url(#${pivotGrad})`} stroke="#6b7280" strokeWidth="0.5" />
      </svg>
      {headingDeg != null && (
        <span className="text-xs text-gray-400 mt-1 tabular-nums">
          {Math.round(headingDeg)}°
        </span>
      )}
      {headingDeg == null && (
        <span className="text-xs text-gray-500 mt-1">No data</span>
      )}
    </div>
  );
};
