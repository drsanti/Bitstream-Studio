## Earth's magnetic field

At most lab locations the ambient field is on the order of **25–65 µT**. The vector direction depends on latitude and local declination — not aligned with geographic north everywhere.

Reported components **Bx**, **By**, **Bz** are in the sensor frame. **Field |B|** is the vector magnitude and helps detect interference without caring about orientation.

## Level heading

When the PCB is approximately horizontal, heading from the horizontal field components acts like a compass rose in the plane of the board. Large tilt without IMU fusion will skew heading — pair with **BMI270** attitude when teaching fused compass behavior.

## Signal quality

- Keep soft-iron and hard-iron calibration in mind for production layouts; bench demos may show offset from nearby metal.
- Use moderate publish rates — the field changes slowly compared to IMU motion.
- Watch **mag valid** and **temp valid** flags before driving alarms.
