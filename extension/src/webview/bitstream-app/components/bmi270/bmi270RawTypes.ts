export type Bmi270RawSectionItem = {
  name: string;
  value: string;
  unit: string;
  hint?: string;
  /** Full-scale **|value|** for bidirectional gauge (zero center). Omit for default unit-based behavior. */
  centerZeroGaugeMaxAbs?: number;
  /** Full-scale for one-sided gauge (e.g. 0…360°). Mutually exclusive with center-zero gauge. */
  oneSidedGaugeMaxAbs?: number;
  /** Passed to TRNParameter — default adds `+` on positive values. */
  positiveSignMode?: "always" | "omit";
  /** Decimal places for animated numeric display; default 2. */
  valueFractionDigits?: number;
};
