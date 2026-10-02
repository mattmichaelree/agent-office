// Command Center API: aggregated office overview, costs, and attention across all floors.
import type { Ctx } from "../../office/context.js";
import { send } from "../util.js";
import type { Route } from "../router.js";
import type { CommandSummary, AttentionItem } from "../../../shared/protocol/command.js";

function waiting(w: any): boolean { return w.status === 'needs_input' || w.status === 'done'; }
function busy(w: any): boolean { return w.status === 'working'; }
function alive(w: any): boolean { return w.status !== 'exited' && w.status !== 'offline'; }

function buildAttention(ctx: Ctx): AttentionItem[] {
  const items: AttentionItem[] = [];
  const now = Date.now();
  for (const floor of ctx.floors.values()) {
    for (const w of floor.workers.list()) {
      if (!alive(w) || !waiting(w)) continue;
      const task = (w as any).task;
      items.push({ kind: "waiting", floorId: floor.id, floorName: (floor.def?.name ?? floor.id), workerId: w.id, workerName: w.name, detail: task?.name ?? task?.summary ?? "Waiting", urgency: "medium", ts: now });
    }
  }
  return items;
}

function buildSummary(ctx: Ctx): CommandSummary {
  const workers: any[] = [];
  let totalWorkers = 0, busyWorkers = 0, waitingWorkers = 0, totalCost = 0;
  for (const floor of ctx.floors.values()) {
    const list = floor.workers.list().filter(alive);
    if (list.length === 0) continue;
    const infos = list.map((w: any) => ({ id: w.id, name: w.name, provider: w.provider, model: w.model, task: w.task?.name ?? w.task?.summary, waiting: waiting(w), busy: busy(w), alive: true, deskId: w.deskId, floor: floor.def?.name ?? floor.id, cost: w.usage?.cost ?? 0, calls: w.usage?.calls ?? 0 }));
    totalWorkers += infos.length;
    busyWorkers += list.filter(busy).length;
    waitingWorkers += list.filter(waiting).length;
    totalCost += infos.reduce((s: number, wi: any) => s + wi.cost, 0);
    workers.push({ floorId: floor.id, floorName: floor.def?.name ?? floor.id, workers: infos });
  }
  return { floors: ctx.floors.size, totalWorkers, busyWorkers, waitingWorkers, totalCost, workers, attention: buildAttention(ctx) };
}

export const commandRoutes = {
  summary: { path: "/api/command/summary", auth: "session" as const, handle: (ctx: Ctx, { res }: any) => send(res, 200, buildSummary(ctx)) },
} satisfies Record<string, Route>;
