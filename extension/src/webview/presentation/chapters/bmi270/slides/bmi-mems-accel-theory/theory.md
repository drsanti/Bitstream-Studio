## Capacitive MEMS accelerometer

Silicon MEMS accelerometers use a **proof mass** suspended by springs. Acceleration displaces the mass; **capacitive fingers** convert displacement to an electrical signal.

## Block diagram

```text
Proof mass displacement → ΔC (differential capacitance) → Σ-Δ ADC → digital LSBs
```

## Differential capacitance

Fixed and movable **interdigitated electrodes** form two capacitances $C_1$ and $C_2$. Differential readout rejects common-mode effects:

$$
\Delta C = C_1 - C_2 \propto a_{\text{axis}}
$$

## Axis sensitivity

Each sensing axis uses a structure aligned along that axis. Tri-axis devices combine three orthogonal structures (or equivalent) in one package.

## From LSB to physics

The ASIC applies calibration (offset, scale, temperature compensation) before values reach the BS2 payload. Host decode applies documented scale factors — do not assume raw LSBs are milligrams without the spec.

## Teaching demo link

The **MEMS accel demo** slide animates proof-mass offset proportional to live $a_X$ — a qualitative model, not a calibrated mechanical simulation.

## Noise and bandwidth

Higher ODR and narrower full-scale improve resolution trade-offs. Vibration and shock can saturate the range — choose $\pm 16\,\text{g}$ for impact labs, $\pm 2\,\text{g}$ for tilt.
