// Approval queue panel — shows pending requests for sensitive worker actions.
import type { ApprovalRequest, ClientMsg } from '../../shared/protocol';
import type { Net } from '../net';
import { store } from '../state';
import { $, h, toast } from './dom';
import { panelHide } from './menu';

/** Set from views.ts so the panel can send approve/reject. */
let _net: Net | null = null;

export function setApprovalsNet(net: Net) {
  _net = net;
}

function send(msg: ClientMsg) {
  _net?.send(msg);
}

function actionIcon(action: string): string {
  const icons: Record<string, string> = {
    'worker.push': '⬆️',
    'worker.deploy': '🚀',
    'worker.email': '📧',
    'worker.spend': '💰',
  };
  return icons[action] ?? '🔐';
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    'worker.push': 'Push',
    'worker.deploy': 'Deploy',
    'worker.email': 'Email',
    'worker.spend': 'High-cost op',
  };
  return labels[action] ?? action;
}

function statusIcon(status: ApprovalRequest['status']): string {
  return status === 'approved' ? '✅' : status === 'rejected' ? '❌' : status === 'timed_out' ? '⏰' : '🕐';
}

function renderRow(r: ApprovalRequest): HTMLElement[] {
  const ago = Math.floor((Date.now() - r.createdAt) / 1000);
  const timeLabel = ago < 60 ? 'just now' : ago < 3600 ? `${Math.floor(ago / 60)}m ago` : `${Math.floor(ago / 3600)}h ago`;
  const isPending = r.status === 'pending';
  const rows: HTMLElement[] = [];
  rows.push(h('div.row', {},
    h('span.what', {}, `${actionIcon(r.action)} ${actionLabel(r.action)}`),
    h('span', {}, `${r.requester}`),
    h('span.muted', {}, timeLabel),
  ));
  rows.push(h('div.detail', {}, r.detail.length > 120 ? r.detail.slice(0, 119) + '…' : r.detail));
  if (isPending) {
    rows.push(h('div.actions', {},
      h('button.btn.approve', {
        onclick() { send({ t: 'approval.approve', id: r.id }); },
      }, '✅ Approve'),
      h('button.btn.reject', {
        onclick() { send({ t: 'approval.reject', id: r.id }); },
      }, '❌ Reject'),
    ));
  } else {
    const by = r.decidedBy ? ` by ${r.decidedBy}` : '';
    rows.push(h('div.status', {}, `${statusIcon(r.status)} ${r.status}${by}`));
  }
  return rows;
}

/** How many pending approval requests there are. */
export function pendingApprovals(): number {
  return store.approvals.filter((r) => r.status === 'pending').length;
}

/** Render the approvals panel. */
export function renderApprovals() {
  const list = store.approvals;
  const el = $('approvals');
  const hasPending = list.some((r) => r.status === 'pending');
  const hasAny = list.length > 0;
  el.classList.toggle('hidden', !hasAny);
  if (!hasAny) return;
  el.replaceChildren(
    h('h3', {}, '🔐 Approvals', hasPending ? h('span.count', {}, String(list.filter((r) => r.status === 'pending').length)) : null, panelHide('approvals')),
    ...list.flatMap((r) => renderRow(r)),
  );
}
