// Phone and SMS WebSocket handlers.

import type { PhoneClientMsg } from '../../../shared/protocol.js';
import type { Ctx } from '../../office/context.js';
import type { HandlerMap } from './types.js';
import { listCalls, listMessages, sendSms } from '../../phone-panel.js';

export const phoneHandlers = {
  'phone.get_calls'(ctx: Ctx, c, msg: PhoneClientMsg) {
    void (async () => {
      const limit = (msg as { t: 'phone.get_calls'; limit?: number }).limit ?? 20;
      const result = await listCalls(limit);
      if ('error' in result) {
        ctx.sendTo(c, { t: 'phone.error', error: result.error });
      } else {
        ctx.sendTo(c, {
          t: 'phone.calls',
          calls: result.calls.map((call) => ({
            id: call.id,
            from: call.from,
            to: call.to,
            status: call.status,
            duration: call.duration,
            startedAt: call.startedAt,
          })),
        });
      }
    })();
  },
  'phone.get_messages'(ctx: Ctx, c, msg: PhoneClientMsg) {
    void (async () => {
      const limit = (msg as { t: 'phone.get_messages'; limit?: number }).limit ?? 20;
      const result = await listMessages(limit);
      if ('error' in result) {
        ctx.sendTo(c, { t: 'phone.error', error: result.error });
      } else {
        ctx.sendTo(c, {
          t: 'phone.messages',
          messages: result.messages.map((m) => ({
            id: m.id,
            from: m.from,
            to: m.to,
            body: m.body,
            timestamp: m.timestamp,
          })),
        });
      }
    })();
  },
  'phone.send_sms'(ctx: Ctx, c, msg: PhoneClientMsg) {
    void (async () => {
      const { to, body } = msg as { t: 'phone.send_sms'; to: string; body: string };
      if (!to || !body) {
        ctx.sendTo(c, { t: 'phone.error', error: 'Both "to" and "body" are required.' });
        return;
      }
      const result = await sendSms(to, body);
      if ('error' in result) {
        ctx.sendTo(c, { t: 'phone.error', error: result.error });
      } else {
        ctx.sendTo(c, { t: 'phone.sent', to, body, id: result.id });
      }
    })();
  },
} satisfies HandlerMap<PhoneClientMsg>;
