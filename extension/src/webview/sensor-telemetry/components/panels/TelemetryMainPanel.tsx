/*******************************************************************************
 * File Name : TelemetryMainPanel.tsx
 *
 * Description : Center workbench pane — Machine Twin (catalog GLB + digital twin).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { GlbAnimationLabPreviewCard } from "../../../bitstream-app/components/animation-lab/GlbAnimationLabPreviewCard.js";

/**
 * Telemetry workbench focal surface: Machine Twin only (no IMU quaternion preview here).
 * Live BMI270 orientation remains on the Bitstream rotation / fusion workspace when enabled elsewhere.
 */
export function TelemetryMainPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-1 p-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <GlbAnimationLabPreviewCard collapsible={false} />
      </div>
    </div>
  );
}
