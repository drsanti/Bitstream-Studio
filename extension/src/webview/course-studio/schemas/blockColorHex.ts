import { z } from "zod";

export const courseBlockColorHexSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, "Expected #rrggbb or #rrggbbaa hex color");

export function formatCourseBlockColorDisplay(value: string | undefined): string {
  if (value == null || value.length === 0) {
    return "Default";
  }
  return value.toLowerCase();
}

export function normalizeCourseBlockColorHex(value: string): string | null {
  const trimmed = value.trim();
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{8}$/.test(hex)) {
    return hex.toLowerCase();
  }
  return null;
}

/** Compare #rrggbb / #rrggbbaa values (6-digit hex treated as opaque). */
export function courseBlockColorHexEquivalent(a: string, b: string): boolean {
  const left = normalizeCourseBlockColorHex(a);
  const right = normalizeCourseBlockColorHex(b);
  if (left == null || right == null) {
    return false;
  }
  const withAlpha = (hex: string) => (hex.length === 7 ? `${hex}ff` : hex);
  return withAlpha(left) === withAlpha(right);
}
