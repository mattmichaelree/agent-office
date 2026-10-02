// Approval receipts — sensitive worker actions that need an admin to say yes.
import type { ApprovalClientMsg } from '../../../shared/protocol.js';
import type { HandlerMap } from './types.js';

export const approvalHandlers = {
  'approval.list'(ctx, c) {
    ctx.sendTo(c, { t: 'approvals', list: ctx.approvals.list() });
  },
  'approval.approve'(ctx, c, msg) {
    const err = ctx.approvals.approve(msg.id, c.peer.name);
    ctx.warn(c, err);
  },
  'approval.reject'(ctx, c, msg) {
    const err = ctx.approvals.reject(msg.id, c.peer.name);
    ctx.warn(c, err);
  },
} satisfies HandlerMap<ApprovalClientMsg>;
