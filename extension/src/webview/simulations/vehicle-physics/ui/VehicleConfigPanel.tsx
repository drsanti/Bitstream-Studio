/*******************************************************************************
 * File Name : VehicleConfigPanel.tsx
 *
 * Description : Vehicle parameters, rebuild, and debug meshes (T3D parity, TRN).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import {
  AlertCircle,
  Bug,
  Car,
  Gauge,
  Loader2,
  Settings,
  Volume2,
  Wrench,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNButton,
  TRNFormField,
  TRNHintText,
  TRNParameterSlider,
  TRNToggleSwitch,
} from "../../../ui/TRN/index.js";
import type { CastType } from "../config/vehicleConfig.js";
import { useVehicleSetupContext } from "../context/VehicleSetupContext.js";
import { useVehiclePhysics } from "../context/VehiclePhysicsContext.js";
import { useVehicleRebuildTracker } from "../hooks/useVehicleRebuildTracker.js";
import { useDebugSettingsStore } from "../store/debug-settings-store.js";
import { useVehicleConfigStore } from "../store/vehicle-config-store.js";
import { degreesToRadians } from "../utils/mathUtils.js";

const RAD_TO_DEG = 180 / Math.PI;

const CAST_OPTIONS: { id: CastType; label: string }[] = [
  { id: "cylinder", label: "Cylinder" },
  { id: "sphere", label: "Sphere" },
  { id: "ray", label: "Ray" },
];

/**
 * Right panel: vehicle tuning, rebuild, and debug visualization.
 */
