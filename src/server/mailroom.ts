// AgentMail inbox: polls the REST API every 60s, caches messages, and broadcasts updates.
import { WebSocket } from "ws";
import type { Ctx } from "./office/context.js";
import type { MailMessage, MailroomState } from "../shared/protocol.js";

const POLL_INTERVAL = 60_000;
const PREVIEW_LEN = 200;
const DROPPABLE_AFTER = 4 * 1024 * 1024;

function agentMailConfig(): { base: string; auth: string } | undefined {
  const key = process.env.AGENTMAIL_POD_KEY;
  if (!key) return undefined;
  const parts = key.split("@");
  const podKey = parts[0];
  const inboxId = parts.length > 1 ? parts[1] : "default";
  return { base: `https://agentmail.api/v1/inboxes/${inboxId}`, auth: `Bearer ${podKey}` };
}

async function fetchMessages(): Promise<{ messages: MailMessage[]; error?: string }> {
  const cfg = agentMailConfig();
  if (!cfg) return { messages: [], error: "AGENTMAIL_POD_KEY not set" };
  try {
    const res = await fetch(cfg.base, {
      headers: { Authorization: cfg.auth, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { messages: [], error: `AgentMail API ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as {
      messages?: Array<{ id: string; from: string; to: string; subject: string; body_text?: string; received_at: string }>;
    };
    const raw = data.messages ?? [];
    const messages: MailMessage[] = raw.map((m) => ({
      id: m.id,
      from: m.from,
      to: m.to,
      subject: m.subject,
      preview: (m.body_text ?? "").slice(0, PREVIEW_LEN).replace(/\s+/g, " ").trim(),
      receivedAt: m.received_at,
      read: false,
    }));
    return { messages };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Abort")) return { messages: [], error: "AgentMail API timed out" };
    return { messages: [], error: msg };
  }
}

let pollTimer: ReturnType<typeof setInterval> | undefined;
let lastState: MailroomState = { messages: [], loading: true };

function mergeMessages(fresh: MailMessage[]): MailMessage[] {
  const known = new Map(lastState.messages.map((m) => [m.id, m]));
  for (const m of fresh) {
    const prev = known.get(m.id);
    if (prev) { m.read = prev.read; m.preview = prev.preview || m.preview; }
    known.set(m.id, m);
  }
  return [...known.values()].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

async function doPoll(ctx: Ctx) {
  const { messages: fresh, error } = await fetchMessages();
  const messages = mergeMessages(fresh);
  const prevIds = new Set(lastState.messages.map((m) => m.id));
  const state: MailroomState = { messages, error, loading: false };
  lastState = state;
  const full = { t: "mailroom", state };
  const json = JSON.stringify(full);
  for (const c of ctx.clients.values()) {
    if (c.ws.readyState === WebSocket.OPEN) c.ws.send(json);
  }
  for (const m of messages) {
    if (prevIds.has(m.id)) continue;
    const alert = { t: "mailroom.new", message: m };
    const aj = JSON.stringify(alert);
    for (const c of ctx.clients.values()) {
      if (c.ws.readyState === WebSocket.OPEN && !(c.ws.bufferedAmount > DROPPABLE_AFTER)) c.ws.send(aj);
    }
  }
}

export function startMailroom(ctx: Ctx) {
  if (pollTimer) return;
  doPoll(ctx);
  pollTimer = setInterval(() => doPoll(ctx), POLL_INTERVAL);
}

export function stopMailroom() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = undefined; }
}

export function markRead(ctx: Ctx, id: string) {
  for (const m of lastState.messages) { if (m.id === id) { m.read = true; break; } }
  const msg = { t: "mailroom.read", id };
  const json = JSON.stringify(msg);
  for (const c of ctx.clients.values()) {
    if (c.ws.readyState === WebSocket.OPEN) c.ws.send(json);
  }
}

export function currentState(): MailroomState { return lastState; }
