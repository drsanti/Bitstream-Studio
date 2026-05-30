/**
 * Vehicle Configuration Utilities
 * Helper functions for extracting and converting vehicle configuration
 */

import * as THREE from 'three';
import { VehicleModels } from '../vehicle/FourWheelVehicle';
import { VehicleConfig } from '../vehicle/FourWheelVehicle';
import { VehicleConfigState } from '../store/vehicle-config-store';

/**
 * Extract vehicle models from loaded GLB
 * @param model - The loaded THREE.Object3D model
 * @returns VehicleModels object with all required models
 */
export function extractVehicleModels(model: THREE.Object3D): VehicleModels {
  // Debug: Log all object names in the model to help identify naming issues
  const allNames: string[] = [];
  model.traverse((child) => {
    if (child.name) {
      allNames.push(child.name);
    }
  });
  console.log('📋 All object names in GLB model:', allNames);

  const prankModel = model.getObjectByName('prank') as THREE.Object3D;
  if (!prankModel) {
    console.warn('⚠️ Prank model not found. Available names:', allNames.filter((n, i, arr) => arr.indexOf(n) === i));
  }

  return {
    floorModel: model.getObjectByName('floor') as THREE.Object3D,
    bodyModel: model.getObjectByName('car_body') as THREE.Object3D,  // Changed from 'main'
    wheelLeftFrontModel: model.getObjectByName('wheel_left_front') as THREE.Object3D,
    wheelRightFrontModel: model.getObjectByName('wheel_right_front') as THREE.Object3D,
    wheelLeftRearModel: model.getObjectByName('wheel_left_rear') as THREE.Object3D,
    wheelRightRearModel: model.getObjectByName('wheel_right_rear') as THREE.Object3D,
    ballModel: model.getObjectByName('ball') as THREE.Object3D,
    prankModel: prankModel,
  };
}

/**
 * Convert vehicle config store state to VehicleConfig object
 * @param storeState - The vehicle config store state
 * @returns VehicleConfig object
 */
export function extractVehicleConfigFromStore(
  storeState: VehicleConfigState
): VehicleConfig {
  return {
    suspensionMinLength: storeState.suspensionMinLength,
    suspensionMaxLength: storeState.suspensionMaxLength,
    maxSteerAngle: storeState.maxSteerAngle,
    fourWheelDrive: storeState.fourWheelDrive,
    frontBackLimitedSlipRatio: storeState.frontBackLimitedSlipRatio,
    leftRightLimitedSlipRatio: storeState.leftRightLimitedSlipRatio,
    antiRollbar: storeState.antiRollbar,
    vehicleMass: storeState.vehicleMass,
    maxEngineTorque: storeState.maxEngineTorque,
    clutchStrength: storeState.clutchStrength,
    wheelFriction: storeState.wheelFriction,
    vehicleBodyFriction: storeState.vehicleBodyFriction,
    linearDamping: storeState.linearDamping,
    angularDamping: storeState.angularDamping,
    maxPitchRollAngle: storeState.maxPitchRollAngle,
    bodyPositionX: storeState.bodyPositionX,
    bodyPositionY: storeState.bodyPositionY,
    bodyPositionZ: storeState.bodyPositionZ,
    castType: storeState.castType,
    wheelRadius: storeState.wheelRadius,
    wheelWidth: storeState.wheelWidth,
    halfVehicleLength: storeState.halfVehicleLength,
    halfVehicleWidth: storeState.halfVehicleWidth,
    halfVehicleHeight: storeState.halfVehicleHeight,
  };
}
