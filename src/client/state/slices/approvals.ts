import type { ApprovalRequest } from '../../../shared/protocol';
import type { Slice } from '../store';

declare module '../store' {
  interface Store {
    approvals: ApprovalRequest[];
  }
  interface Topics {
    approvals: true;
  }
}

/** Pending and decided approval requests for sensitive worker actions. */
export const approvals: Slice = {
  init(s) {
    s.approvals = [];
  },
  on: {
    welcome(s, m) {
      s.approvals = m.approvals ?? [];
      return ['approvals'];
    },
    approvals(s, m) {
      s.approvals = m.list;
      return ['approvals'];
    },
    'approval.update'(s, m) {
      const i = s.approvals.findIndex((r) => r.id === m.request.id);
      if (i >= 0) s.approvals[i] = m.request;
      else s.approvals.push(m.request);
      return ['approvals'];
    },
  },
};
