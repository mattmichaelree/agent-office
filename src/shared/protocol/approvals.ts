// Approval receipts for sensitive worker actions: push, deploy, email, large spend.
// A worker sets a request pending; an admin approves or rejects it before it proceeds.

export interface ApprovalRequest {
  /** Unique id for this request. */
  id: string;
  /** The action that triggered approval: 'worker.push', 'worker.deploy', 'worker.email', 'worker.spend'. */
  action: string;
  /** Human-readable description of what the worker wants to do. */
  detail: string;
  /** The worker that issued the request. */
  workerId: string;
  /** The person who asked (worker name or account). */
  requester: string;
  /** When the request was created (ms since epoch). */
  createdAt: number;
  /** 'pending' | 'approved' | 'rejected' | 'timed_out'. */
  status: 'pending' | 'approved' | 'rejected' | 'timed_out';
  /** Who decided, when status changed. */
  decidedBy?: string;
  /** When the status changed (ms since epoch). */
  decidedAt?: number;
}

export type ApprovalClientMsg =
  | { t: 'approval.list' }
  | { t: 'approval.approve'; id: string }
  | { t: 'approval.reject'; id: string };

export type ApprovalServerMsg =
  | { t: 'approvals'; list: ApprovalRequest[] }
  | { t: 'approval.update'; request: ApprovalRequest };
