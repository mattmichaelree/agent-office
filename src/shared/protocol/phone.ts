// Phone and SMS types for AgentPhone integration.

/** A phone call, as AgentPhone tracks it. */
export interface PhoneCall {
  id: string;
  /** The number that called. */
  from: string;
  /** The number that was called. */
  to: string;
  /** ringing | connected | completed | missed | failed */
  status: string;
  /** Call duration in seconds, once it's completed. */
  duration?: number;
  /** When the call started, ms since 1970. */
  startedAt: number;
}

/** An SMS message, as AgentPhone relays it. */
export interface SmsMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  /** When the message was sent, ms since 1970. */
  timestamp: number;
}

export type PhoneClientMsg =
  /** Ask for recent calls. */
  | { t: 'phone.get_calls'; limit?: number }
  /** Ask for recent SMS messages. */
  | { t: 'phone.get_messages'; limit?: number }
  /** Send an SMS. */
  | { t: 'phone.send_sms'; to: string; body: string };

export type PhoneServerMsg =
  /** Recent calls, in answer to phone.get_calls. */
  | { t: 'phone.calls'; calls: PhoneCall[] }
  /** Recent SMS messages, in answer to phone.get_messages. */
  | { t: 'phone.messages'; messages: SmsMessage[] }
  /** An SMS was sent. */
  | { t: 'phone.sent'; to: string; body: string; id: string }
  /** An error happened. */
  | { t: 'phone.error'; error: string };
