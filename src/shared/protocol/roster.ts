// Persistent worker roster with named agent profiles: who you can hire quickly, with their
// provider, model, and department, kept in a JSON file in /.agent-office/roster.json.

import type { AgentEffort, AgentProvider } from './agents.js';

/** A named agent profile on the roster: who can be hired and what they run on. */
export interface AgentProfile {
  /** Display name shown in the "Hire" panel. */
  name: string;
  /** One-line description of what the agent is for. */
  brief: string;
  /** Agent provider (claude, codex, grok, opencode, etc.). */
  provider: AgentProvider;
  /** Model alias or id for the provider. */
  model?: string;
  /** Reasoning effort (low, high). */
  effort?: AgentEffort;
  /** Which tools the agent can access: 'all' or an explicit list. */
  tools?: string[] | 'all';
  /** Department grouping label, e.g. "Engineering", "Operations", "Marketing". */
  department: string;
}

/** The roster state sent on welcome and on every change. */
export interface RosterState {
  profiles: AgentProfile[];
}

// - Client -> Server messages ------------------------------------------------------------
export type RosterClientMsg =
  | { t: 'roster.list' }
  | { t: 'roster.upsert'; profile: AgentProfile }
  | { t: 'roster.remove'; name: string }
  | { t: 'roster.hire'; profileName: string; deskId: string; prompt?: string; worktree?: boolean };

// - Server -> Client messages ------------------------------------------------------------
export type RosterServerMsg =
  | { t: 'roster.state'; state: RosterState };
