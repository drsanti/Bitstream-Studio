export interface TimeoutPolicy {
  timeoutMs: number;
  retryCount: number;
}

export const DEFAULT_TIMEOUT_POLICY: TimeoutPolicy = {
  timeoutMs: 3000,
  retryCount: 2,
};

export function normalizeTimeoutPolicy(policy?: Partial<TimeoutPolicy>): TimeoutPolicy {
  return {
    timeoutMs: Math.max(1, Math.floor(policy?.timeoutMs ?? DEFAULT_TIMEOUT_POLICY.timeoutMs)),
    retryCount: Math.max(0, Math.floor(policy?.retryCount ?? DEFAULT_TIMEOUT_POLICY.retryCount)),
  };
}
