import type { RosterState } from '../../../shared/protocol';
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
    welcome(s, m) {
      s.roster = m.roster ?? { profiles: [] };
      return ['roster'];
    },
    'roster.state'(s, m) {
      s.roster = m.state;
      return ['roster'];
    },
  },
};
