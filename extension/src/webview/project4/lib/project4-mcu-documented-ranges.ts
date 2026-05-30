/**
 * Reference firmware ranges aligned with the **robot `/data` JSON spec** (servo radar **`a`**: **45°…135°**).
 * Used for **Hardware → MCU sweep** defaults and the mock **`/data`** server.
 *
 * Optional split fields **`aF`** / **`aR`** follow the same sweep unless your firmware documents otherwise.
 */
export const PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MIN_DEG = 45;
export const PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MAX_DEG = 135;
