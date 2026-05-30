## Purpose
These steps help ensure the **thumbnail camera** rendered in the Model Catalog matches what you see in Blender.

The thumbnail generator renders from the camera exported inside the GLB/GLTF. If your camera uses constraints (Track To, Follow Path, Copy Rotation, etc.), you must bake the constraint result into the camera transform before export.

## Export prerequisites (recommended)
1. Export **one camera per model file** (disable/delete other cameras for that export), so the catalog doesn’t pick the “wrong” camera.
2. Move the camera + model into the final world pose you want to see in thumbnails.
3. Prefer a setup where the camera and model are in the same coordinate space (don’t rely on runtime parenting outside the export).

## Exact Blender bake/apply steps (camera constraints)
Follow this when your camera uses constraints.

### Step A: Jump to the frame you want
1. In the Timeline, go to the exact frame where the camera is at the desired view (for example, frame `1`).
2. Pause playback (so you don’t accidentally export during motion).

### Step B: Bake the camera’s constrained result
1. Select the **camera object**.
2. Open `Object` menu (or right-click the camera) -> `Animation` -> **`Bake Action...`**.
3. In the Bake Action dialog, use these settings:
   - `Frame Start`: set to the current frame (e.g. `1`)
   - `Frame End`: set to the current frame (same as start, e.g. `1`)
   - `Only Selected`: **ON**
   - `Visual Keying`: **ON** (bakes the evaluated/visual result of constraints)
   - `Clear Constraints`: **ON** (removes the constraints after baking, so the export is stable)
   - `Bake Data`: make sure **Location** and **Rotation** are enabled
   - (If there is an option for `NLA Strips`: leave it **OFF**)
4. Confirm the bake.

After baking:
- The camera should now have location/rotation keyframes for that frame.
- Your constraints should be removed (or at least should no longer be required to achieve the pose).

### Step C: Apply transforms (only after baking)
Depending on your authoring setup, you may need to apply transforms so the exported node transforms match Blender.

1. With the camera selected, run `Ctrl+A` -> **Rotation & Scale**.
   - If you know your pipeline uses “apply all” transforms consistently, you can use **All Transforms**, but be cautious if your camera is parented.
2. Repeat `Ctrl+A` for the **model root objects** that you export (typically Rotation & Scale; sometimes All Transforms depending on your workflow).

### Step D: Ensure the exported camera is the one you want
1. Make sure only the intended camera is enabled/visible for export.
2. If you have multiple cameras in the same scene, either:
   - put the others into a separate Blender file for separate export, or
   - delete/disable extra cameras before exporting this model.

## Exact glTF/GLB export settings
1. Go to `File` -> `Export` -> **`glTF 2.0 (.glb/.gltf)`**.
2. Make sure:
   - `Format`: **.glb** (recommended)
   - `Include`: **Cameras** is enabled (export cameras)
   - `Selection Only`: ON if you want only selected objects exported
3. Export.

## Validation checklist (fast)
1. Re-open the exported GLB/GLTF in a glTF viewer and confirm the camera view matches Blender’s baked camera view.
2. In the Model Catalog panel, click:
   - **Clear cache** then **Re-render thumbnails**
3. If still mismatched:
   - confirm the camera had constraints baked (constraints must not drive the pose after export)
   - confirm you exported the intended camera (single-camera per file)

