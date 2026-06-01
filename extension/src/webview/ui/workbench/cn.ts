import { clsx, type ClassValue } from 'clsx';

/** Minimal className helper — no app dependencies. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
