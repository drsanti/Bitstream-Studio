export function getBmi270AxisColorClass(xyz: string): string {
  if (
    xyz === "x" ||
    xyz === "mx" ||
    xyz === "ax" ||
    xyz === "gx" ||
    xyz === "qx" ||
    /** BSX "pitch" wire field tracks rotation about board +X in frame N (see rotation preview doc). */
    xyz === "pitch"
  )
    return "text-red-500";
  if (
    xyz === "y" ||
    xyz === "my" ||
    xyz === "ay" ||
    xyz === "gy" ||
    xyz === "qy" ||
    /** In telemetry UI remap, "yaw" row represents board +Y channel. */
    xyz === "yaw"
  )
    return "text-green-500";
  if (
    xyz === "z" ||
    xyz === "mz" ||
    xyz === "az" ||
    xyz === "gz" ||
    xyz === "qz" ||
    /** In telemetry UI remap, "roll" row represents board +Z channel. */
    xyz === "roll"
  )
    return "text-blue-500";
  if (xyz === "w" || xyz === "qw") return "text-pink-500";
  if (xyz === "t" || xyz === "tp") return "text-orange-400";
  return "text-zinc-500";
}

export function getBmi270AxisGaugeBaseColorHex(xyz: string): string {
  if (
    xyz === "x" ||
    xyz === "mx" ||
    xyz === "ax" ||
    xyz === "gx" ||
    xyz === "qx" ||
    xyz === "pitch"
  )
    return "#ef4444";
  if (
    xyz === "y" ||
    xyz === "my" ||
    xyz === "ay" ||
    xyz === "gy" ||
    xyz === "qy" ||
    xyz === "yaw"
  )
    return "#22c55e";
  if (
    xyz === "z" ||
    xyz === "mz" ||
    xyz === "az" ||
    xyz === "gz" ||
    xyz === "qz" ||
    xyz === "roll"
  )
    return "#3b82f6";
  if (xyz === "w" || xyz === "qw") return "#ec4899";
  if (xyz === "t" || xyz === "tp") return "#fb923c";
  return "#71717a";
}

export function getBmi270AxisGaugeFillColorHex(
  xyz: string,
  _progressPercent: number,
  _signedValue: number,
): string {
  return getBmi270AxisGaugeBaseColorHex(xyz);
}
