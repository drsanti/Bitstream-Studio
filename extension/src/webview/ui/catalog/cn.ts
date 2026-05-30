import { twMerge } from 'tailwind-merge';

/** Tailwind class merge helper (extension-owned; replaces T3D `cn`). */
export function cn(...inputs: Array<string | false | null | undefined>): string
{
  return twMerge(inputs.filter(Boolean).join(' '));
}
