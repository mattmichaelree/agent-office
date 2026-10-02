import { randomBytes } from 'node:crypto';
import type { ApprovalRequest } from '../shared/protocol.js';

/**
 * Queue of approval requests that sensitive worker actions wait on.
 * Actions that trigger: 'worker.push', 'worker.deploy', 'worker.email', 'worker.spend'.
 * A request times out after APPROVAL_TIMEOUT_MS (default 5 minutes) if nobody decides.
 */
const APPROVAL_TIMEOUT_MS = 5 * 60_000;

/** Callbacks the approval system calls when something changes. */
export interface ApprovalEvents {
  update(list: ApprovalRequest[]): void;
  toast(text: string, level: 'info' | 'warn' | 'error'): void;
}

export class ApprovalManager {
  private requests: ApprovalRequest[] = [];
  private timeoutTimer: NodeJS.Timeout;
  private events: ApprovalEvents;

  constructor(events: ApprovalEvents) {
    this.events = events;
    this.timeoutTimer = setInterval(() => this.checkTimeouts(), 30_000);
    this.timeoutTimer.unref();
  }

  /** All current requests. */
  list(): ApprovalRequest[] {
    return this.requests.map((r) => ({ ...r }));
  }

  /**
   * Creates a pending approval request. Returns the request id.
   * An action that triggers approval calls this, then the actual operation waits
   * until an admin approves, rejects, or the request times out.
   */
  create(action: string, detail: string, workerId: string, requester: string): ApprovalRequest {
    const request: ApprovalRequest = {
      id: randomBytes(6).toString('hex'),
      action,
      detail,
      workerId,
      requester,
      createdAt: Date.now(),
      status: 'pending',
    };
    this.requests.push(request);
    this.events.toast(
      `🔐 ${requester} requests approval to ${this.actionLabel(action)}: "${detail.length > 60 ? detail.slice(0, 59) + '…' : detail}"`,
      'warn',
    );
    this.changed();
    return { ...request };
  }

  /** Approve a pending request. Returns an error message if it can't be approved. */
  approve(id: string, decidedBy: string): string | undefined {
    const r = this.requests.find((x) => x.id === id);
    if (!r) return 'No such approval request';
    if (r.status !== 'pending') return `Request is already ${r.status}`;
    r.status = 'approved';
    r.decidedBy = decidedBy;
    r.decidedAt = Date.now();
    this.events.toast(`✅ ${decidedBy} approved ${r.requester}'s ${this.actionLabel(r.action)}`, 'info');
    this.changed();
    return undefined;
  }

  /** Reject a pending request. Returns an error message if it can't be rejected. */
  reject(id: string, decidedBy: string): string | undefined {
    const r = this.requests.find((x) => x.id === id);
    if (!r) return 'No such approval request';
    if (r.status !== 'pending') return `Request is already ${r.status}`;
    r.status = 'rejected';
    r.decidedBy = decidedBy;
    r.decidedAt = Date.now();
    this.events.toast(`❌ ${decidedBy} rejected ${r.requester}'s ${this.actionLabel(r.action)}`, 'warn');
    this.changed();
    return undefined;
  }

  /** Check if a specific request has been decided (approved, rejected, or timed out). */
  statusOf(id: string): ApprovalRequest['status'] | undefined {
    return this.requests.find((r) => r.id === id)?.status;
  }

  /** Wait for a decision on a request, with a timeout. Resolves with the final status. */
  waitFor(id: string, timeoutMs = APPROVAL_TIMEOUT_MS): Promise<ApprovalRequest['status']> {
    return new Promise((resolve) => {
      const start = Date.now();
      const poll = () => {
        const r = this.requests.find((x) => x.id === id);
        if (!r || r.status !== 'pending') {
          resolve(r?.status ?? 'timed_out');
          return;
        }
        if (Date.now() - start >= timeoutMs) {
          // Mark as timed out
          if (r.status === 'pending') {
            r.status = 'timed_out';
            r.decidedAt = Date.now();
            this.events.toast(`⏰ ${r.requester}'s ${this.actionLabel(r.action)} approval request timed out`, 'warn');
            this.changed();
          }
          resolve('timed_out');
          return;
        }
        setTimeout(poll, 500);
      };
      poll();
    });
  }

  /** Check and timeout stale pending requests. */
  private checkTimeouts() {
    const now = Date.now();
    let changed = false;
    for (const r of this.requests) {
      if (r.status === 'pending' && now - r.createdAt >= APPROVAL_TIMEOUT_MS) {
        r.status = 'timed_out';
        r.decidedAt = now;
        this.events.toast(`⏰ ${r.requester}'s ${this.actionLabel(r.action)} approval request timed out`, 'warn');
        changed = true;
      }
    }
    if (changed) this.changed();
  }

  private actionLabel(action: string): string {
    const labels: Record<string, string> = {
      'worker.push': 'push',
      'worker.deploy': 'deploy',
      'worker.email': 'send email',
      'worker.spend': 'high-cost operation',
    };
    return labels[action] ?? action;
  }

  shutdown() {
    clearInterval(this.timeoutTimer);
  }

  private changed() {
    this.events.update(this.list());
  }
}
