export type SensorPublishMode = 0 | 1 | 2;

export type Dps368CardId =
  | "operation"
  | "sampling"
  | "delta"
  | "minPublish";

export type Dps368AckState = {
  state: "idle" | "pending" | "ok" | "error";
  message?: string;
};

export interface Dps368ControlCommonProps {
  enabled: boolean;
  publishMode: SensorPublishMode;
  ack: Dps368AckState;
  controlsDisabled: boolean;
  onEnabledChange: (nextEnabled: boolean) => void;
  onPublishModeChange: (nextMode: SensorPublishMode) => void;
}

export interface Dps368SamplingCardProps {
  collapsed: boolean;
  controlsDisabled: boolean;
  ack: Dps368AckState;
  dataRateMs: number;
  onToggleCollapsed: () => void;
  onSamplingIntervalChange: (nextValue: number) => void;
}

export interface Dps368DeltaCardProps {
  collapsed: boolean;
  disabled: boolean;
  ack: Dps368AckState;
  deltaX100: number;
  onToggleCollapsed: () => void;
  onDeltaX100Change: (nextValue: number) => void;
}

export interface Dps368MinPublishCardProps {
  collapsed: boolean;
  disabled: boolean;
  ack: Dps368AckState;
  minPublishIntervalMs: number;
  onToggleCollapsed: () => void;
  onMinPublishIntervalMsChange: (nextValue: number) => void;
}
