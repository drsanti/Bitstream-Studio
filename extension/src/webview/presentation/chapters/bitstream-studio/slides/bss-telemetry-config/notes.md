**Duration:** ~5 min

**Talking points**
- SENSOR_CFG v2 is one block per sensor — publish mask bits map to EVT_SENSOR fields.
- Each sensor chapter has a wire-mask slide with chip-specific bits.
- Presentation labs draft config only — students apply in Sensor Telemetry (no wire write from slides in v0.1).

**Demo script**
- Open BMI270 settings → toggle ACC/GYR publish → show `bss-demo-telemetry` summary column update.

**Q&A prompts**
- Why enable EULER if quaternion is also published?
- What happens to the draft when switching Bitstream ↔ Simulator?
