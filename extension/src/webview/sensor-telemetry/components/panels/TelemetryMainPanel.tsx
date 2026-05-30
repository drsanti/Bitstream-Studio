/*******************************************************************************
 * File Name : TelemetryMainPanel.tsx
 *
 * Description : Center workbench pane — BMI270 3D orientation (quaternion when on wire).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useBitstreamLiveStore } from "../../../bitstream-app/state/bitstreamLive.store.js";
import { BitstreamRotation3DFusionWorkspaceCard } from "../../../bitstream-app/workspace/BitstreamRotation3DFusionWorkspaceCard.js";

/**
 * Focal 3D preview driven by live BMI270 fusion (quaternion preferred when QUAT is on the wire).
 */
export function TelemetryMainPanel()
{
  const bmi270Sample = useBitstreamLiveStore((s) => s.latestByHint.bmi270);
  const wireDiag = useBitstreamLiveStore((s) => s.bmi270WireDiag);

  return (
    <div className="flex h-full min-h-0 flex-col p-1">
      <BitstreamRotation3DFusionWorkspaceCard
        sample={bmi270Sample}
        wireDiag={wireDiag}
        collapsible={false}
        workspaceFill
      />
    </div>
  );
}
