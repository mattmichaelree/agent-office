import type { RosterState } from '../../../shared/protocol.js';
import type { Slice } from '../store';

declare module '../store' {
  interface Store {
    roster: RosterState;
  }
  interface Topics {
    roster: true;
  }
}

export const roster: Slice = {
  init(s) {
    s.roster = { profiles: [] };
  },
  on: {
    'roster.state'(s, m) {
      s.roster = m.state;
      return ['roster'];
    },
  },
};