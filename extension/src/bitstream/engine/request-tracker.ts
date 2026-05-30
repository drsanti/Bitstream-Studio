import { normalizeTimeoutPolicy, type TimeoutPolicy } from "./timeout-policy";

export interface PendingRequest {
  requestId: string;
  sequence: number;
  commandId: number;
  /** Channel from the outbound Bitstream frame; responses must match or completion is ignored (avoids sequence collisions across channels). */
  channel: number;
  requestFrame: Uint8Array;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
}

export type RetryDecision = { kind: "retry"; request: PendingRequest } | { kind: "expired"; request: PendingRequest };

export class RequestTracker {
  private readonly pendingBySequence = new Map<number, PendingRequest>();
  private readonly policy: TimeoutPolicy;

  constructor(policy?: Partial<TimeoutPolicy>) {
    this.policy = normalizeTimeoutPolicy(policy);
  }

  add(
    requestId: string,
    sequence: number,
    commandId: number,
    channel: number,
    requestFrame: Uint8Array,
    policyOverride?: Partial<TimeoutPolicy>,
  ): PendingRequest {
    const policy = normalizeTimeoutPolicy({
      timeoutMs: policyOverride?.timeoutMs ?? this.policy.timeoutMs,
      retryCount: policyOverride?.retryCount ?? this.policy.retryCount,
    });
    const now = Date.now();
    const pending: PendingRequest = {
      requestId,
      sequence: sequence & 0xffff,
      commandId: commandId & 0xff,
      channel: channel & 0xff,
      requestFrame,
      createdAt: now,
      attempts: 1,
      maxAttempts: Math.max(1, policy.retryCount + 1),
      expiresAt: now + policy.timeoutMs,
    };
    this.pendingBySequence.set(pending.sequence, pending);
    return pending;
  }

  getBySequence(sequence: number): PendingRequest | undefined {
    return this.pendingBySequence.get(sequence & 0xffff);
  }

  complete(sequence: number): PendingRequest | undefined {
    const key = sequence & 0xffff;
    const current = this.pendingBySequence.get(key);
    if (current) {
      this.pendingBySequence.delete(key);
    }
    return current;
  }

  markRetry(sequence: number): RetryDecision | null {
    const key = sequence & 0xffff;
    const current = this.pendingBySequence.get(key);
    if (!current) return null;

    current.attempts += 1;
    if (current.attempts > current.maxAttempts) {
      this.pendingBySequence.delete(key);
      return { kind: "expired", request: current };
    }
    current.expiresAt = Date.now() + this.policy.timeoutMs;
    return { kind: "retry", request: current };
  }

  timedOut(now = Date.now()): PendingRequest[] {
    const out: PendingRequest[] = [];
    for (const req of this.pendingBySequence.values()) {
      if (req.expiresAt <= now) {
        out.push(req);
      }
    }
    return out;
  }

  clear(): void {
    this.pendingBySequence.clear();
  }

  size(): number {
    return this.pendingBySequence.size;
  }
}
