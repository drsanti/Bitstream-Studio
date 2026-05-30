/** Operator-facing help markdown for TRNMarkdownRenderer in Digital Twin Copilot. */
export const DIGITAL_TWIN_COPILOT_HELP_MARKDOWN = `# Digital Twin Copilot — Help

Use **Natural Twin Copilot** for plain-language questions. Turn **AI Interaction** on so the assistant can call tools against **Project 4 → Connection** (real MCU or **mock MCU**). Turn **AI Drive** on to skip the orange confirmation for motion and speed tools (only if you accept that risk).

Below, **each example prompt is in its own block** — use the **Copy** control on the block to paste into the composer.

---

## Example prompts — Read (telemetry and status)

\`\`\`plaintext
Pull live telemetry and summarize the whole robot state: wheel speeds, scanner bearings (a / front/rear ultrasonic angles), front and rear distances (df, db), IMU if present, freshness of data, and anything unsafe.
\`\`\`

\`\`\`plaintext
What are df and db right now in centimeters? Explain what they mean for clearance.
\`\`\`

\`\`\`plaintext
Read telemetry once and list every wheel speed (vFL, vFR, vRL, vRR) with units if shown.
\`\`\`

\`\`\`plaintext
What are the scanner angle readings (a / aF / aR if present), and how do they relate to the physical sweep range in Hardware setup?
\`\`\`

\`\`\`plaintext
Summarize IMU acceleration (ax, ay, az) if the MCU publishes them.
\`\`\`

\`\`\`plaintext
Can you see live telemetry right now? If not, explain likely causes (MCU URL, network, mock server).
\`\`\`

\`\`\`plaintext
Compare front versus rear obstacle readings and say whether backing up looks advisable.
\`\`\`

---

## Example prompts — Control (motion and speed)

Motion commands use firmware **direction tokens** only (\`W\`, \`S\`, \`A\`, \`D\`, \`WA\`, \`WD\`, \`SA\`, \`SD\`, \`STOP\`). Speed presets use numeric values (**typically 0–255**) per **Project 4 settings**.

\`\`\`plaintext
Stop the motors immediately (use STOP for motion).
\`\`\`

\`\`\`plaintext
Read telemetry, then if rear clearance is safe enough, move backward briefly at low speed; otherwise advise stopping first.
\`\`\`

\`\`\`plaintext
Move forward slowly, then stop and confirm telemetry changed appropriately.
\`\`\`

\`\`\`plaintext
Set speed preset to 96 (or another safe test value) and explain why before issuing motion.
\`\`\`

\`\`\`plaintext
Turn left in place, then read telemetry again.
\`\`\`

Higher-risk asks may still trigger **Needs your OK** unless **AI Drive** is enabled — physical limits and workspace rules always override assistant suggestions.

---

## Robot overview (hardware)

- **Four-wheel** mobile platform — telemetry exposes **per-wheel speeds** (\`vFL\`, \`vFR\`, \`vRL\`, \`vRR\`).
- **Ultrasonic “radar”** — scanner pans via **servos**; firmware reports bearings (\`a\` / front/rear variants where implemented).
- **Obstacle distances** — commonly \`df\` (front), \`db\` (rear), with meanings documented under **Project 4 settings → Hardware setup** (ranges and HUD cues mirror MCU semantics).

Exact JSON layout depends on firmware — treat stale or missing fields as “unknown”, not invented values.

---

## System architecture (how Copilot fits)

| Piece | Role |
| ----- | ---- |
| **3D twin (webview)** | Polls **HTTP GET \`/data\`** from **Connection**; HUD + viewport mirror motors and scanner where mapped. |
| **MCU HTTP** | Same base URL drives **\`/move\`**, **set speed**, paths configurable under settings — includes **mock MCU** for development. |
| **AI bridge (VS Code host)** | WebSocket connection; forwards Claude requests and **tool calls**. Not Bitstream serial — Copilot tools stay HTTP-only toward the MCU. |
| **\`project4_*\` tools** | Bridge executes telemetry reads and (policy-approved) motion/speed requests against **project4 HTTP payload** from the webview. |
| **Anthropic API key** | Stored like other assistants (**settings → Assistant**) — required for Claude-backed replies. |

When **AI Interaction** is off, you still get conversational answers but tools cannot reach your robot.

---

## Toolbar reminders

- **HUD overlay panels** — show/hide draggable HUD tiles.
- **Cubemap (globe)** — twin environment preset for lighting/reflections (viewer-only, not MCU telemetry).
- **Sparkles (toolbar)** — toggles the Copilot window (placement follows the current layout).

---

## Tips

\`\`\`plaintext
Pull live telemetry first, then ask for a longer plan — shorter verification turns reduce surprises on hardware.
\`\`\`

\`\`\`plaintext
If answers mention timeouts or stale data, double-check MCU base URL, mock MCU, firewall, and that AI Interaction is on with a valid Connection URL.
\`\`\`
`;
