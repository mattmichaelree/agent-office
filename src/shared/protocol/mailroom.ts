// AgentMail: messages and state for the incoming mail inbox panel.
// Polled by the server from AgentMail's REST API every 60s.

/** One message from the AgentMail inbox. */
export interface MailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  /** Plain-text body preview (first ~200 chars). */
  preview: string;
  /** ISO timestamp from the API. */
  receivedAt: string;
  read: boolean;
}

/** The inbox panel's state. */
export interface MailroomState {
  messages: MailMessage[];
  error?: string;
  loading: boolean;
}

export type MailClientMsg =
  /** Mark one message as read. */
  | { t: 'mailroom.read'; id: string }
  /** Force a refresh now. */
  | { t: 'mailroom.refresh' };

export type MailServerMsg =
  /** Full state sent on connect / refresh. */
  | { t: 'mailroom'; state: MailroomState }
  /** A new message arrived. */
  | { t: 'mailroom.new'; message: MailMessage }
  /** A message was marked read. */
  | { t: 'mailroom.read'; id: string };
