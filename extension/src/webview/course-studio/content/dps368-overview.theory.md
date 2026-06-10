## Measurement model

The **DPS368** is a **barometric pressure** sensor. It reports pressure in **hPa** (hectopascals, equivalent to millibars) and an on-die **temperature** used for compensation.

Host software can derive **barometric altitude** from pressure using a standard atmosphere model — useful for teaching relative height changes, not survey-grade elevation.

## Live data on the bench

Enable **DPS368** with **PRESS** and **TMP** in the wire mask. Connect **Bitstream** or **Simulator** before expecting live widgets to update.

## Bench checks

1. Note baseline pressure at desk height — typically near **1000 hPa** (varies with weather).
2. Lift the board ~1 m — pressure decreases slightly (roughly **0.1 hPa** per meter near sea level).
3. Confirm **pressure valid** when streaming.
