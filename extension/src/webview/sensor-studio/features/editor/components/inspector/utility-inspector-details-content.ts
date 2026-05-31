export type UtilityInspectorDetailsContent = {
  /** Short role line (shown as title when no sensor chip). */
  role: string;
  learnMore: readonly string[];
  inStudio: readonly string[];
  /** Optional wire / port semantics for transform-related nodes. */
  wireNotes?: readonly string[];
};

const UTILITY_DETAILS_BY_NODE_ID: Partial<Record<string, UtilityInspectorDetailsContent>> = {
  "transform-from-euler": {
    role:
      "Adapter node: converts a **vector3** Euler wire (radians) into an orange **Transform** wire for Model Viewer / 3D Rotation **Transform** inputs.",
    learnMore: [
      "Incoming vec3 uses Sensor Studio convention: **x = roll**, **y = pitch**, **z = heading** (yaw), in radians — same as BMI270 fusion Euler taps.",
      "**IMU / fusion** mapping remaps those fields to Three.js axes (pitch→X, roll→Y, heading→Z), applies intrinsic **ZYX** rotation, inverts for mesh orientation, then applies the firmware GLB axis remap — matching **3D Rotation · Euler (rad)** and Bitstream board preview.",
      "**Literal scene XYZ** assigns wire x/y/z directly to model root rotation in degrees with Three.js default **XYZ** order — suitable for hand-authored rotations, not raw IMU fusion streams.",
      "Position and scale on the output wire stay at defaults unless you merge through **Object Transform** upstream or downstream.",
    ],
    inStudio: [
      "Set **Euler mapping** on the Node tab before wiring BMI270 taps into **Model Viewer → Transform**.",
      "The preview applies fusion orientation as a quaternion when **IMU / fusion** is selected; literal mode drives `root.rotation` from stored degrees.",
      "Target mesh is always the **GLB root** (`gltf.scene` group) — no per-mesh picker in v0.1.",
    ],
    wireNotes: [
      "In: **vector3** · Euler (rad) — roll, pitch, heading on x, y, z.",
      "Out: **transform** · position, rotationDeg, scale, optional `eulerMapping` tag for preview.",
    ],
  },
  "object-transform": {
    role:
      "Author a fixed model **position**, **rotation (degrees)**, and **scale** once, then broadcast on a **Transform** wire.",
    learnMore: [
      "Values mirror `scene3d.model.transform` on 3D Rotation nodes — edit in the inspector Parameters / JSON or on linked rotation cards.",
      "While connected, wired transform overrides the viewer’s saved scene transform for position, rotation, and scale.",
      "Rotation is always **literal scene XYZ** in degrees (not IMU fusion mapping). Use **Transform from Euler** when driving from live Euler radians.",
    ],
    inStudio: [
      "Wire **out → Transform** on **Model Viewer** or **3D Rotation** nodes.",
      "Chain **Object Transform → Transform from Euler** is not typical; prefer a single path: either fixed transform or Euler adapter, optionally merging position/scale via graph design.",
    ],
    wireNotes: ["Out: **transform** · literal scene transform (no `eulerMapping` tag)."],
  },
  "model-viewer": {
    role: "GLB preview driven by the incoming **Model** URL wire plus optional structured scene wires.",
    learnMore: [
      "**Transform** input accepts a **transform** wire. Literal wires set root position, scale, and `rotationDeg` (XYZ). Fusion-tagged wires from **Transform from Euler** drive root orientation via quaternion (same path as IMU board preview).",
      "Environment, Camera, and Animation inputs merge into the saved scene3d snapshot for this node.",
    ],
    inStudio: [
      "Link or wire a **Studio Model** / Asset Browser GLB on the **Model** input.",
      "For BMI270 orientation on a rig, wire **Transform from Euler** (fusion mapping) into **Transform** — not the raw vec3 into Model Viewer directly.",
    ],
    wireNotes: [
      "In: **model** · fetchable GLB URL.",
      "In: **transform** (optional) · model root pose override while connected.",
      "In: **environment**, **camera**, **animation** (optional).",
    ],
  },
  "on-key": {
    role: "Keyboard **event** source — emits a pulse on the orange **event** output when the bound key is pressed.",
    learnMore: [
      "Runs in **Domain C** (event dispatch), separate from telemetry **dataflow** ticks.",
      "Canvas chrome shortcuts (Ctrl+Z undo, Ctrl+Shift+1 templates, …) run first; bind keys that do not conflict, or use modifier requirements on the Node tab.",
      "Focus must be on the canvas, not inside an inspector input or text field.",
    ],
    inStudio: [
      "Wire **Key down → Trigger** on **Toggle Boolean**, then boolean **Out → In** on **Indicator**.",
      "Example: key **R** toggles an indicator LED while testing IMU graphs.",
    ],
    wireNotes: ["Out: **event** · one-shot pulse per key down."],
  },
  "event-toggle-boolean": {
    role: "Event **action** — flips a boolean **out** wire on each incoming **event** pulse.",
    learnMore: [
      "State persists in node config (`value`) and survives save/load.",
      "Manual toggle on the node card sets the starting value before the first key press.",
    ],
    inStudio: [
      "Typical chain: **On Key → Toggle Boolean → Indicator**.",
      "Boolean output also feeds threshold / logic nodes like any other bool wire.",
    ],
    wireNotes: [
      "In: **event** · trigger.",
      "Out: **boolean** · latched value until the next pulse.",
    ],
  },
  "on-click": {
    role: "Pointer **event** source — emits a pulse when you click empty flow canvas (pane).",
    learnMore: [
      "Does not fire when clicking nodes, handles, or the minimap — only bare pane background.",
      "Left click uses `onPaneClick`; right click uses `onPaneContextMenu` (browser menu suppressed).",
    ],
    inStudio: [
      "Pair with **Set Boolean** for press-to-ON / click-to-OFF UX.",
      "Works without UART or simulation — pure Domain C.",
    ],
    wireNotes: ["Out: **event** · one-shot pulse per matching click."],
  },
  "event-set-boolean": {
    role: "Event **action** — sets boolean **out** to a fixed ON/OFF value on each **event** pulse.",
    learnMore: [
      "Unlike **Toggle Boolean**, output always becomes the configured `setTo` value — it does not flip.",
      "Use two **Set Boolean** nodes (ON and OFF) from different sources for explicit latch control.",
    ],
    inStudio: [
      "Example: **On Key → Set Boolean (ON)**, **On Click → Set Boolean (OFF)** → shared **Indicator** path.",
    ],
    wireNotes: [
      "In: **event** · trigger.",
      "Out: **boolean** · latched to `setTo` until the next pulse.",
    ],
  },
  "event-toggle-glb-part": {
    role: "Event **action** — flips GLB **part** visibility (hidden / visible) on each **event** pulse.",
    learnMore: [
      "Bind a part from Library **GLB → Parts** (**Evt** spawn) or set `glbExtractKind` / `glbExtractRef` manually.",
      "Visibility scalar is stored in config (`value`: 0 hidden, 1 visible). Preview uses &gt; 0.5 as visible.",
      "No boolean **out** wire — drives the linked **Model viewer** via `collectGlbScalarDrivesForModel`.",
    ],
    inStudio: [
      "Example: **On Key → Toggle GLB Part** (door mesh) with **Model viewer** on the same Model.",
    ],
    wireNotes: [
      "In: **event** · trigger.",
      "Model: **Studio Model** · scopes part to a GLB (required when multiple models).",
    ],
  },
  "event-set-glb-part": {
    role: "Event **action** — sets GLB **part** visibility to a configured state on each **event** pulse.",
    learnMore: [
      "Like **Set Boolean**, applies `setTo` (visible/hidden) without flipping.",
      "Pair **On Key → Set GLB Part (visible)** and **On Click → Set GLB Part (hidden)** for explicit show/hide.",
    ],
    inStudio: [
      "Use when you need deterministic show/hide rather than toggle per pulse.",
    ],
    wireNotes: [
      "In: **event** · trigger.",
      "Model: **Studio Model** · scopes part to a GLB (required when multiple models).",
    ],
  },
  "event-trigger-glb-anim": {
    role: "Event **action** — restarts a bound GLB **animation** clip in the linked **Model viewer** on each **event** pulse.",
    learnMore: [
      "Uses structured mixer drives with `restartNonce` — each pulse replays from the clip start (default **once**).",
      "Spawn from Library **GLB → Animations → Evt** or bind `glbExtractKind: animation` manually.",
      "Configure loop mode, speed, and weight on the Node tab.",
    ],
    inStudio: [
      "Example: **On Key → Trigger GLB Anim** (door open clip) with **Studio Model → Model** wired.",
    ],
    wireNotes: [
      "In: **event** · trigger.",
      "Model: **Studio Model** · scopes clip and viewer drive (required when multiple models).",
    ],
  },
};

export function resolveUtilityInspectorDetailsContent(
  nodeId: string,
): UtilityInspectorDetailsContent | null {
  return UTILITY_DETAILS_BY_NODE_ID[nodeId] ?? null;
}
