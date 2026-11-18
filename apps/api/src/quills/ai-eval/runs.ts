import type { Kit } from "./suite";

export type RunView = {
  status: "pending" | "succeeded" | "failed";
  output: {
    text: string | null;
    citations: { id: string; title: string }[];
    proposedActionIds: string[];
    values: { key: string; value: unknown; reason?: string }[];
  } | null;
  error: string | null;
};

/** Runs the jobs, then reads the run through the shipped route. */
export async function finishedRun(kit: Kit, runId: string) {
  const failed = await kit.settle();
  const read = await kit.api(kit.h.owner, `/assistant/runs/${runId}`);
  return { failed, run: read.body as RunView };
}