export function VehicleConfigPanel()
{
  const { loadState } = useVehiclePhysics();
  const { rebuildVehicle, vehicleRef, vehicleControllerRef, physicsReady } =
    useVehicleSetupContext();
  const {
    hasPendingRebuildChanges,
    pendingChangesCount,
    commitBaselineAfterRebuild,
  } = useVehicleRebuildTracker();
  const [isRebuilding, setIsRebuilding] = useState(false);

  const store = useVehicleConfigStore();
  const debug = useDebugSettingsStore();

  /* --- Runtime handlers (apply without rebuild) --- */
  const handleMaxEngineTorqueChange = useCallback(
    (value: number) => {
      store.setMaxEngineTorque(value);
      vehicleRef.current?.updateEngineTorque(value);
    },
    [store, vehicleRef],
  );

  const handleClutchStrengthChange = useCallback(
    (value: number) => {
      store.setClutchStrength(value);
      vehicleRef.current?.updateClutchStrength(value);
    },
    [store, vehicleRef],
  );

  const handleBodyFrictionChange = useCallback(
    (value: number) => {
      store.setVehicleBodyFriction(value);
      vehicleRef.current?.updateBodyFriction(value);
    },
    [store, vehicleRef],
  );

  const handleLinearDampingChange = useCallback(
    (value: number) => {
      store.setLinearDamping(value);
      const s = useVehicleConfigStore.getState();
      vehicleRef.current?.updateBodyDamping(value, s.angularDamping);
    },
    [store, vehicleRef],
  );

  const handleAngularDampingChange = useCallback(
    (value: number) => {
      store.setAngularDamping(value);
      const s = useVehicleConfigStore.getState();
      vehicleRef.current?.updateBodyDamping(s.linearDamping, value);
    },
    [store, vehicleRef],
  );

  const handleSteeringAnimationDurationChange = useCallback(
    (value: number) => {
      store.setSteeringAnimationDuration(value);
      vehicleControllerRef.current?.updateSteeringAnimation(value, "power2.out");
    },
    [store, vehicleControllerRef],
  );

  const updateEngineSoundConfig = useCallback(() => {
    if (!vehicleControllerRef.current)
    {
      return;
    }
    const s = useVehicleConfigStore.getState();
    vehicleControllerRef.current.updateEngineSoundConfig({
      minPitch: s.engineSoundMinPitch,
      maxPitch: s.engineSoundMaxPitch,
      minVolume: s.engineSoundMinVolume,
      maxVolume: s.engineSoundMaxVolume,
      speedFactor: s.engineSoundSpeedFactor,
      baseVolume: s.engineSoundBaseVolume,
    });
  }, [vehicleControllerRef]);

  /* --- Debug mesh sync when vehicle appears --- */
  useEffect(() => {
    if (!vehicleRef.current)
    {
      return;
    }
    vehicleRef.current.setVehiclePartsDebugMeshVisibility(
      debug.showVehiclePartsDebug,
      debug.vehiclePartsDebugOpacity,
      debug.vehiclePartsDebugColor,
    );
    vehicleRef.current.setPhysicsObjectsDebugMeshVisibility(
      debug.showPhysicsObjectsDebug,
      debug.physicsObjectsDebugOpacity,
      debug.physicsObjectsDebugColor,
    );
  }, [
    vehicleRef,
    debug.showVehiclePartsDebug,
    debug.showPhysicsObjectsDebug,
    debug.vehiclePartsDebugOpacity,
    debug.vehiclePartsDebugColor,
    debug.physicsObjectsDebugOpacity,
    debug.physicsObjectsDebugColor,
  ]);

  const handleRebuild = async (): Promise<void> => {
    if (!physicsReady || isRebuilding || !hasPendingRebuildChanges)
    {
      return;
    }
    setIsRebuilding(true);
    try
    {
      useVehicleConfigStore.getState().saveToLocalStorage();
      await rebuildVehicle();
      commitBaselineAfterRebuild();
    }
    catch (err)
    {
      console.error("[VehicleConfigPanel] rebuild failed:", err);
    }
    finally
    {
      setIsRebuilding(false);
    }
  };

  if (loadState !== "ready")
  {
    return (
      <TRNHintText>
        Start physics first, then tune suspension, drivetrain, and debug meshes here.
      </TRNHintText>
    );
  }

  return (
    <div className="flex max-h-[calc(100vh-7rem)] flex-col gap-3 overflow-y-auto pr-1 scrollbar-hide">
      <div className="shrink-0 space-y-2">
        <TRNButton
          selected={hasPendingRebuildChanges}
          disabled={isRebuilding || !hasPendingRebuildChanges}
          className="w-full"
          prefixIcon={
            isRebuilding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wrench className="h-4 w-4" />
            )
          }
          onClick={() => void handleRebuild()}
        >
          {isRebuilding ? "Rebuilding…" : "Rebuild vehicle"}
          {hasPendingRebuildChanges && !isRebuilding && (
            <span className="ml-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-zinc-950">
              {pendingChangesCount}
            </span>
          )}
        </TRNButton>
        {hasPendingRebuildChanges && !isRebuilding && (
          <p className="flex items-center justify-center gap-1 text-[11px] text-amber-400/90">
            <AlertCircle className="h-3.5 w-3.5" />
            {pendingChangesCount} rebuild field
            {pendingChangesCount !== 1 ? "s" : ""} changed
          </p>
        )}
      </div>

      <TRNAccordion type="multiple" defaultValue={["suspension", "physics"]}>
        <TRNAccordionItem value="suspension">
          <TRNAccordionTrigger className="text-xs">
            <span className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" />
              Suspension
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent className="space-y-2">
            <TRNParameterSlider
              name="Min length"
              value={store.suspensionMinLength}
              min={0.05}
              max={0.3}
              step={0.01}
              onChange={store.setSuspensionMinLength}
            />
            <TRNParameterSlider
              name="Max length"
              value={store.suspensionMaxLength}
              min={0.2}
              max={1}
              step={0.01}
              onChange={store.setSuspensionMaxLength}
            />
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="steering">
          <TRNAccordionTrigger className="text-xs">
            <span className="flex items-center gap-2">
              <Car className="h-3.5 w-3.5" />
              Steering
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent className="space-y-2">
            <TRNParameterSlider
              name="Max steer"
              value={store.maxSteerAngle * RAD_TO_DEG}
              min={0}
              max={90}
              step={1}
              unit="°"
              onChange={(deg) => store.setMaxSteerAngle(degreesToRadians(deg))}
            />
            <TRNParameterSlider
              name="Steer anim"
              value={store.steeringAnimationDuration}
              min={0.1}
              max={3}
              step={0.1}
              unit="s"
              onChange={handleSteeringAnimationDurationChange}
            />
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="drivetrain">
          <TRNAccordionTrigger className="text-xs">
            <span className="flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5" />
              Drivetrain
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent className="space-y-3">
            <TRNFormField label="Four wheel drive">
              <TRNToggleSwitch
                checked={store.fourWheelDrive}
                onCheckedChange={store.setFourWheelDrive}
                ariaLabel="Four wheel drive"
              />
            </TRNFormField>
            <TRNFormField label="Anti-roll bar">
              <TRNToggleSwitch
                checked={store.antiRollbar}
                onCheckedChange={store.setAntiRollbar}
                ariaLabel="Anti roll bar"
              />
            </TRNFormField>
            <TRNParameterSlider
              name="F/B slip"
              value={store.frontBackLimitedSlipRatio}
              min={1}
              max={3}
              step={0.1}
              onChange={store.setFrontBackLimitedSlipRatio}
            />
            <TRNParameterSlider
              name="L/R slip"
              value={store.leftRightLimitedSlipRatio}
              min={1}
              max={3}
              step={0.1}
              onChange={store.setLeftRightLimitedSlipRatio}
            />
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="physics">
          <TRNAccordionTrigger className="text-xs">
            <span className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              Physics
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent className="space-y-2">
            <TRNParameterSlider
              name="Mass"
              value={store.vehicleMass}
              min={1000}
              max={20000}
              step={100}
              valueFormatter={(v) => `${(v / 1000).toFixed(1)}t`}
              onChange={store.setVehicleMass}
            />
            <TRNParameterSlider
              name="Wheel friction"
              value={store.wheelFriction}
              min={0}
              max={2}
              step={0.1}
              onChange={store.setWheelFriction}
            />
            <TRNParameterSlider
              name="Max pitch/roll"
              value={store.maxPitchRollAngle * RAD_TO_DEG}
              min={0}
              max={90}
              step={1}
              unit="°"
              onChange={(deg) =>
                store.setMaxPitchRollAngle(degreesToRadians(deg))
              }
            />
            <TRNParameterSlider
              name="Engine torque"
              value={store.maxEngineTorque}
              min={1000}
              max={20000}
              step={100}
              valueFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              onChange={handleMaxEngineTorqueChange}
            />
            <TRNParameterSlider
              name="Clutch"
              value={store.clutchStrength}
              min={1}
              max={50}
              step={0.5}
              onChange={handleClutchStrengthChange}
            />
            <TRNParameterSlider
              name="Body friction"
              value={store.vehicleBodyFriction}
              min={0}
              max={2}
              step={0.1}
              onChange={handleBodyFrictionChange}
            />
            <TRNParameterSlider
              name="Linear damp"
              value={store.linearDamping}
              min={0}
              max={1}
              step={0.05}
              onChange={handleLinearDampingChange}
            />
            <TRNParameterSlider
              name="Angular damp"
              value={store.angularDamping}
              min={0}
              max={1}
              step={0.05}
              onChange={handleAngularDampingChange}
            />
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="sound">
          <TRNAccordionTrigger className="text-xs">
            <span className="flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5" />
              Engine sound
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent className="space-y-2">
            <TRNParameterSlider
              name="Base volume"
              value={store.engineSoundBaseVolume}
              min={0}
              max={1}
              step={0.05}
              valueFormatter={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => {
                store.setEngineSoundBaseVolume(v);
                updateEngineSoundConfig();
              }}
            />
            <TRNParameterSlider
              name="Min pitch"
              value={store.engineSoundMinPitch}
              min={0}
              max={2}
              step={0.1}
              onChange={(v) => {
                store.setEngineSoundMinPitch(v);
                updateEngineSoundConfig();
              }}
            />
            <TRNParameterSlider
              name="Max pitch"
              value={store.engineSoundMaxPitch}
              min={0}
              max={2}
              step={0.1}
              onChange={(v) => {
                store.setEngineSoundMaxPitch(v);
                updateEngineSoundConfig();
              }}
            />
            <TRNParameterSlider
              name="Anim duration"
              value={store.engineSoundAnimationDuration}
              min={0.1}
              max={3}
              step={0.1}
              unit="s"
              onChange={store.setEngineSoundAnimationDuration}
            />
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="properties">
          <TRNAccordionTrigger className="text-xs">
            <span className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" />
              Vehicle properties
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent className="space-y-2">
            <TRNParameterSlider
              name="Body X"
              value={store.bodyPositionX}
              min={-5}
              max={5}
              step={0.1}
              onChange={store.setBodyPositionX}
            />
            <TRNParameterSlider
              name="Body Y"
              value={store.bodyPositionY}
              min={-5}
              max={5}
              step={0.1}
              onChange={store.setBodyPositionY}
            />
            <TRNParameterSlider
              name="Body Z"
              value={store.bodyPositionZ}
              min={-5}
              max={5}
              step={0.1}
              onChange={store.setBodyPositionZ}
            />
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400">Wheel cast</span>
              <div className="flex flex-wrap gap-1">
                {CAST_OPTIONS.map((opt) => (
                  <TRNButton
                    key={opt.id}
                    size="compact"
                    selected={store.castType === opt.id}
                    onClick={() => store.setCastType(opt.id)}
                  >
                    {opt.label}
                  </TRNButton>
                ))}
              </div>
            </div>
            <TRNParameterSlider
              name="Wheel radius"
              value={store.wheelRadius}
              min={0.1}
              max={1}
              step={0.01}
              onChange={store.setWheelRadius}
            />
            <TRNParameterSlider
              name="Wheel width"
              value={store.wheelWidth}
              min={0.1}
              max={1}
              step={0.01}
              onChange={store.setWheelWidth}
            />
            <TRNParameterSlider
              name="Half length"
              value={store.halfVehicleLength}
              min={0.5}
              max={5}
              step={0.1}
              onChange={store.setHalfVehicleLength}
            />
            <TRNParameterSlider
              name="Half width"
              value={store.halfVehicleWidth}
              min={0.3}
              max={3}
              step={0.1}
              onChange={store.setHalfVehicleWidth}
            />
            <TRNParameterSlider
              name="Half height"
              value={store.halfVehicleHeight}
              min={0.1}
              max={2}
              step={0.1}
              onChange={store.setHalfVehicleHeight}
            />
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="debug">
          <TRNAccordionTrigger className="text-xs">
            <span className="flex items-center gap-2">
              <Bug className="h-3.5 w-3.5" />
              Debug meshes
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent className="space-y-3">
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2 space-y-2">
              <TRNFormField label="Vehicle parts">
                <TRNToggleSwitch
                  checked={debug.showVehiclePartsDebug}
                  onCheckedChange={(checked) => {
                    debug.setShowVehiclePartsDebug(checked);
                    vehicleRef.current?.setVehiclePartsDebugMeshVisibility(
                      checked,
                      debug.vehiclePartsDebugOpacity,
                      debug.vehiclePartsDebugColor,
                    );
                  }}
                  ariaLabel="Vehicle parts debug"
                />
              </TRNFormField>
              {debug.showVehiclePartsDebug && (
                <>
                  <TRNParameterSlider
                    name="Opacity"
                    value={debug.vehiclePartsDebugOpacity}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => {
                      debug.setVehiclePartsDebugOpacity(v);
                      vehicleRef.current?.setVehiclePartsDebugMeshVisibility(
                        true,
                        v,
                        debug.vehiclePartsDebugColor,
                      );
                    }}
                  />
                  <TRNFormField label="Color">
                    <input
                      type="color"
                      value={debug.vehiclePartsDebugColor}
                      className="h-8 w-full cursor-pointer rounded border border-zinc-600 bg-transparent"
                      onChange={(e) => {
                        debug.setVehiclePartsDebugColor(e.target.value);
                        vehicleRef.current?.setVehiclePartsDebugMeshVisibility(
                          true,
                          debug.vehiclePartsDebugOpacity,
                          e.target.value,
                        );
                      }}
                    />
                  </TRNFormField>
                </>
              )}
            </div>
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2 space-y-2">
              <TRNFormField label="Physics objects">
                <TRNToggleSwitch
                  checked={debug.showPhysicsObjectsDebug}
                  onCheckedChange={(checked) => {
                    debug.setShowPhysicsObjectsDebug(checked);
                    vehicleRef.current?.setPhysicsObjectsDebugMeshVisibility(
                      checked,
                      debug.physicsObjectsDebugOpacity,
                      debug.physicsObjectsDebugColor,
                    );
                  }}
                  ariaLabel="Physics objects debug"
                />
              </TRNFormField>
              {debug.showPhysicsObjectsDebug && (
                <>
                  <TRNParameterSlider
                    name="Opacity"
                    value={debug.physicsObjectsDebugOpacity}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => {
                      debug.setPhysicsObjectsDebugOpacity(v);
                      vehicleRef.current?.setPhysicsObjectsDebugMeshVisibility(
                        true,
                        v,
                        debug.physicsObjectsDebugColor,
                      );
                    }}
                  />
                  <TRNFormField label="Color">
                    <input
                      type="color"
                      value={debug.physicsObjectsDebugColor}
                      className="h-8 w-full cursor-pointer rounded border border-zinc-600 bg-transparent"
                      onChange={(e) => {
                        debug.setPhysicsObjectsDebugColor(e.target.value);
                        vehicleRef.current?.setPhysicsObjectsDebugMeshVisibility(
                          true,
                          debug.physicsObjectsDebugOpacity,
                          e.target.value,
                        );
                      }}
                    />
                  </TRNFormField>
                </>
              )}
            </div>
          </TRNAccordionContent>
        </TRNAccordionItem>
      </TRNAccordion>
    </div>
  );
}
