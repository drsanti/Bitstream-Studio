## Attitude chapter recap

### Fusion motivation

- Gyro: good short-term $\omega$, bad long-term angle (drift)
- Accel: gravity hint at low frequency, bad under linear accel
- Firmware fusion → Euler + quaternion on the wire

### Representations

| Format | Mask | Best for |
|--------|------|----------|
| Euler | `0x08` | Dashboards, degrees, teaching |
| Quaternion | `0x10` | 3D graphics, SLERP, no gimbal lock |

### Key equations

Unit quaternion constraint:

$$
w^2 + x^2 + y^2 + z^2 = 1
$$

Half-angle form for rotation $\theta$ about unit axis $\hat{\mathbf{n}}$:

$$
w = \cos\frac{\theta}{2},\quad (x,y,z) = \hat{\mathbf{n}}\sin\frac{\theta}{2}
$$

### Demos completed

- Live Euler from mask `0x08`
- Live quaternion + 3D board from mask `0x10`

## Next sensor chapters

| Chapter | Role |
|---------|------|
| **BMM350** | Magnetic heading, hard/soft iron |
| **DPS368** | Barometric altitude |
| **SHT40** | Comfort / environmental RH |

## Exercises

1. Plot Euler pitch in Telemetry while rotating to high pitch — discuss coupling
2. Drive Stage orientation from quaternion tap only
3. Compare UART payload size: ACC+GYR vs ACC+GYR+QUAT at same ODR
