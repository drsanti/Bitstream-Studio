# Slide 04 — MEMS Proof-Mass

**Key talking points:**

- MEMS = Micro-Electro-Mechanical System — mechanical structures fabricated using semiconductor processes
- The proof mass is etched from **polysilicon** — same material as transistors, same fab process
- Finger gap of ~2 µm is about **1/50th the width of a human hair**

**Capacitance physics:**

```
C = ε₀ × A / d
ΔC ∝ displacement ∝ acceleration
```

- ε₀ = permittivity of air (~8.85 × 10⁻¹² F/m)
- A = finger overlap area
- d = gap distance

**Differential trick:**

Using C1 − C2 (differential) instead of measuring one capacitor:
- Cancels common-mode interference (temperature, supply voltage)
- Doubles the sensitivity
- Rejects package stress

**Live demo tip:**

> Ask a student to tilt the board sharply along X and watch the proof mass in the diagram swing to one side, changing C1 and C2 live.
