# Four-sensor dashboard — Workshop Ch6 capstone

**Workshop session:** Course Studio (Ch6, ~75 min)  
**Companion:** [INSTRUCTOR_SENSOR_MATRIX.md](../../../../docs/workshop/INSTRUCTOR_SENSOR_MATRIX.md) · [WORKSHOP_OUTLINE.md](../../../../docs/workshop/WORKSHOP_OUTLINE.md)

This page is the **finale layout** for the sensor-theory book: all four DevKit sensors on one screen with workshop **color cues** and infographic widgets.

---

## Layout regions

| Region | Sensor | Widgets | Workshop accent |
|--------|--------|---------|-----------------|
| **Climate** | SHT40 | Thermometer + droplet | `#5ee89a` |
| **Pressure** | DPS368 | Manometer (900–1100 hPa) | `#5eb8f5` |
| **Motion** | BMI270 | \|a\| segments + pitch readout | `#42e8ff` |
| **Magnetic field** | BMM350 | Compass rose + \|B\| column | `#b88cff` |

Caption for magnetometer: *"Local magnetic field — relative demo, not calibrated north."*

---

## Instructor demo script

1. **Link** Bitstream or Simulator; enable all four sensors and **Apply**.
2. **Cup hands** near SHT40 → temperature rises; humidity may follow.
3. **Tilt** board → BMI270 pitch and \|a\| respond.
4. **Slow rotate** flat → BMM350 heading sweeps; \|B\| stays in Earth band (~25–65 µT).
5. **Unplug** USB (or stop Simulator) once → widgets freeze or gray — teach **stale** honestly.

---

## Capstone checklist (trainees)

- [ ] Four sensor names visible with correct units
- [ ] Live data moves when the board moves
- [ ] Stale/offline state is obvious after disconnect
- [ ] Mag caption explains indoor compass limits
- [ ] Completed at least one Sensor Studio flow **and** this Course Studio page

---

## HTML template alternative

For HTML Editor workshops, use the bundled example:

`extension/docs/workshop/examples/workshop-four-sensor-dashboard.html`

Same four regions and accents — useful when trainees build outside Course Studio grids.

---

## Related book topics

Review **Core ideas** and each sensor chapter (overview + labs) before this capstone. BMI270 needs **Fusion** profile + Apply for pitch on the motion row.
