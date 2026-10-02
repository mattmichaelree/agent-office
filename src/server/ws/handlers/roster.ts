// WebSocket handler for roster CRUD and quick-hire.
import { isAgentProvider, isAgentEffort, type RosterClientMsg } from '../../../shared/protocol.js';
import type { HandlerMap, ViewPieces } from './types.js';
import { here } from './common.js';
import { str } from '../../office/input.js';
import * as roster from '../../roster.js';

export const rosterView: ViewPieces['roster'] = (_ctx, _floor) => roster.state();

export const rosterHandlers = {
  'roster.list'(ctx, c) {
    ctx.sendTo(c, { t: 'roster.state', state: roster.state() });
  },
  'roster.upsert'(ctx, c, msg) {
    if (!c.accountId) return ctx.warn(c, 'Sign in first to manage the roster');
    const p = msg.profile;
    if (!p || !p.name || !p.brief || !p.department) return ctx.warn(c, 'name, brief, and department are required');
    if (!isAgentProvider(p.provider)) return ctx.warn(c, 'Unknown agent provider');
    const profile: import('../../../shared/protocol.js').AgentProfile = {
      name: str(p.name, 64),
      brief: str(p.brief, 200),
      provider: p.provider,
      model: p.model ? str(p.model, 64) : undefined,
      effort: isAgentEffort(p.effort) ? p.effort : undefined,
      tools: p.tools,
      department: str(p.department, 64),
    };
    const state = roster.upsert(profile);
    ctx.broadcast({ t: 'roster.state', state });
    ctx.toastFloor(ctx.floorOf(c)!, `${c.peer.name} updated roster: ${profile.name}`);
  },
  'roster.remove'(ctx, c, msg) {
    if (!c.accountId) return ctx.warn(c, 'Sign in first to manage the roster');
    const name = str(msg.name, 64);
    const state = roster.remove(name);
    if (!state) return ctx.warn(c, `No profile named "${name}"`);
    ctx.broadcast({ t: 'roster.state', state });
  },
  'roster.hire'(ctx, c, msg) {
    const who = c.peer.name;
    const floor = here(ctx, c);
    if (!floor) return;
    const profileName = str(msg.profileName, 64);
    const profile = roster.find(profileName);
    if (!profile) return ctx.warn(c, `No roster profile named "${profileName}"`);
    const deskId = str(msg.deskId, 32);
    if (!deskId) return ctx.warn(c, 'A deskId is required');
    ctx.withSignIn(c, ctx.claudeFor(profile.provider), () => {
      const r = floor.workers.spawn(deskId, who, str(msg.prompt, 20000) || undefined, msg.worktree === true, 'agent', profile.provider, profile.model, profile.effort, undefined, c.accountId, [], undefined);
      if (typeof r === 'string') ctx.warn(c, r);
      else ctx.toastFloor(floor, `${who} hired ${r.name} from roster (${profile.department})`);
    });
  },
} satisfies HandlerMap<RosterClientMsg>;
