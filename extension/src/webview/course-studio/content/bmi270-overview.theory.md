## Measurement model

The **BMI270** is a 6-axis IMU: tri-axis **accelerometer** (specific force in **g**) and tri-axis **gyroscope** (angular rate in **°/s**). Host fusion can publish **Euler angles** and **quaternion** attitude when enabled.

The accelerometer reports **specific force** — support reaction from gravity plus any true acceleration. It does not measure GPS velocity or step count by itself.

At rest with board **+Z** up, one axis reads near **+1 g** and vector magnitude $|a| \approx 1\,\text{g}$. Tilt moves gravity between axes; shake adds motion on top.

## Live data on the bench

Connect **Bitstream** or **Simulator** and enable **BMI270** with **ACC** and **GYR** (plus fusion fields if you need attitude) in sensor configuration. Blocks turn gray when no fresh sample is available.

## Bench checks (overview)

1. Place the board flat — identify which axis reads near **+1 g**.
2. Rotate 90° — gravity moves between axes; $|a|$ stays near **1 g**.
3. Shake gently — magnitude briefly exceeds 1 g.
4. Confirm **accel valid** when the stream is healthy.

The **MEMS design** topic explains proof-mass mechanics; **Live visualization** adds PCB attitude, diagrams, and deck-style cards.
