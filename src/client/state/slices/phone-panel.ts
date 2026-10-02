// Phone and SMS panel state slice.

import type { PhoneCall, SmsMessage } from '../../../shared/protocol';
import type { Slice } from '../store';

declare module '../store' {
  interface Store {
    /** The state of the phone/SMS panel. */
    phone: PhoneState;
  }
  interface Topics {
    phone: true;
  }
}

export interface PhoneState {
  /** Recent calls, newest first. */
  calls: PhoneCall[];
  /** Recent SMS messages, newest first. */
  messages: SmsMessage[];
  /** Whether a list of calls is being fetched. */
  loadingCalls: boolean;
  /** Whether messages are being fetched. */
  loadingMessages: boolean;
  /** Whether an SMS is being sent. */
  sending: boolean;
  /** Last error, if any. */
  error?: string;
}

export const phone: Slice = {
  init(s) {
    s.phone = {
      calls: [],
      messages: [],
      loadingCalls: false,
      loadingMessages: false,
      sending: false,
    };
  },
  on: {
    'phone.calls'(s, m) {
      s.phone = { ...s.phone, calls: m.calls, loadingCalls: false };
      return ['phone'];
    },
    'phone.messages'(s, m) {
      s.phone = { ...s.phone, messages: m.messages, loadingMessages: false };
      return ['phone'];
    },
    'phone.sent'(s, m) {
      // Prepend the sent message to the list.
      const msg: SmsMessage = { id: m.id, from: '', to: m.to, body: m.body, timestamp: Date.now() };
      s.phone = { ...s.phone, messages: [msg, ...s.phone.messages], sending: false };
      return ['phone'];
    },
    'phone.error'(s, m) {
      s.phone = { ...s.phone, error: m.error, loadingCalls: false, loadingMessages: false, sending: false };
      return ['phone'];
    },
  },
};
