// Persistent worker roster: named agent profiles loaded from a JSON file on disk, served over CRUD
// and used to hire agents quickly from the UI.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

import type { AgentProfile, RosterState } from '../shared/protocol.js';

/** The path to the roster file. */
const ROSTER_PATH = '/.agent-office/roster.json';

function defaultRoster(): RosterState {
  return {
    profiles: [
      { name: 'Developer', brief: 'Full-stack developer for feature work', provider: 'claude', model: undefined, effort: undefined, tools: 'all', department: 'Engineering' },
      { name: 'Ops', brief: 'DevOps and infrastructure automation', provider: 'claude', model: undefined, effort: undefined, tools: 'all', department: 'Operations' },
      { name: 'Marketing', brief: 'Content and marketing campaigns', provider: 'claude', model: undefined, effort: undefined, tools: 'all', department: 'Marketing' },
    ],
  };
}

/** Ensure the roster JSON file exists, creating it with defaults if needed. */
function ensureRosterFile(): void {
  if (existsSync(ROSTER_PATH)) return;
  const dir = dirname(ROSTER_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(ROSTER_PATH, JSON.stringify(defaultRoster(), null, 2) + '\n', 'utf8');
}

/** Load the roster from disk, returning the parsed state. */
export function load(): RosterState {
  ensureRosterFile();
  try {
    const raw = JSON.parse(readFileSync(ROSTER_PATH, 'utf8')) as Partial<RosterState>;
    if (Array.isArray(raw?.profiles)) return raw as RosterState;
  } catch { /* falls through to defaults */ }
  return defaultRoster();
}

/** Save the roster state to disk. */
export function save(state: RosterState): void {
  ensureRosterFile();
  writeFileSync(ROSTER_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

/** Replace the entire roster with a new list of profiles. */
export function replace(profiles: AgentProfile[]): RosterState {
  const state: RosterState = { profiles };
  save(state);
  return state;
}

/** Add or update a profile by name. Returns the updated state. */
export function upsert(profile: AgentProfile): RosterState {
  const state = load();
  const idx = state.profiles.findIndex((p) => p.name === profile.name);
  if (idx >= 0) state.profiles[idx] = profile;
  else state.profiles.push(profile);
  save(state);
  return state;
}

/** Remove a profile by name. Returns the updated state, or undefined if not found. */
export function remove(name: string): RosterState | undefined {
  const state = load();
  const idx = state.profiles.findIndex((p) => p.name === name);
  if (idx < 0) return undefined;
  state.profiles.splice(idx, 1);
  save(state);
  return state;
}

/** Find a profile by name, or undefined. */
export function find(name: string): AgentProfile | undefined {
  return load().profiles.find((p) => p.name === name);
}

/** Return the current state always. */
export function state(): RosterState {
  return load();
}
