import type { Capability } from "@quills/ai/capability";
import {
  withQuillsSystemWorkspace,
  type Database,
} from "../../../database/quills/client";
import type { DeliveryEvent } from "../../jobs/fanout";
import { nothing, type Work } from "../engine/shared";
import { aiConfig, embed } from "../provider";
import { logUsage, type UsageEntry } from "../runs";
import { AiError } from "./errors";
import { runCapability } from "./run";

// The store template for AI work on the quills.ai queue (assistant/ai/README.md). It keeps the
// rules every AI job must follow: read in a short system-scoped transaction, call the model with no
// transaction open, then write the result, its usage rows and its events in the job's own
// transaction, which commits together with the job.

/** A job's model access: every call is logged and checked against the time budget. */
export type AiJobRun = {
  /** Runs a capability; its usage row is written with the result. */
  capability: <Input, Output>(
    capability: Capability<Input, Output>,
    input: Input,
  ) => Promise<Output>;
  /** Embeddings for up to 64 texts, logged under `step`. */
  embed: (texts: string[], step: string) => Promise<number[][]>;
  /** A short read between model calls, in its own system-scoped transaction. */
  read: <T>(work: (db: Database) => Promise<T>) => Promise<T>;
};

export type AiJob<Context, Result> = {
  /** Reads what the model needs. Null means there is nothing to do. */
  read: (db: Database, event: DeliveryEvent) => Promise<Context | null>;
  /** Calls the model, with no transaction open. */
  run: (context: Context, ai: AiJobRun) => Promise<Result>;
  /** Stores the result in the job's transaction. The usage rows are already written. */
  write: (db: Database, context: Context, result: Result) => Promise<void>;
  /**
   * Without a provider, or when a provider call fails, this write runs instead (for example, keep
   * the AI's first text). Without it, a provider failure fails the job, which then retries; the
   * usage of the calls that succeeded is logged first.
   */
  fallback?: (db: Database, context: Context) => Promise<void>;
  /** No model call starts after this long, so the job ends inside its five-minute lease. */
  budgetMs?: number;
};

const BUDGET_MS = 180_000;

/** Builds the queue work of an AI job from its read, run and write. */
export function defineAiJob<Context, Result>(
  job: AiJob<Context, Result>,
): Work {
  return async (workspaceId, event) => {
    if (!aiConfig() && !job.fallback) return nothing;
    const context = await withQuillsSystemWorkspace(workspaceId, (db) =>
      job.read(db, event),
    );
    if (context === null) return nothing;
    const usage: UsageEntry[] = [];
    const fallback = job.fallback;
    if (!aiConfig() && fallback) return (db) => fallback(db, context);
    const deadline = Date.now() + (job.budgetMs ?? BUDGET_MS);
    const inTime = () => {
      if (Date.now() > deadline) throw new AiError("timeout");
    };
    const ai: AiJobRun = {
      capability: async (capability, input) => {
        inTime();
        const answer = await runCapability(capability, input);
        usage.push(answer.entry);
        return answer.value;
      },
      embed: async (texts, step) => {
        inTime();
        const result = await embed(texts);
        usage.push({ step, callType: "embedding", usage: result.usage });
        return result.vectors;
      },
      read: (work) => withQuillsSystemWorkspace(workspaceId, work),
    };
    try {
      const result = await job.run(context, ai);
      return async (db) => {
        await logUsage(db, usage);
        await job.write(db, context, result);
      };
    } catch (error) {
      if (!(error instanceof AiError)) throw error;
      if (fallback)
        return async (db) => {
          await logUsage(db, usage);
          await fallback(db, context);
        };
      // The calls that succeeded count toward the monthly limit even though the job fails and
      // retries, so their rows go in now, in their own short transaction.
      if (usage.length)
        await withQuillsSystemWorkspace(workspaceId, (db) =>
          logUsage(db, usage),
        );
      throw error;
    }
  };
}
