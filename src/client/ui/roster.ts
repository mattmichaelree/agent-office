import { store } from '../state';
import type { AgentProfile } from '../../shared/protocol';
import { $, h } from './dom';
import { modelBadge, providerLabel } from './provider';
import type { Net } from '../net';

/** Open the roster panel as a modal. */
export function openRosterPanel(net: Net, onHire: (profileName: string) => void): void {
  const modal = h('div.modal.roster-panel', {});
  modal.append(
    h('header', {},
      h('h2', {}, 'Agents Roster'),
      h('button.btn.close', { type: 'button', 'aria-label': 'Close', onclick: () => modal.remove() }, 'X'),
    ),
    h('div.body', {}, ...renderRoster(net, onHire)),
  );
  $('modal-root').append(modal);
}

function renderRoster(net: Net, onHire: (profileName: string) => void): HTMLElement[] {
  const parts: HTMLElement[] = [];
  const byDept = new Map<string, AgentProfile[]>();
  for (const p of store.roster.profiles) {
    const list = byDept.get(p.department);
    if (list) list.push(p);
    else byDept.set(p.department, [p]);
  }
  for (const [dept, agents] of byDept) {
    parts.push(h('div.roster-dept', {}, dept));
    const list = h('ul', { style: 'list-style:none;margin:0;padding:0' });
    for (const a of agents) {
      const badge = modelBadge(a.provider, a.model, a.effort, undefined);
      list.append(
        h('li.roster-agent', {},
          h('div.info', {},
            h('span.name', {}, a.name),
            h('span.brief', {}, a.brief),
            badge ? h('span.provider-badge', {}, badge) : null,
          ),
          h('button.btn', { type: 'button', onclick: () => onHire(a.name) }, 'Hire'),
        ),
      );
    }
    parts.push(list);
  }
  if (!parts.length) {
    parts.push(h('p', { style: 'color:var(--muted);text-align:center;padding:20px' }, 'No agents on the roster. Add some in /.agent-office/roster.json'));
  }
  return parts;
}
