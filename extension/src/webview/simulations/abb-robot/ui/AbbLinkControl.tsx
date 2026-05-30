/*******************************************************************************
 * File Name : AbbLinkControl.tsx
 *
 * Description : Per-link angle/duration/easing controls for ABB arm.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Send } from "lucide-react";
import { useCallback, useState } from "react";
import {
  TRNButton,
  TRNParameterSlider,
  TRNSelect,
} from "../../../ui/TRN/index.js";
import type { ArmController } from "../controller/ArmController.js";
import {
  DEFAULT_GSAP_EASING,
  GSAP_EASING_OPTIONS,
} from "../config/gsapEasingOptions.js";
import type { AbbControlMode } from "../store/abbRobot.store.js";

export type AbbLinkControlProps = {
  linkId: number;
  controller: ArmController | null;
  controlMode: AbbControlMode;
  mqttConnected: boolean;
};

/**
 * Sliders + send for one joint (direct or MQTT command).
 */
export function AbbLinkControl({
  linkId,
  controller,
  controlMode,
  mqttConnected,
}: AbbLinkControlProps)
{
  const [angle, setAngle] = useState(0);
  const [duration, setDuration] = useState(1);
  const [ease, setEase] = useState(DEFAULT_GSAP_EASING);

  const canAct =
    controller != null && (controlMode === "direct" || mqttConnected);

  const handleSend = useCallback(() =>
  {
    if (controller == null)
    {
      return;
    }
    if (controlMode === "mqtt")
    {
      controller.publishMoveCommand(linkId, angle, duration, ease);
    }
    else
    {
      controller.moveLinkDirectly(linkId, angle, duration, ease);
    }
  }, [angle, controlMode, controller, duration, ease, linkId]);

  return (
    <div className="flex flex-col gap-2">
      <TRNParameterSlider
        name="Angle"
        value={angle}
        min={-180}
        max={180}
        step={1}
        unit="°"
        disabled={!canAct}
        onChange={setAngle}
      />
      <TRNParameterSlider
        name="Duration"
        value={duration}
        min={0.2}
        max={30}
        step={0.1}
        unit="s"
        disabled={!canAct}
        onChange={setDuration}
      />
      <TRNSelect
        sectionTitle="Easing"
        value={ease}
        disabled={!canAct}
        size="sm"
        options={GSAP_EASING_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
        onValueChange={setEase}
      />
      <TRNButton
        size="compact"
        className="w-full"
        disabled={!canAct}
        prefixIcon={<Send className="h-3.5 w-3.5" />}
        onClick={handleSend}
      >
        Move joint
      </TRNButton>
    </div>
  );
}
