// AgentMail WebSocket handler: processes mailroom client messages.
import type { MailClientMsg } from "../../../shared/protocol.js";
import type { Ctx } from "../../office/context.js";
import { here } from "./common.js";
import type { HandlerMap } from "./types.js";
import { startMailroom, markRead, currentState } from "../../mailroom.js";

export const mailroomHandlers = {
  "mailroom.read"(ctx: Ctx, c, msg: Extract<MailClientMsg, { t: "mailroom.read" }>) {
    const id = msg.id;
    if (typeof id !== "string" || !id) return;
    markRead(ctx, id);
  },
  "mailroom.refresh"(ctx: Ctx, c) {
    const state = currentState();
    const { sendTo } = ctx;
    sendTo(c, { t: "mailroom", state });
  },
} satisfies HandlerMap<MailClientMsg>;
