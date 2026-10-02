// The Command Center: aggregated office overview, costs, and attention items across all floors.
// New message types for the executive dashboard.

import type { WorkerInfo } from "./workers.js";

/** A cost snapshot across all floors for the command center dashboard. */
export interface CostSnapshot {
  today: { calls: number; inputTokens: number; outputTokens: number; cost: number; provider: string }[];
  totalCost: number;
  budget: number;
  budgetPercent: number;
}

/** A single item needing human attention: a worker waiting, a stalled PR, a finished task. */
export interface AttentionItem {
  kind: "waiting" | "finished" | "stalled" | "cost" | "approval";
  floorId: string;
  floorName: string;
  workerId?: string;
  workerName?: string;
  detail: string;
  urgency: "low" | "medium" | "high";
  ts: number;
}

/** Summary snapshot for the command center executive view. */
export interface CommandSummary {
  floors: number;
  totalWorkers: number;
  busyWorkers: number;
  waitingWorkers: number;
  totalCost: number;
  workers: { floorId: string; floorName: string; workers: WorkerInfo[] }[];
  attention: AttentionItem[];
}

export type CommandClientMsg = { t: "command.summary" };
export type CommandServerMsg = { t: "command.summary"; summary: CommandSummary };
