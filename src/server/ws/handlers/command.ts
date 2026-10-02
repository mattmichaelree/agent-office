// Command Center WS handler: sends aggregated overview on request.
import type { Ctx } from "../../office/context.js";
import type { Client } from "../../office/client.js";
import type { HandlerMap } from "./types.js";
import type { CommandClientMsg } from "../../../shared/protocol.js";

function waiting(w: any): boolean { return w.status === 'needs_input' || w.status === 'done'; }
function alive(w: any): boolean { return w.status !== 'exited' && w.status !== 'offline'; }

export const commandHandlers: HandlerMap<CommandClientMsg> = {
  "command.summary": (ctx: Ctx, _c: Client, _msg: CommandClientMsg) => {
    const att: any[] = [];
    const now = Date.now();
    for (const floor of ctx.floors.values()) {
      for (const w of floor.workers.list()) {
        if (!alive(w) || !waiting(w)) continue;
        const task = (w as any).task;
        att.push({ kind: "waiting", floorId: floor.id, floorName: (floor.def?.name ?? floor.id), workerId: w.id, workerName: w.name, detail: task?.name ?? task?.summary ?? "Waiting", urgency: "medium", ts: now });
      }
    }
    const workers: any[] = [];
    let totalWorkers = 0, busyWorkers = 0, waitingWorkers = 0, totalCost = 0;
    for (const floor of ctx.floors.values()) {
      const list = floor.workers.list().filter(alive);
      if (list.length === 0) continue;
      const infos = list.map((w: any) => ({ id: w.id, name: w.name, provider: w.provider, model: w.model, task: w.task?.name ?? w.task?.summary, waiting: waiting(w), busy: (w.status === 'working'), alive: true, deskId: w.deskId, floor: floor.def?.name ?? floor.id, cost: w.usage?.cost ?? 0, calls: w.usage?.calls ?? 0 }));
      totalWorkers += infos.length;
      busyWorkers += list.filter((w: any) => w.status === 'working').length;
      waitingWorkers += list.filter(waiting).length;
      totalCost += infos.reduce((s: number, wi: any) => s + wi.cost, 0);
      workers.push({ floorId: floor.id, floorName: floor.def?.name ?? floor.id, workers: infos });
    }
    (_c as any).send({ t: "command.summary", summary: { floors: ctx.floors.size, totalWorkers, busyWorkers, waitingWorkers, totalCost, workers, attention: att } });
  },
};
