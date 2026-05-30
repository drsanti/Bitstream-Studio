import type { BitstreamCommandDefinition } from "./command-types";

export const SENSOR_CFG_GET_REQ: BitstreamCommandDefinition = {
  name: "SENSOR_CFG_GET_REQ",
  channel: 0x03,
  commandId: 0x05,
};

export const SENSOR_CFG_SET_REQ: BitstreamCommandDefinition = {
  name: "SENSOR_CFG_SET_REQ",
  channel: 0x03,
  commandId: 0x06,
};

export const SENSOR_REINIT_REQ: BitstreamCommandDefinition = {
  name: "SENSOR_REINIT_REQ",
  channel: 0x03,
  commandId: 0x07,
};

export const BMI270_MODE_SET_REQ: BitstreamCommandDefinition = {
  name: "BMI270_MODE_SET_REQ",
  channel: 0x03,
  commandId: 0x08,
};

export const BMI270_MODE_GET_REQ: BitstreamCommandDefinition = {
  name: "BMI270_MODE_GET_REQ",
  channel: 0x03,
  commandId: 0x09,
};

export const BMI270_FUSION_FEED_SET_REQ: BitstreamCommandDefinition = {
  name: "BMI270_FUSION_FEED_SET_REQ",
  channel: 0x03,
  commandId: 0x0a,
};

export const BMI270_FUSION_FEED_GET_REQ: BitstreamCommandDefinition = {
  name: "BMI270_FUSION_FEED_GET_REQ",
  channel: 0x03,
  commandId: 0x0b,
};
