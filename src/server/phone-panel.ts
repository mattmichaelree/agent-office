// AgentPhone phone and SMS API integration.

// Reads AGENTPHONE_API_KEY and AGENTPHONE_API_URL from the environment.
// AGENTPHONE_API_URL defaults to https://agentphone.ai/api.

const BASE_URL = () => process.env.AGENTPHONE_API_URL || 'https://agentphone.ai/api';
const API_KEY = () => process.env.AGENTPHONE_API_KEY;

function headers(): Record<string, string> {
  const key = API_KEY();
  if (!key) return {};
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

export interface AgentPhoneCall {
  id: string;
  from_number: string;
  to_number: string;
  status: string;
  duration?: number;
  started_at: string;
}

export interface AgentPhoneMessage {
  id: string;
  from_number: string;
  to_number: string;
  body: string;
  created_at: string;
}

export interface AgentPhoneSendResult {
  id: string;
  status: string;
}

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T | { error: string }> {
  const key = API_KEY();
  if (!key) return { error: 'AGENTPHONE_API_KEY not set' };
  const url = new URL(path, BASE_URL());
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { error: `AgentPhone API ${res.status}: ${text}` };
    }
    return await res.json() as T;
  } catch (e: unknown) {
    return { error: `AgentPhone API error: ${(e as Error).message ?? e}` };
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T | { error: string }> {
  const key = API_KEY();
  if (!key) return { error: 'AGENTPHONE_API_KEY not set' };
  try {
    const res = await fetch(new URL(path, BASE_URL()), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { error: `AgentPhone API ${res.status}: ${text}` };
    }
    return await res.json() as T;
  } catch (e: unknown) {
    return { error: `AgentPhone API error: ${(e as Error).message ?? e}` };
  }
}

/** Recent calls, newest first. */
export async function listCalls(limit = 20): Promise<{ calls: CallInfo[] } | { error: string }> {
  const data = await apiGet<{ data: AgentPhoneCall[] }>('/calls', { limit: String(limit) });
  if ('error' in data) return data;
  // Normalize to our own shape regardless of what the API returns
  if ('data' in data) {
    return {
      calls: (data as { data: AgentPhoneCall[] }).data.map(normalizeCall),
    };
  }
  return { error: 'Unexpected AgentPhone API response' };
}

export interface CallInfo {
  id: string;
  from: string;
  to: string;
  status: string;
  duration?: number;
  startedAt: number;
}

function normalizeCall(c: AgentPhoneCall): CallInfo {
  return {
    id: c.id,
    from: c.from_number,
    to: c.to_number,
    status: c.status,
    duration: c.duration,
    startedAt: Date.parse(c.started_at),
  };
}

/** Recent SMS messages, newest first. */
export async function listMessages(limit = 20): Promise<{ messages: MessageInfo[] } | { error: string }> {
  const data = await apiGet<{ data: AgentPhoneMessage[] }>('/messages', { limit: String(limit) });
  if ('error' in data) return data;
  if ('data' in data) {
    return {
      messages: (data as { data: AgentPhoneMessage[] }).data.map(normalizeMessage),
    };
  }
  return { error: 'Unexpected AgentPhone API response' };
}

export interface MessageInfo {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
}

function normalizeMessage(m: AgentPhoneMessage): MessageInfo {
  return {
    id: m.id,
    from: m.from_number,
    to: m.to_number,
    body: m.body,
    timestamp: Date.parse(m.created_at),
  };
}

/** Send an SMS. */
export async function sendSms(to: string, body: string): Promise<{ id: string } | { error: string }> {
  const data = await apiPost<{ data: AgentPhoneSendResult }>('/messages', { to_number: to, body });
  if ('error' in data) return data;
  if ('data' in data) {
    return { id: (data as { data: AgentPhoneSendResult }).data.id };
  }
  return { error: 'Unexpected AgentPhone API response' };
}
