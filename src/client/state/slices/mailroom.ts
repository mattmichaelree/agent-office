import type { Slice } from "../store";
import type { MailMessage, MailroomState } from "../../../shared/protocol.js";

declare module "../store" {
  interface Store {
    mailroom: MailroomState;
    mailUnread: number;
  }
  interface Topics {
    mailroom: true;
    mailUnread: true;
  }
}

export const mailroom: Slice = {
  init(s) {
    s.mailroom = { messages: [], loading: true };
    s.mailUnread = 0;
  },
  on: {
    "mailroom"(s, m) {
      s.mailroom = m.state;
      s.mailUnread = m.state.messages.filter((msg: MailMessage) => !msg.read).length;
      return ["mailroom", "mailUnread"];
    },
    "mailroom.new"(s, m) {
      const idx = s.mailroom.messages.findIndex((msg: MailMessage) => msg.id === m.message.id);
      if (idx >= 0) {
        s.mailroom.messages[idx] = m.message;
      } else {
        s.mailroom.messages.unshift(m.message);
      }
      s.mailUnread = s.mailroom.messages.filter((msg: MailMessage) => !msg.read).length;
      return ["mailroom", "mailUnread"];
    },
    "mailroom.read"(s, m) {
      const msg = s.mailroom.messages.find((msg2: MailMessage) => msg2.id === m.id);
      if (msg) {
        msg.read = true;
        s.mailUnread = s.mailroom.messages.filter((msg2: MailMessage) => !msg2.read).length;
        return ["mailroom", "mailUnread"];
      }
    },
  },
};